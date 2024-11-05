const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const authMiddleware = require("../middleware/authMiddleware");

// Delete a menu item - Admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await menuItem.deleteOne();
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Update an existing menu item - Admin only
router.put(
  "/:id",
  authMiddleware,
  [
    body("name").optional().isString().withMessage("Name must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("category")
      .optional()
      .isString()
      .withMessage("Category must be a string"),
    body("available")
      .optional()
      .isBoolean()
      .withMessage("Available must be a boolean"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, category, available } = req.body;

    try {
      const menuItem = await MenuItem.findById(req.params.id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      // Update fields only if provided
      if (name !== undefined) menuItem.name = name;
      if (description !== undefined) menuItem.description = description;
      if (price !== undefined) menuItem.price = price;
      if (category !== undefined) menuItem.category = category;
      if (available !== undefined) menuItem.available = available;

      await menuItem.save();
      res.json({ message: "Menu item updated successfully", menuItem });
    } catch (error) {
        next(error);
    }
  }
);

// Create a new menu item - Admin only
router.post(
  "/",
  authMiddleware,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("description").isString().optional(),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("available").isBoolean().optional(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description, price, category, available } = req.body;

    try {
      const newItem = new MenuItem({
        name,
        description,
        price,
        category,
        available: available ?? true,
      });
      await newItem.save();

      res
        .status(201)
        .json({ message: "Menu item created successfully", newItem });
    } catch (error) {
        next(error);
    }
  }
);

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      const error = new Error("Menu item not found");
      error.statusCode = 404;
      throw error;
    }
    res.json(menuItem);
  } catch (error) {
    next(error); // Pass the error to the centralized error handler
  }
});

module.exports = router;
