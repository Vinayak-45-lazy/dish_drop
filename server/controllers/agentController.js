// ===================================================
// DISHDROP — Agent Controller
// server/controllers/agentController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const { haversineDistance } = require("../services/etaService");


// ===================================================
// GET ALL AGENTS
// GET /api/agents
// Admin only
// ===================================================

const getAllAgents = async (req, res) => {
  try {
    const { isAvailable, flagStatus, limit = 20, page = 1 } = req.query;

    let query = db.collection("DeliveryAgentProfiles");

    if (isAvailable !== undefined) {
      query = query.where("isAvailable", "==", isAvailable === "true");
    }

    if (flagStatus) {
      query = query.where("flagStatus", "==", flagStatus);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
      });
    }

    let agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by totalDeliveries desc
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
    console.error("❌ Get all agents error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents.",
    });
  }
};

// ===================================================
// GET AGENT BY ID
// GET /api/agents/:id
// Agent (own profile) or Admin
// ===================================================

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

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

    const agent = agentDoc.data();

    // Agent can only view own profile
    if (role === "delivery_agent" && agent.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: agentDoc.id, ...agent },
    });
  } catch (err) {
    console.error("❌ Get agent by ID error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent.",
    });
  }
};

// ===================================================
// GET MY AGENT PROFILE
// GET /api/agents/me
// Delivery Agent only
// ===================================================

const getMyAgentProfile = async (req, res) => {
  try {
    const uid = req.user.uid;

    const snap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found.",
      });
    }

    const agentDoc = snap.docs[0];

    return res.status(200).json({
      success: true,
      data: { id: agentDoc.id, ...agentDoc.data() },
    });
  } catch (err) {
    console.error("❌ Get my agent profile error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent profile.",
    });
  }
};

// ===================================================
// UPDATE AGENT LOCATION
// PATCH /api/agents/:id/location
// Delivery Agent only — called every 10 seconds
// ===================================================

const updateAgentLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required.",
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

    // Verify ownership
    if (agentDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own location.",
      });
    }

    await db
      .collection("DeliveryAgentProfiles")
      .doc(id)
      .update({
        currentLat: parseFloat(lat),
        currentLng: parseFloat(lng),
        lastActiveAt: new Date(),
      });

    return res.status(200).json({
      success: true,
      message: "Location updated.",
      data: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
    });
  } catch (err) {
    console.error("❌ Update agent location error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update location.",
    });
  }
};

// ===================================================
// UPDATE AGENT AVAILABILITY
// PATCH /api/agents/:id/availability
// Delivery Agent only
// ===================================================

const updateAgentAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return res.status(400).json({
        success: false,
        message: "isAvailable is required.",
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

    if (agentDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own availability.",
      });
    }

    const newAvailability = isAvailable === true || isAvailable === "true";

    await db
      .collection("DeliveryAgentProfiles")
      .doc(id)
      .update({
        isAvailable: newAvailability,
        lastActiveAt: new Date(),
      });

    return res.status(200).json({
      success: true,
      message: `You are now ${newAvailability ? "available 🟢" : "unavailable 🔴"}`,
      data: { isAvailable: newAvailability },
    });
  } catch (err) {
    console.error("❌ Update agent availability error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update availability.",
    });
  }
};

// ===================================================
// GET AVAILABLE AGENTS NEAR LOCATION
// GET /api/agents/available/:lat/:lng
// Restaurant Owner or Admin
// ===================================================

const getAvailableAgentsNear = async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required.",
      });
    }

    const restaurantLat = parseFloat(lat);
    const restaurantLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    const snapshot = await db
      .collection("DeliveryAgentProfiles")
      .where("isAvailable", "==", true)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: "No available agents found.",
      });
    }

    const agents = snapshot.docs
      .map((doc) => {
        const agent = doc.data();
        const distance = haversineDistance(
          restaurantLat,
          restaurantLng,
          agent.currentLat || 0,
          agent.currentLng || 0
        );
        return {
          id: doc.id,
          ...agent,
          distanceKm: Math.round(distance * 10) / 10,
        };
      })
      .filter((agent) => agent.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      data: agents,
      total: agents.length,
    });
  } catch (err) {
    console.error("❌ Get available agents near error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby agents.",
    });
  }
};

// ===================================================
// GET AGENT EARNINGS
// GET /api/agents/:id/earnings
// Agent (own) or Admin
// ===================================================

const getAgentEarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

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

    const agent = agentDoc.data();

    // Auth check
    if (role === "delivery_agent" && agent.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own earnings.",
      });
    }

    // Fetch all delivered orders for this agent
    const ordersSnap = await db
      .collection("Orders")
      .where("deliveryAgentId", "==", agent.agentId)
      .where("status", "==", "delivered")
      .orderBy("deliveredAt", "desc")
      .get();

    const orders = ordersSnap.docs.map((doc) => doc.data());

    // Calculate earnings breakdown
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let todayEarnings = 0;
    let weekEarnings = 0;
    let totalEarnings = 0;

    const deliveryHistory = orders.map((order) => {
      const deliveredAt =
        order.deliveredAt?.toDate?.() || new Date(order.deliveredAt);
      const earning = (order.deliveryFee || 0) * 0.8; // 80% commission

      totalEarnings += earning;

      if (deliveredAt >= startOfToday) {
        todayEarnings += earning;
      }
      if (deliveredAt >= startOfWeek) {
        weekEarnings += earning;
      }

      return {
        orderId: order.orderId,
        restaurantName: order.restaurantName,
        customerName: order.customerName,
        deliveryFee: order.deliveryFee || 0,
        agentEarning: Math.round(earning * 100) / 100,
        deliveredAt: deliveredAt.toISOString(),
        distanceKm: order.distanceKm || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          todayEarnings: Math.round(todayEarnings * 100) / 100,
          weekEarnings: Math.round(weekEarnings * 100) / 100,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalDeliveries: orders.length,
          avgEarningPerDelivery:
            orders.length > 0
              ? Math.round((totalEarnings / orders.length) * 100) / 100
              : 0,
        },
        deliveryHistory,
      },
    });
  } catch (err) {
    console.error("❌ Get agent earnings error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent earnings.",
    });
  }
};

// ===================================================
// GET AVAILABLE ORDERS FOR AGENT
// GET /api/agents/available-orders
// Delivery Agent only — orders ready for pickup
// ===================================================

const getAvailableOrdersForAgent = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Get agent profile
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (agentSnap.empty) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found.",
      });
    }

    const agent = agentSnap.docs[0].data();

    // Get all orders ready for pickup with no agent assigned
    const ordersSnap = await db
      .collection("Orders")
      .where("status", "==", "readyForPickup")
      .where("deliveryAgentId", "==", "")
      .orderBy("placedAt", "asc")
      .get();

    if (ordersSnap.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: "No orders available for pickup.",
      });
    }

    // Calculate distance from agent to each restaurant
    const orders = ordersSnap.docs.map((doc) => {
      const order = doc.data();
      const distance = haversineDistance(
        agent.currentLat || 0,
        agent.currentLng || 0,
        order.restaurantLat || 0,
        order.restaurantLng || 0
      );

      return {
        id: doc.id,
        ...order,
        distanceFromAgent: Math.round(distance * 10) / 10,
      };
    });

    // Sort by distance from agent
    orders.sort((a, b) => a.distanceFromAgent - b.distanceFromAgent);

    return res.status(200).json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (err) {
    console.error("❌ Get available orders error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available orders.",
    });
  }
};

// ===================================================
// UPDATE AGENT VEHICLE INFO
// PATCH /api/agents/:id/vehicle
// Delivery Agent only
// ===================================================

const updateVehicleInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const { vehicleType, vehicleNumber } = req.body;

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

    if (agentDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own vehicle info.",
      });
    }

    const updates = {};

    if (vehicleType) {
      const validTypes = ["bike", "bicycle", "scooter"];
      if (!validTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Vehicle type must be bike, bicycle, or scooter.",
        });
      }
      updates.vehicleType = vehicleType;
    }

    if (vehicleNumber) {
      updates.vehicleNumber = vehicleNumber.toUpperCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update.",
      });
    }

    await db
      .collection("DeliveryAgentProfiles")
      .doc(id)
      .update(updates);

    return res.status(200).json({
      success: true,
      message: "Vehicle info updated successfully!",
      data: updates,
    });
  } catch (err) {
    console.error("❌ Update vehicle info error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle info.",
    });
  }
};

module.exports = {
  getAllAgents,
  getAgentById,
  getMyAgentProfile,
  updateAgentLocation,
  updateAgentAvailability,
  getAvailableAgentsNear,
  getAgentEarnings,
  getAvailableOrdersForAgent,
  updateVehicleInfo,
};
