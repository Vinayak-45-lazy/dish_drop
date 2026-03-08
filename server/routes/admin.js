// ===================================================
// DISHDROP — Admin Routes
// server/routes/admin.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  getPlatformStats,
  getAdminRestaurants,
  approveRestaurant,
  flagRestaurant,
  getAdminAgents,
  flagAgent,
  getAdminOrders,
  sendAdminBroadcastEmail,
  getAdminUsers,
  getDailyStats,
} = require("../controllers/adminController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// ===================================================
// ALL ADMIN ROUTES REQUIRE AUTHENTICATION + ADMIN ROLE
// ===================================================

// Apply verifyToken + isAdmin to ALL routes in this file
router.use(verifyToken, isAdmin);

// ===================================================
// PLATFORM STATS
// ===================================================

// Get full platform analytics
// GET /api/admin/stats
router.get("/stats", getPlatformStats);

// Get daily revenue stats for chart
// GET /api/admin/daily-stats
// Supports: ?days=30
router.get("/daily-stats", getDailyStats);

// ===================================================
// USER MANAGEMENT
// ===================================================

// Get all users
// GET /api/admin/users
// Supports: ?role=customer&limit=20&page=1
router.get("/users", getAdminUsers);

// ===================================================
// RESTAURANT MANAGEMENT
// ===================================================

// Get all restaurants (including unapproved)
// GET /api/admin/restaurants
// Supports: ?isApproved=false&flagStatus=flagged&limit=20&page=1
router.get("/restaurants", getAdminRestaurants);

// Approve or reject a restaurant
// PATCH /api/admin/restaurants/:id/approve
// Body: { approved: true/false }
router.patch("/restaurants/:id/approve", approveRestaurant);

// Manually flag or unflag a restaurant
// PATCH /api/admin/restaurants/:id/flag
// Body: { flagStatus: "flagged"/"none", reason: "..." }
router.patch("/restaurants/:id/flag", flagRestaurant);

// ===================================================
// AGENT MANAGEMENT
// ===================================================

// Get all delivery agents
// GET /api/admin/agents
// Supports: ?flagStatus=flagged&isAvailable=true&limit=20&page=1
router.get("/agents", getAdminAgents);

// Manually flag or unflag an agent
// PATCH /api/admin/agents/:id/flag
// Body: { flagStatus: "flagged"/"none", reason: "..." }
router.patch("/agents/:id/flag", flagAgent);

// ===================================================
// ORDER MANAGEMENT
// ===================================================

// Get all orders
// GET /api/admin/orders
// Supports: ?status=delivered&restaurantId=...&limit=20&page=1
router.get("/orders", getAdminOrders);

// ===================================================
// COMMUNICATION
// ===================================================

// Send broadcast email to users
// POST /api/admin/broadcast-email
// Body: { subject: "...", message: "...", role?: "customer" }
router.post("/broadcast-email", sendAdminBroadcastEmail);

module.exports = router;