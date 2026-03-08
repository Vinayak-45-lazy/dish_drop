// ===================================================
// DISHDROP — Restaurant Routes
// server/routes/restaurants.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurant,
  toggleRestaurantStatus,
  getNearbyRestaurants,
} = require("../controllers/restaurantController");

const {
  getMenuByRestaurant,
} = require("../controllers/menuController");

const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");
const { isOwner, isOwnerOrAdmin } = require("../middleware/roleMiddleware");
const { uploadRestaurantImage } = require("../middleware/uploadMiddleware");

// ===================================================
// PUBLIC ROUTES
// ===================================================

// Get all approved restaurants
// GET /api/restaurants
// Supports: ?cuisine=pizza&isOpen=true&sortBy=avgRating&limit=20&page=1
router.get("/", optionalAuth, getAllRestaurants);

// Get nearby restaurants
// GET /api/restaurants/nearby?lat=&lng=&radius=
router.get("/nearby", getNearbyRestaurants);

// Get restaurant owner's own restaurant
// GET /api/restaurants/my
router.get("/my", verifyToken, isOwner, getMyRestaurant);

// Get single restaurant by ID
// GET /api/restaurants/:id
router.get("/:id", optionalAuth, getRestaurantById);

// Get menu for a restaurant
// GET /api/restaurants/:id/menu
// Supports: ?category=starters&isVeg=true&isAvailable=true
router.get("/:id/menu", optionalAuth, getMenuByRestaurant);

// ===================================================
// PROTECTED ROUTES
// ===================================================

// Create new restaurant (owner only)
// POST /api/restaurants
router.post(
  "/",
  verifyToken,
  isOwner,
  uploadRestaurantImage,
  createRestaurant
);

// Update restaurant (owner or admin)
// PATCH /api/restaurants/:id
router.patch(
  "/:id",
  verifyToken,
  isOwnerOrAdmin,
  uploadRestaurantImage,
  updateRestaurant
);

// Toggle restaurant open/close
// PATCH /api/restaurants/:id/toggle
router.patch(
  "/:id/toggle",
  verifyToken,
  isOwner,
  toggleRestaurantStatus
);

module.exports = router;