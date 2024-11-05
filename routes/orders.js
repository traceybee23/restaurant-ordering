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
      .withMessage("Status must be either Pending, Completed, or Cancelled"),
  ],
  async (req, res) => {
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

// Create a new order
router.post("/", async (req, res) => {
  const { items, total_price } = req.body;

  try {
    // Check if each item exists in the menu
    for (let item of items) {
      const menuItem = await MenuItem.findById(item.item_id);
      if (!menuItem || !menuItem.available) {
        return res
          .status(400)
          .json({ message: `Item ${item.item_id} is not available` });
      }
    }

    // Create a new order
    const newOrder = new Order({
      items,
      total_price,
      status: "Pending",
      payment_status: false,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
});

// Get all orders - Admin only
router.get("/", authMiddleware, async (req, res) => {
    try {
      const orders = await Order.find().populate("items.item_id", "name price");
      res.json(orders);
    } catch (error) {
        next(error);
    }
  });

module.exports = router;
