const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: mongoose.Types.Decimal128, required: true },
    category: { type: String, required: true },
    available: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
