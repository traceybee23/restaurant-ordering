
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await User.findOne({ email, role: 'admin' });
        if (!admin) return res.status(400).json({ message: 'Admin not found' });

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
