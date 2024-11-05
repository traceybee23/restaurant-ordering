const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new menu item - Admin only
router.post('/', authMiddleware, async (req, res) => {
    const { name, description, price, category, available } = req.body;

    try {
        const newItem = new MenuItem({
            name,
            description,
            price,
            category,
            available: available ?? true
        });
        await newItem.save();

        res.status(201).json({ message: 'Menu item created successfully', newItem });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
