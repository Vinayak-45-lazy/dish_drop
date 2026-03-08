// ===================================================
// DISHDROP — AI Routes
// server/routes/ai.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  aiSearch,
  aiRecommend,
  aiChat,
  getChatHistory,
  getOrCreateSession,
  clearChatSession,
} = require("../controllers/aiController");

const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");
const { isCustomer } = require("../middleware/roleMiddleware");

// ===================================================
// AI SEARCH — Public (optionally authenticated)
// ===================================================

// AI natural language food search
// POST /api/ai/search
// Body: { query: "spicy chicken under 200", restaurantId?: "..." }
// Works for guests and logged-in customers
router.post(
  "/search",
  optionalAuth,
  aiSearch
);

// ===================================================
// AI RECOMMENDATIONS — Customer only
// ===================================================

// Get personalized food recommendations
// POST /api/ai/recommend
// Uses customer order history to generate suggestions
router.post(
  "/recommend",
  verifyToken,
  isCustomer,
  aiRecommend
);

// ===================================================
// AI CHAT SUPPORT — Customer only
// ===================================================

// Get or create active chat session
// GET /api/ai/chat/session
// Must be before /chat/:sessionId
router.get(
  "/chat/session",
  verifyToken,
  isCustomer,
  getOrCreateSession
);

// Get chat history for a session
// GET /api/ai/chat/:sessionId
router.get(
  "/chat/:sessionId",
  verifyToken,
  isCustomer,
  getChatHistory
);

// Send message to AI chatbot
// POST /api/ai/chat
// Body: { message: "Where is my order?", sessionId?: "..." }
router.post(
  "/chat",
  verifyToken,
  isCustomer,
  aiChat
);

// Clear chat session history
// DELETE /api/ai/chat/:sessionId
router.delete(
  "/chat/:sessionId",
  verifyToken,
  isCustomer,
  clearChatSession
);

module.exports = router;