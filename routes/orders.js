const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/authMiddleware');

// Get all orders - Admin only
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().populate('items.item_id', 'name price');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Create a new order
router.post('/', async (req, res) => {
    const { items, total_price } = req.body;

    try {
        // Check if each item exists in the menu
        for (let item of items) {
            const menuItem = await MenuItem.findById(item.item_id);
            if (!menuItem || !menuItem.available) {
                return res.status(400).json({ message: `Item ${item.item_id} is not available` });
            }
        }

        // Create a new order
        const newOrder = new Order({
            items,
            total_price,
            status: 'Pending',
            payment_status: false
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
