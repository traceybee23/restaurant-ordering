const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/authMiddleware');

// Update an existing menu item - Admin only
router.put('/:id', authMiddleware, async (req, res) => {
    const { name, description, price, category, available } = req.body;

    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Update fields
        menuItem.name = name ?? menuItem.name;
        menuItem.description = description ?? menuItem.description;
        menuItem.price = price ?? menuItem.price;
        menuItem.category = category ?? menuItem.category;
        menuItem.available = available ?? menuItem.available;

        await menuItem.save();
        res.json({ message: 'Menu item updated successfully', menuItem });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

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
