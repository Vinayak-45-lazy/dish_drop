// ===================================================
// DISHDROP — Notification Controller
// server/controllers/notificationController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");


// ===================================================
// CREATE NOTIFICATION
// POST /api/notifications
// Internal use or Admin
// ===================================================

const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "userId, title, message, and type are required.",
      });
    }

    const validTypes = ["order_update", "promo", "system"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${validTypes.join(", ")}`,
      });
    }

    const notificationId = uuidv4();
    const now = new Date();

    const notification = {
      notificationId,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: now,
    };

    await db
      .collection("Notifications")
      .doc(notificationId)
      .set(notification);

    return res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      data: notification,
    });
  } catch (err) {
    console.error("❌ Create notification error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create notification.",
    });
  }
};

// ===================================================
// GET NOTIFICATIONS FOR USER
// GET /api/notifications/:userId
// Authenticated — user can only get own notifications
// ===================================================

const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = req.user.uid;
    const { limit = 20, page = 1, unreadOnly } = req.query;

    // Users can only fetch their own notifications
    // Admins can fetch any user's notifications
    if (req.user.role !== "admin" && uid !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own notifications.",
      });
    }

    // ✅ REPLACE WITH THIS:
let query = db
  .collection("Notifications")
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc");

const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        unreadCount: 0,
        total: 0,
      });
    }

    let notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.()?.toISOString() ||
        doc.data().createdAt,
    }));

    // ✅ ADD THIS LINE after the .map() block closes:
if (unreadOnly === "true") {
  notifications = notifications.filter((n) => !n.isRead);
}

// Count unread  ← this line already exists, just showing where to insert above it

    // Count unread
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = notifications.length;
    const paginated = notifications.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      unreadCount,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get notifications error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

// ===================================================
// MARK NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// Authenticated
// ===================================================

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const notificationDoc = await db
      .collection("Notifications")
      .doc(id)
      .get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const notification = notificationDoc.data();

    // Verify ownership
    if (notification.userId !== uid && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only mark your own notifications as read.",
      });
    }

    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: "Notification already marked as read.",
      });
    }

    await db.collection("Notifications").doc(id).update({
      isRead: true,
      readAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (err) {
    console.error("❌ Mark as read error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

// ===================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// Authenticated — marks all user's notifications read
// ===================================================

const markAllAsRead = async (req, res) => {
  try {
    const uid = req.user.uid;

    const unreadSnap = await db
      .collection("Notifications")
      .where("userId", "==", uid)
      .where("isRead", "==", false)
      .get();

    if (unreadSnap.empty) {
      return res.status(200).json({
        success: true,
        message: "No unread notifications.",
        updatedCount: 0,
      });
    }

    // Batch update
    const batch = db.batch();
    const now = new Date();

    unreadSnap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: now,
      });
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `Marked ${unreadSnap.size} notifications as read.`,
      updatedCount: unreadSnap.size,
    });
  } catch (err) {
    console.error("❌ Mark all as read error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};

// ===================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// Authenticated
// ===================================================

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const notificationDoc = await db
      .collection("Notifications")
      .doc(id)
      .get();

    if (!notificationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const notification = notificationDoc.data();

    if (notification.userId !== uid && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own notifications.",
      });
    }

    await db.collection("Notifications").doc(id).delete();

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (err) {
    console.error("❌ Delete notification error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};

// ===================================================
// GET UNREAD COUNT
// GET /api/notifications/:userId/unread-count
// Authenticated — lightweight endpoint for navbar bell
// ===================================================

const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const uid = req.user.uid;

    if (req.user.role !== "admin" && uid !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const snap = await db
      .collection("Notifications")
      .where("userId", "==", userId)
      .where("isRead", "==", false)
      .get();

    return res.status(200).json({
      success: true,
      data: { unreadCount: snap.size },
    });
  } catch (err) {
    console.error("❌ Get unread count error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count.",
    });
  }
};

// ===================================================
// SEND BULK NOTIFICATION
// POST /api/notifications/bulk
// Admin only — sends to multiple users at once
// ===================================================

const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, title, message, type = "system" } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds array is required.",
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required.",
      });
    }

    const now = new Date();
    const batch = db.batch();
    let count = 0;

    // Firestore batch limit is 500
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 500) {
      chunks.push(userIds.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const chunkBatch = db.batch();

      chunk.forEach((userId) => {
        const notificationId = uuidv4();
        const ref = db.collection("Notifications").doc(notificationId);
        chunkBatch.set(ref, {
          notificationId,
          userId,
          title,
          message,
          type,
          isRead: false,
          createdAt: now,
        });
        count++;
      });

      await chunkBatch.commit();
    }

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${count} users.`,
      sentCount: count,
    });
  } catch (err) {
    console.error("❌ Send bulk notification error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send bulk notification.",
    });
  }
};

// ===================================================
// SEND NOTIFICATION TO ALL USERS BY ROLE
// POST /api/notifications/broadcast
// Admin only
// ===================================================

const broadcastNotification = async (req, res) => {
  try {
    const { role, title, message, type = "promo" } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "title and message are required.",
      });
    }

    // Fetch target users
    let usersQuery = db.collection("Users");
    if (role) {
      usersQuery = usersQuery.where("role", "==", role);
    }

    const usersSnap = await usersQuery.get();

    if (usersSnap.empty) {
      return res.status(200).json({
        success: true,
        message: "No users found to notify.",
        sentCount: 0,
      });
    }

    const userIds = usersSnap.docs.map((doc) => doc.id);
    const now = new Date();
    let count = 0;

    // Process in batches of 500
    for (let i = 0; i < userIds.length; i += 500) {
      const chunk = userIds.slice(i, i + 500);
      const batch = db.batch();

      chunk.forEach((userId) => {
        const notificationId = uuidv4();
        const ref = db.collection("Notifications").doc(notificationId);
        batch.set(ref, {
          notificationId,
          userId,
          title,
          message,
          type,
          isRead: false,
          createdAt: now,
        });
        count++;
      });

      await batch.commit();
    }

    return res.status(201).json({
      success: true,
      message: `Broadcast sent to ${count} ${role || "all"} users.`,
      sentCount: count,
    });
  } catch (err) {
    console.error("❌ Broadcast notification error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to broadcast notification.",
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendBulkNotification,
  broadcastNotification,
};
