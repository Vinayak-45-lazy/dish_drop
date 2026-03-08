// ===================================================
// DISHDROP — Admin Controller
// server/controllers/adminController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const { sendBroadcastEmail } = require("../services/emailService");
const { getFlagSummary } = require("../services/flagEngine");


// ===================================================
// GET PLATFORM STATS
// GET /api/admin/stats
// Admin only
// ===================================================

const getPlatformStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch all collections in parallel
    const [
      usersSnap,
      restaurantsSnap,
      ordersSnap,
      agentsSnap,
      pendingRestaurantsSnap,
    ] = await Promise.all([
      db.collection("Users").get(),
      db.collection("Restaurants").where("isApproved", "==", true).get(),
      db.collection("Orders").get(),
      db.collection("DeliveryAgentProfiles").get(),
      db
        .collection("Restaurants")
        .where("isApproved", "==", false)
        .get(),
    ]);

    const orders = ordersSnap.docs.map((doc) => doc.data());
    const users = usersSnap.docs.map((doc) => doc.data());

    // Revenue calculations
    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    const todayRevenue = deliveredOrders
      .filter((o) => {
        const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
        return placedAt >= startOfToday;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const weekRevenue = deliveredOrders
      .filter((o) => {
        const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
        return placedAt >= startOfWeek;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const monthRevenue = deliveredOrders
      .filter((o) => {
        const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
        return placedAt >= startOfMonth;
      })
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Platform commission (10%)
    const platformCommission = totalRevenue * 0.1;

    // Order stats
    const ordersByStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // User breakdown by role
    const usersByRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    // Today's orders
    const todayOrders = orders.filter((o) => {
      const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
      return placedAt >= startOfToday;
    }).length;

    // Get flag summary
    const flagSummary = await getFlagSummary();

    // Daily revenue for last 7 days (for chart)
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = deliveredOrders
        .filter((o) => {
          const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
          return placedAt >= dayStart && placedAt <= dayEnd;
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const dayOrders = orders.filter((o) => {
        const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
        return placedAt >= dayStart && placedAt <= dayEnd;
      }).length;

      dailyRevenue.push({
        date: dayStart.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        revenue: Math.round(dayRevenue * 100) / 100,
        orders: dayOrders,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers: usersSnap.size,
          totalRestaurants: restaurantsSnap.size,
          pendingRestaurants: pendingRestaurantsSnap.size,
          totalOrders: ordersSnap.size,
          totalAgents: agentsSnap.size,
          todayOrders,
        },
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          today: Math.round(todayRevenue * 100) / 100,
          thisWeek: Math.round(weekRevenue * 100) / 100,
          thisMonth: Math.round(monthRevenue * 100) / 100,
          platformCommission: Math.round(platformCommission * 100) / 100,
        },
        ordersByStatus,
        usersByRole,
        dailyRevenue,
        flagSummary,
      },
    });
  } catch (err) {
    console.error("❌ Get platform stats error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform stats.",
    });
  }
};

// ===================================================
// GET ALL RESTAURANTS (Admin View)
// GET /api/admin/restaurants
// Admin only — includes unapproved restaurants
// ===================================================

const getAdminRestaurants = async (req, res) => {
  try {
    const {
      isApproved,
      flagStatus,
      limit = 20,
      page = 1,
    } = req.query;

    let query = db.collection("Restaurants").orderBy("createdAt", "desc");

    if (isApproved !== undefined) {
      query = db
        .collection("Restaurants")
        .where("isApproved", "==", isApproved === "true")
        .orderBy("createdAt", "desc");
    }

    if (flagStatus) {
      query = db
        .collection("Restaurants")
        .where("flagStatus", "==", flagStatus)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    let restaurants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.()?.toISOString() ||
        doc.data().createdAt,
    }));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = restaurants.length;
    const paginated = restaurants.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get admin restaurants error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants.",
    });
  }
};

// ===================================================
// APPROVE RESTAURANT
// PATCH /api/admin/restaurants/:id/approve
// Admin only
// ===================================================

const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true } = req.body;

    const restaurantDoc = await db.collection("Restaurants").doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurant = restaurantDoc.data();
    const isApproved = approved === true || approved === "true";

    await db.collection("Restaurants").doc(id).update({
      isApproved,
      approvedAt: isApproved ? new Date() : null,
      approvedBy: req.user.uid,
      updatedAt: new Date(),
    });

    // Notify restaurant owner
    const ownerDoc = await db
      .collection("Users")
      .doc(restaurant.ownerId)
      .get();

    if (ownerDoc.exists) {
      const notificationId = uuidv4();
      await db.collection("Notifications").doc(notificationId).set({
        notificationId,
        userId: restaurant.ownerId,
        title: isApproved
          ? "Restaurant Approved! 🎉"
          : "Restaurant Application Update",
        message: isApproved
          ? `Congratulations! Your restaurant "${restaurant.name}" has been approved. You can now go live!`
          : `Your restaurant "${restaurant.name}" application has been reviewed. Please contact support for more details.`,
        type: "system",
        isRead: false,
        createdAt: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Restaurant ${isApproved ? "approved ✅" : "unapproved ❌"} successfully.`,
      data: { restaurantId: id, isApproved },
    });
  } catch (err) {
    console.error("❌ Approve restaurant error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update restaurant approval.",
    });
  }
};

// ===================================================
// FLAG / UNFLAG RESTAURANT (Manual)
// PATCH /api/admin/restaurants/:id/flag
// Admin only
// ===================================================

const flagRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { flagStatus = "flagged", reason } = req.body;

    const validStatuses = ["none", "flagged"];
    if (!validStatuses.includes(flagStatus)) {
      return res.status(400).json({
        success: false,
        message: "flagStatus must be 'none' or 'flagged'.",
      });
    }

    const restaurantDoc = await db.collection("Restaurants").doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    await db.collection("Restaurants").doc(id).update({
      flagStatus,
      flagReason: reason || "",
      flaggedAt: flagStatus === "flagged" ? new Date() : null,
      flaggedBy: req.user.uid,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Restaurant ${flagStatus === "flagged" ? "flagged 🚩" : "unflagged ✅"} successfully.`,
      data: { restaurantId: id, flagStatus },
    });
  } catch (err) {
    console.error("❌ Flag restaurant error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to flag restaurant.",
    });
  }
};

// ===================================================
// GET ALL AGENTS (Admin View)
// GET /api/admin/agents
// Admin only
// ===================================================

const getAdminAgents = async (req, res) => {
  try {
    const { flagStatus, isAvailable, limit = 20, page = 1 } = req.query;

    let query = db.collection("DeliveryAgentProfiles");

    if (flagStatus) {
      query = query.where("flagStatus", "==", flagStatus);
    }

    if (isAvailable !== undefined) {
      query = query.where("isAvailable", "==", isAvailable === "true");
    }

    const snapshot = await query.get();

    let agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by totalDeliveries
    agents.sort((a, b) => (b.totalDeliveries || 0) - (a.totalDeliveries || 0));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = agents.length;
    const paginated = agents.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get admin agents error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents.",
    });
  }
};

// ===================================================
// FLAG / UNFLAG AGENT (Manual)
// PATCH /api/admin/agents/:id/flag
// Admin only
// ===================================================

const flagAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { flagStatus = "flagged", reason } = req.body;

    const validStatuses = ["none", "flagged"];
    if (!validStatuses.includes(flagStatus)) {
      return res.status(400).json({
        success: false,
        message: "flagStatus must be 'none' or 'flagged'.",
      });
    }

    const agentDoc = await db
      .collection("DeliveryAgentProfiles")
      .doc(id)
      .get();

    if (!agentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    await db.collection("DeliveryAgentProfiles").doc(id).update({
      flagStatus,
      flagReason: reason || "",
      flaggedAt: flagStatus === "flagged" ? new Date() : null,
      flaggedBy: req.user.uid,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Agent ${flagStatus === "flagged" ? "flagged 🚩" : "unflagged ✅"} successfully.`,
      data: { agentId: id, flagStatus },
    });
  } catch (err) {
    console.error("❌ Flag agent error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to flag agent.",
    });
  }
};

// ===================================================
// GET ALL ORDERS (Admin View)
// GET /api/admin/orders
// Admin only
// ===================================================

const getAdminOrders = async (req, res) => {
  try {
    const {
      status,
      restaurantId,
      customerId,
      limit = 20,
      page = 1,
    } = req.query;

    let query = db.collection("Orders").orderBy("placedAt", "desc");

    if (status) {
      query = db
        .collection("Orders")
        .where("status", "==", status)
        .orderBy("placedAt", "desc");
    }

    if (restaurantId) {
      query = db
        .collection("Orders")
        .where("restaurantId", "==", restaurantId)
        .orderBy("placedAt", "desc");
    }

    if (customerId) {
      query = db
        .collection("Orders")
        .where("customerId", "==", customerId)
        .orderBy("placedAt", "desc");
    }

    const snapshot = await query.get();

    let orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      placedAt:
        doc.data().placedAt?.toDate?.()?.toISOString() ||
        doc.data().placedAt,
    }));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = orders.length;
    const paginated = orders.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get admin orders error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
};

// ===================================================
// SEND BROADCAST EMAIL
// POST /api/admin/broadcast-email
// Admin only
// ===================================================

const sendAdminBroadcastEmail = async (req, res) => {
  try {
    const { subject, message, role } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
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
        message: "No users found to email.",
        sentCount: 0,
      });
    }

    const emails = usersSnap.docs
      .map((doc) => doc.data().email)
      .filter(Boolean);

    const result = await sendBroadcastEmail(emails, subject, message);

    return res.status(200).json({
      success: true,
      message: `Broadcast email sent to ${emails.length} users.`,
      sentCount: emails.length,
      emailResult: result,
    });
  } catch (err) {
    console.error("❌ Broadcast email error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send broadcast email.",
    });
  }
};

// ===================================================
// GET ALL USERS (Admin View)
// GET /api/admin/users
// Admin only
// ===================================================

const getAdminUsers = async (req, res) => {
  try {
    const { role, limit = 20, page = 1 } = req.query;

    let query = db.collection("Users").orderBy("createdAt", "desc");

    if (role) {
      query = db
        .collection("Users")
        .where("role", "==", role)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt:
        doc.data().createdAt?.toDate?.()?.toISOString() ||
        doc.data().createdAt,
    }));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = users.length;
    const paginated = users.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get admin users error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

// ===================================================
// GET DAILY STATS HISTORY
// GET /api/admin/daily-stats
// Admin only — for revenue chart
// ===================================================

const getDailyStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const snapshot = await db
      .collection("DailyStats")
      .orderBy("date", "desc")
      .limit(parseInt(days))
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const stats = snapshot.docs
      .map((doc) => doc.data())
      .reverse(); // Oldest first for chart

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    console.error("❌ Get daily stats error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily stats.",
    });
  }
};

module.exports = {
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
};
