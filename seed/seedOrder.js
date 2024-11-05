const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem"); // Assuming you already have some menu items in the database

dotenv.config();
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedOrder = async () => {
    try {
        // Fetch an existing menu item from the database to include in the order
        const menuItem = await MenuItem.findOne();
        if (!menuItem) {
            console.log("No menu items found, please seed menu items first");
            mongoose.connection.close();
            return;
        }

        // Create a sample order
        const newOrder = new Order({
            items: [
                {
                    item_id: menuItem._id,
                    quantity: 2,
                    customizations: "Extra cheese",
                },
            ],
            total_price: menuItem.price * 2,
            status: "Pending",
            payment_status: false,
        });

        await newOrder.save();
        console.log("Sample order seeded successfully");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding order:", error);
        mongoose.connection.close();
    }
};

seedOrder();
