// ===================================================
// DISHDROP — Menu Routes
// server/routes/menu.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  bulkToggleAvailability,
} = require("../controllers/menuController");

const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");
const { isOwner } = require("../middleware/roleMiddleware");
const { uploadMenuImage } = require("../middleware/uploadMiddleware");

// ===================================================
// PUBLIC ROUTES
// ===================================================

// Get single menu item by ID
// GET /api/menu/:id
router.get("/:id", optionalAuth, getMenuItemById);

// ===================================================
// PROTECTED ROUTES — Restaurant Owner only
// ===================================================

// Bulk toggle availability for a category
// PATCH /api/menu/bulk-toggle
// Must be before /:id to avoid conflict
router.patch(
  "/bulk-toggle",
  verifyToken,
  isOwner,
  bulkToggleAvailability
);

// Create new menu item
// POST /api/menu
router.post(
  "/",
  verifyToken,
  isOwner,
  uploadMenuImage,
  createMenuItem
);

// Update menu item
// PATCH /api/menu/:id
router.patch(
  "/:id",
  verifyToken,
  isOwner,
  uploadMenuImage,
  updateMenuItem
);

// Toggle item availability (sold out / available)
// PATCH /api/menu/:id/toggle
router.patch(
  "/:id/toggle",
  verifyToken,
  isOwner,
  toggleItemAvailability
);

// Delete menu item
// DELETE /api/menu/:id
router.delete(
  "/:id",
  verifyToken,
  isOwner,
  deleteMenuItem
);

module.exports = router;