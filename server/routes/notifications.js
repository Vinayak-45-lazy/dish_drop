// ===================================================
// DISHDROP — Notification Routes
// server/routes/notifications.js
// ===================================================

const express = require("express");
const router = express.Router();

const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendBulkNotification,
  broadcastNotification,
} = require("../controllers/notificationController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin, isAnyRole } = require("../middleware/roleMiddleware");

// ===================================================
// ✅ STATIC ROUTES FIRST (before any /:param routes)
// ===================================================

// Mark ALL notifications as read
// PATCH /api/notifications/read-all
router.patch("/read-all", verifyToken, isAnyRole, markAllAsRead);

// Send bulk notifications to specific user IDs
// POST /api/notifications/bulk
router.post("/bulk", verifyToken, isAdmin, sendBulkNotification);

// Broadcast notification to all users or by role
// POST /api/notifications/broadcast
router.post("/broadcast", verifyToken, isAdmin, broadcastNotification);

// Create a single notification (internal/admin use)
// POST /api/notifications
router.post("/", verifyToken, isAdmin, createNotification);

// ===================================================
// ✅ PARAM ROUTES AFTER (so they don't swallow static paths)
// ===================================================

// Get unread notification count
// GET /api/notifications/:userId/unread-count
router.get("/:userId/unread-count", verifyToken, isAnyRole, getUnreadCount);

// Get notifications for a user
// GET /api/notifications/:userId
router.get("/:userId", verifyToken, isAnyRole, getUserNotifications);

// Mark single notification as read
// PATCH /api/notifications/:id/read
router.patch("/:id/read", verifyToken, isAnyRole, markAsRead);

// Delete a notification
// DELETE /api/notifications/:id
router.delete("/:id", verifyToken, isAnyRole, deleteNotification);

module.exports = router;