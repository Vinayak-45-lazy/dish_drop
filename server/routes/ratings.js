// ===================================================
// DISHDROP — Rating Routes
// server/routes/ratings.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  submitRating,
  getRestaurantRatings,
  getAgentRatings,
  getOrderRating,
} = require("../controllers/ratingController");

const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");
const { isCustomer, isAgentOrAdmin } = require("../middleware/roleMiddleware");

// ===================================================
// PUBLIC ROUTES
// ===================================================

// Get all ratings for a restaurant
// GET /api/ratings/restaurant/:id
// Supports: ?limit=20&page=1
router.get(
  "/restaurant/:id",
  optionalAuth,
  getRestaurantRatings
);

// ===================================================
// PROTECTED ROUTES
// ===================================================

// Get all ratings for a delivery agent
// GET /api/ratings/agent/:id
// Agent (own) or Admin
router.get(
  "/agent/:id",
  verifyToken,
  isAgentOrAdmin,
  getAgentRatings
);

// Get customer's rating for a specific order
// GET /api/ratings/order/:orderId
// Customer only
router.get(
  "/order/:orderId",
  verifyToken,
  isCustomer,
  getOrderRating
);

// Submit a rating for a delivered order
// POST /api/ratings
// Customer only
router.post(
  "/",
  verifyToken,
  isCustomer,
  submitRating
);

module.exports = router;
