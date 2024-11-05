const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, 
    items: [
        {
            item_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "MenuItem",
                required: true,
            },
            quantity: { type: Number, required: true, default: 1 },
            customizations: { type: String },
        },
    ],
    total_price: { type: mongoose.Types.Decimal128, required: true },
    status: { type: String, default: "Pending" },
    payment_status: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
