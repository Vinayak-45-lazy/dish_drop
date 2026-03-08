// ===================================================
// DISHDROP — Rating Controller
// server/controllers/ratingController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");


// ===================================================
// SUBMIT RATING
// POST /api/ratings
// Customer only — after order is delivered
// ===================================================

const submitRating = async (req, res) => {
  try {
    const uid = req.user.uid;

    const {
      orderId,
      restaurantStars,
      restaurantComment,
      agentStars,
      agentComment,
    } = req.body;

    // Validate required fields
    if (!orderId || !restaurantStars) {
      return res.status(400).json({
        success: false,
        message: "Order ID and restaurant rating are required.",
      });
    }

    // Validate star ranges
    const parsedRestaurantStars = parseInt(restaurantStars);
    const parsedAgentStars = agentStars ? parseInt(agentStars) : null;

    if (parsedRestaurantStars < 1 || parsedRestaurantStars > 5) {
      return res.status(400).json({
        success: false,
        message: "Restaurant rating must be between 1 and 5.",
      });
    }

    if (parsedAgentStars !== null && (parsedAgentStars < 1 || parsedAgentStars > 5)) {
      return res.status(400).json({
        success: false,
        message: "Agent rating must be between 1 and 5.",
      });
    }

    // Fetch order
    const orderDoc = await db.collection("Orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Verify customer owns this order
    if (order.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You can only rate your own orders.",
      });
    }

    // Only delivered orders can be rated
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "You can only rate delivered orders.",
      });
    }

    // Check if already rated
    const existingRatingSnap = await db
      .collection("Ratings")
      .where("orderId", "==", orderId)
      .where("customerId", "==", uid)
      .limit(1)
      .get();

    if (!existingRatingSnap.empty) {
      return res.status(400).json({
        success: false,
        message: "You have already rated this order.",
      });
    }

    // Save rating
    const ratingId = uuidv4();
    const now = new Date();

    const rating = {
      ratingId,
      orderId,
      customerId: uid,
      restaurantId: order.restaurantId,
      deliveryAgentId: order.deliveryAgentId || "",
      restaurantStars: parsedRestaurantStars,
      restaurantComment: restaurantComment || "",
      agentStars: parsedAgentStars,
      agentComment: agentComment || "",
      timestamp: now,
    };

    await db.collection("Ratings").doc(ratingId).set(rating);

    // -----------------------------------------------
    // UPDATE RESTAURANT AVERAGE RATING
    // -----------------------------------------------
    await updateRestaurantRating(order.restaurantId, parsedRestaurantStars);

    // -----------------------------------------------
    // UPDATE AGENT AVERAGE RATING
    // -----------------------------------------------
    if (order.deliveryAgentId && parsedAgentStars) {
      await updateAgentRating(order.deliveryAgentId, parsedAgentStars);
    }

    // Mark order as rated
    await db.collection("Orders").doc(orderId).update({
      isRated: true,
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      message: "Thank you for your rating! 🌟",
      data: rating,
    });
  } catch (err) {
    console.error("❌ Submit rating error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating.",
    });
  }
};

// ===================================================
// UPDATE RESTAURANT AVERAGE RATING
// Internal helper — recalculates avgRating
// ===================================================

const updateRestaurantRating = async (restaurantId, newStars) => {
  try {
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) return;

    const restaurant = restaurantDoc.data();
    const currentAvg = restaurant.avgRating || 0;
    const currentTotal = restaurant.totalRatings || 0;

    // Incremental average formula:
    // newAvg = (currentAvg * currentTotal + newStars) / (currentTotal + 1)
    const newTotal = currentTotal + 1;
    const newAvg = (currentAvg * currentTotal + newStars) / newTotal;

    await db.collection("Restaurants").doc(restaurantId).update({
      avgRating: Math.round(newAvg * 10) / 10, // Round to 1 decimal
      totalRatings: newTotal,
    });
  } catch (err) {
    console.error("❌ Update restaurant rating error:", err.message);
  }
};

// ===================================================
// UPDATE AGENT AVERAGE RATING
// Internal helper — recalculates avgRating
// ===================================================

const updateAgentRating = async (agentId, newStars) => {
  try {
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("agentId", "==", agentId)
      .limit(1)
      .get();

    if (agentSnap.empty) return;

    const agentDoc = agentSnap.docs[0];
    const agent = agentDoc.data();
    const currentAvg = agent.avgRating || 0;
    const currentTotal = agent.totalRatings || 0;

    const newTotal = currentTotal + 1;
    const newAvg = (currentAvg * currentTotal + newStars) / newTotal;

    await agentDoc.ref.update({
      avgRating: Math.round(newAvg * 10) / 10,
      totalRatings: newTotal,
    });
  } catch (err) {
    console.error("❌ Update agent rating error:", err.message);
  }
};

// ===================================================
// GET RATINGS FOR RESTAURANT
// GET /api/ratings/restaurant/:id
// Public
// ===================================================

const getRestaurantRatings = async (req, res) => {
  try {
    const { id: restaurantId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const snapshot = await db
      .collection("Ratings")
      .where("restaurantId", "==", restaurantId)
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        stats: {
          avgRating: 0,
          totalRatings: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        total: 0,
      });
    }

    const ratings = snapshot.docs.map((doc) => doc.data());

    // Calculate stats
    const stats = calculateRatingStats(ratings, "restaurantStars");

    // Enrich with customer names
    const enriched = await enrichRatingsWithCustomerNames(ratings);

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = enriched.length;
    const paginated = enriched.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      stats,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get restaurant ratings error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch restaurant ratings.",
    });
  }
};

// ===================================================
// GET RATINGS FOR AGENT
// GET /api/ratings/agent/:id
// Agent or Admin
// ===================================================

const getAgentRatings = async (req, res) => {
  try {
    const { id: agentId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const snapshot = await db
      .collection("Ratings")
      .where("deliveryAgentId", "==", agentId)
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
        stats: {
          avgRating: 0,
          totalRatings: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
        total: 0,
      });
    }

    const ratings = snapshot.docs.map((doc) => doc.data());

    // Only include ratings that have agent stars
    const agentRatings = ratings.filter(
      (r) => r.agentStars !== null && r.agentStars !== undefined
    );

    // Calculate stats
    const stats = calculateRatingStats(agentRatings, "agentStars");

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = agentRatings.length;
    const paginated = agentRatings.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      stats,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get agent ratings error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agent ratings.",
    });
  }
};

// ===================================================
// GET MY RATING FOR ORDER
// GET /api/ratings/order/:orderId
// Customer only
// ===================================================

const getOrderRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const uid = req.user.uid;

    const snap = await db
      .collection("Ratings")
      .where("orderId", "==", orderId)
      .where("customerId", "==", uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No rating found for this order.",
      });
    }

    return res.status(200).json({
      success: true,
      data: snap.docs[0].data(),
    });
  } catch (err) {
    console.error("❌ Get order rating error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order rating.",
    });
  }
};

// ===================================================
// HELPER — CALCULATE RATING STATS
// Returns avg, total, and star distribution
// ===================================================

const calculateRatingStats = (ratings, starField) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (ratings.length === 0) {
    return {
      avgRating: 0,
      totalRatings: 0,
      distribution,
    };
  }

  let total = 0;
  ratings.forEach((r) => {
    const stars = r[starField];
    if (stars >= 1 && stars <= 5) {
      distribution[stars]++;
      total += stars;
    }
  });

  const avgRating = total / ratings.length;

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalRatings: ratings.length,
    distribution,
    percentages: {
      5: Math.round((distribution[5] / ratings.length) * 100),
      4: Math.round((distribution[4] / ratings.length) * 100),
      3: Math.round((distribution[3] / ratings.length) * 100),
      2: Math.round((distribution[2] / ratings.length) * 100),
      1: Math.round((distribution[1] / ratings.length) * 100),
    },
  };
};

// ===================================================
// HELPER — ENRICH RATINGS WITH CUSTOMER NAMES
// Adds customer name to each rating object
// ===================================================

const enrichRatingsWithCustomerNames = async (ratings) => {
  try {
    // Get unique customer IDs
    const customerIds = [...new Set(ratings.map((r) => r.customerId))];

    // Fetch all customers in parallel
    const customerDocs = await Promise.all(
      customerIds.map((id) => db.collection("Users").doc(id).get())
    );

    const customerMap = {};
    customerDocs.forEach((doc) => {
      if (doc.exists) {
        customerMap[doc.id] = doc.data().name;
      }
    });

    return ratings.map((r) => ({
      ...r,
      customerName: customerMap[r.customerId] || "Anonymous",
    }));
  } catch (err) {
    console.error("❌ Enrich ratings error:", err.message);
    return ratings;
  }
};

module.exports = {
  submitRating,
  getRestaurantRatings,
  getAgentRatings,
  getOrderRating,
};
