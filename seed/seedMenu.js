const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MenuItem = require('../models/MenuItem'); // Adjust path as needed

dotenv.config(); // Load environment variables
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedMenuItems = async () => {
    const items = [
        { name: 'Margherita Pizza', description: 'Classic cheese pizza', price: 10.99, category: 'Entree' },
        { name: 'Pepperoni Pizza', description: 'Pepperoni and cheese', price: 12.99, category: 'Entree' },
        { name: 'Caesar Salad', description: 'Romaine lettuce, croutons, Caesar dressing', price: 7.99, category: 'Salad' },
        { name: 'Lemonade', description: 'Fresh lemonade', price: 3.49, category: 'Drink' },
        { name: 'Chocolate Cake', description: 'Rich chocolate cake', price: 5.99, category: 'Dessert' }
    ];

    try {
        await MenuItem.insertMany(items);
        console.log('Menu items seeded successfully');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding menu items:', error);
        mongoose.connection.close();
    }
};

seedMenuItems();
