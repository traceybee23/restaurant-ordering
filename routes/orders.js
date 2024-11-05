const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const authMiddleware = require("../middleware/authMiddleware");

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

// Place a new order (customer-facing route, no authentication required)
router.post(
    "/",
    [
        body("name")
            .notEmpty()
            .withMessage("Name is required")
            .isString()
            .withMessage("Name must be a string")
            .isLength({ min: 1, max: 100 })
            .withMessage("Name must be between 1 and 100 characters"),
        body("items")
            .isArray({ min: 1 })
            .withMessage("Order must contain at least one item"),
        body("items.*.item_id")
            .isMongoId()
            .withMessage("Invalid item ID format"),
        body("items.*.quantity")
            .isInt({ min: 1 })
            .withMessage("Quantity must be at least 1"),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, items } = req.body;

        try {
            // Fetch each item from the menu and calculate total price
            let totalPrice = 0;
            const orderItems = [];

            for (const item of items) {
                const menuItem = await MenuItem.findById(item.item_id);

                if (!menuItem || !menuItem.available) {
                    const error = new Error(
                        `Item with ID ${item.item_id} is not available`
                    );
                    error.statusCode = 400;
                    throw error;
                }

                // Calculate the price for the item based on quantity
                const itemTotal = menuItem.price * item.quantity;
                totalPrice += itemTotal;

                // Add item details to order items list
                orderItems.push({
                    item_id: menuItem._id,
                    quantity: item.quantity,
                    price: menuItem.price,
                    itemTotal,
                });
            }

            // Create the order in the database
            const newOrder = new Order({
                name,
                items: orderItems,
                total_price: totalPrice,
                status: "Pending",
                payment_status: false, // default to unpaid, can be updated later
            });

            await newOrder.save();
            res.status(201).json({
                message: "Order placed successfully",
                order: newOrder,
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get all orders - Admin only, with optional filtering by status
router.get("/", authMiddleware, async (req, res, next) => {
    const { status } = req.query;

    try {
        const query = {};
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query).populate(
            "items.item_id",
            "name price"
        );
        res.json(orders);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
