const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const authMiddleware = require("../middleware/authMiddleware");
// const nodemailer = require('nodemailer');
const { Client, Environment } = require('square');

const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Sandbox // Use Environment.Production for live transactions
});


// Place an order and generate a Square Payment Link
router.post(
    '/create-checkout-link',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('A valid email is required'),
        body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
        body('items.*.item_id').isMongoId().withMessage('Invalid item ID format'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, items } = req.body;

        try {
            // Prepare line items for Square
            const lineItems = [];

            for (const item of items) {
                const menuItem = await MenuItem.findById(item.item_id);
                if (!menuItem || !menuItem.available) {
                    const error = new Error(`Item with ID ${item.item_id} is not available`);
                    error.statusCode = 400;
                    throw error;
                }

                // Prepare lineItems for Square
                lineItems.push({
                    item_id: item.item_id,
                    name: menuItem.name,
                    quantity: item.quantity.toString(),
                    itemType: 'ITEM',
                    basePriceMoney: {
                        amount: Math.round(menuItem.price * 100), // Amount in cents
                        currency: 'USD'
                    }
                });

            }

            // Create the Square Payment Link request payload
            const paymentLinkRequest = {
                order: {
                    locationId: process.env.SQUARE_LOCATION_ID,
                    lineItems: lineItems
                },
                checkoutOptions: {
                    redirectUrl: 'https://yourwebsite.com/order-confirmation' // Replace with your confirmation page URL
                },
                customerEmail: email // Optional: customer email for order record
            };

            // Generate the payment link with Square's Payment Links API
            const response = await squareClient.checkoutApi.createPaymentLink(paymentLinkRequest);

            if (response.result.errors) {
                console.error("Square API Errors:", JSON.stringify(response.result.errors, null, 2));
                throw new Error(response.result.errors.map(err => err.detail).join(', '));
            }

            // Save the order in the database (optional but recommended for record-keeping)
            const newOrder = new Order({
                name,
                email,
                items: lineItems,
                total_price: lineItems.reduce((total, item) => total + item.basePriceMoney.amount, 0) / 100,
                status: 'Pending',
                payment_status: false // Update this after payment confirmation
            });
            await newOrder.save();

            res.json({
                checkoutUrl: response.result.paymentLink.url, // URL to Square's payment link page
                totalPrice: lineItems.reduce((total, item) => total + item.basePriceMoney.amount, 0) / 100 // Total in dollars
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update order status - Admin only
router.patch(
    "/:id/status",
    authMiddleware,
    [
        body("status")
            .isIn(["Pending", "Completed", "Cancelled"])
            .withMessage(
                "Status must be either Pending, Completed, or Cancelled"
            ),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { status } = req.body;

        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ message: "Order not found" });
            }

            // Update the order status
            order.status = status;
            await order.save();

            res.json({ message: "Order status updated successfully", order });
        } catch (error) {
            next(error);
        }
    }
);

// // Place a new order (customer-facing route, no authentication required)
// router.post(
//     "/",
//     [
//         body("name")
//             .notEmpty()
//             .withMessage("Name is required")
//             .isString()
//             .withMessage("Name must be a string")
//             .isLength({ min: 1, max: 100 })
//             .withMessage("Name must be between 1 and 100 characters"),
//         body("email").isEmail().withMessage("A valid email is required"),
//         body("items")
//             .isArray({ min: 1 })
//             .withMessage("Order must contain at least one item"),
//         body("items.*.item_id")
//             .isMongoId()
//             .withMessage("Invalid item ID format"),
//         body("items.*.quantity")
//             .isInt({ min: 1 })
//             .withMessage("Quantity must be at least 1"),
//     ],
//     async (req, res, next) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }

//         const { name, email, items } = req.body;

//         try {
//             // Fetch each item from the menu and calculate total price
//             let totalPrice = 0;
//             const orderItems = [];

//             for (const item of items) {
//                 const menuItem = await MenuItem.findById(item.item_id);

//                 if (!menuItem || !menuItem.available) {
//                     const error = new Error(
//                         `Item with ID ${item.item_id} is not available`
//                     );
//                     error.statusCode = 400;
//                     throw error;
//                 }

//                 // Calculate the price for the item based on quantity
//                 const itemTotal = menuItem.price * item.quantity;
//                 totalPrice += itemTotal;

//                 // Add item details to order items list
//                 orderItems.push({
//                     item_id: menuItem._id,
//                     quantity: item.quantity,
//                     price: menuItem.price,
//                     itemTotal,
//                 });
//             }

//             // Create the order in the database
//             const newOrder = new Order({
//                 name,
//                 email,
//                 items: orderItems,
//                 total_price: totalPrice,
//                 status: "Pending",
//                 payment_status: false, // default to unpaid, can be updated later
//             });

//             await newOrder.save();

//             // // Configure Nodemailer transporter
//             // const transporter = nodemailer.createTransport({
//             //     host: 'smtp.ethereal.email', // Use Ethereal for testing
//             //     port: 587,
//             //     auth: {
//             //         user: 'maximillia85@ethereal.email', // replace with your Ethereal user
//             //         pass: 'DzFEHcwdXTEVEwMH5d' // replace with your Ethereal password
//             //     }
//             // });

//             // // Email options
//             // const mailOptions = {
//             //     from: '"Restaurant" <no-reply@restaurant.com>',
//             //     to: email,
//             //     subject: 'Order Confirmation',
//             //     text: `Hello ${name},\n\nThank you for your order! Here are your order details:\n\nTotal Price: $${totalPrice}\nStatus: Pending\n\nThank you for ordering with us!`,
//             //     html: `<p>Hello ${name},</p><p>Thank you for your order! Here are your order details:</p><ul><li>Total Price: $${totalPrice}</li><li>Status: Pending</li></ul><p>Thank you for ordering with us!</p>`
//             // };

//             // // Send email
//             // await transporter.sendMail(mailOptions);

//             res.status(201).json({
//                 message: "Order placed successfully",
//                 order: newOrder,
//             });
//         } catch (error) {
//             next(error);
//         }
//     }
// );

// Get all orders - Admin only, with optional filtering by status
router.get("/", authMiddleware, async (req, res, next) => {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    try {
        const query = {};
        if (status) {
            query.status = status;
        }

        // Calculate the number of documents to skip based on the current page and limit
        const skip = (page - 1) * limit;

        // Fetch orders with filtering, pagination, and populate
        const orders = await Order.find(query)
            .skip(skip)
            .limit(limit)
            .populate("items.item_id", "name price");

        // Get the total number of documents that match the query
        const totalOrders = await Order.countDocuments(query);

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
