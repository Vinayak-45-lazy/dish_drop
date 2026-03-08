// ===================================================
// DISHDROP — Agent Routes
// server/routes/agents.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  getAllAgents,
  getAgentById,
  getMyAgentProfile,
  updateAgentLocation,
  updateAgentAvailability,
  getAvailableAgentsNear,
  getAgentEarnings,
  getAvailableOrdersForAgent,
  updateVehicleInfo,
} = require("../controllers/agentController");

const { verifyToken } = require("../middleware/authMiddleware");
const {
  isAdmin,
  isAgent,
  isAgentOrAdmin,
  requireRole,
} = require("../middleware/roleMiddleware");

// ===================================================
// PROTECTED ROUTES
// ===================================================

// Get all agents
// GET /api/agents
// Admin only
router.get(
  "/",
  verifyToken,
  isAdmin,
  getAllAgents
);

// Get my agent profile
// GET /api/agents/me
// Must be before /:id
router.get(
  "/me",
  verifyToken,
  isAgent,
  getMyAgentProfile
);

// Get available orders for agent
// GET /api/agents/available-orders
// Must be before /:id
router.get(
  "/available-orders",
  verifyToken,
  isAgent,
  getAvailableOrdersForAgent
);

// Get available agents near a location
// GET /api/agents/available/:lat/:lng
// Restaurant Owner or Admin
router.get(
  "/available/:lat/:lng",
  verifyToken,
  requireRole("restaurant_owner", "admin"),
  getAvailableAgentsNear
);

// Get agent by ID
// GET /api/agents/:id
// Agent (own) or Admin
router.get(
  "/:id",
  verifyToken,
  isAgentOrAdmin,
  getAgentById
);

// Get agent earnings
// GET /api/agents/:id/earnings
// Agent (own) or Admin
router.get(
  "/:id/earnings",
  verifyToken,
  isAgentOrAdmin,
  getAgentEarnings
);

// Update agent live location
// PATCH /api/agents/:id/location
// Agent only — called every 10 seconds
router.patch(
  "/:id/location",
  verifyToken,
  isAgent,
  updateAgentLocation
);

// Update agent availability (online/offline)
// PATCH /api/agents/:id/availability
// Agent only
router.patch(
  "/:id/availability",
  verifyToken,
  isAgent,
  updateAgentAvailability
);

// Update agent vehicle info
// PATCH /api/agents/:id/vehicle
// Agent only
router.patch(
  "/:id/vehicle",
  verifyToken,
  isAgent,
  updateVehicleInfo
);

module.exports = router;