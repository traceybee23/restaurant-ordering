const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seedAdmin = async () => {
    try {
        // Create a sample admin user
        const newAdmin = new User({
            name: "Admin User",
            email: "admin@example.com",
            password: "adminpassword", // This will be hashed by the pre-save middleware
            role: "admin",
        });

        await newAdmin.save();
        console.log("Admin user seeded successfully");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding admin user:", error);
        mongoose.connection.close();
    }
};

seedAdmin();
