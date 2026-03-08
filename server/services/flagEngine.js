// ===================================================
// DISHDROP — Flag Engine
// server/services/flagEngine.js
// ===================================================

const { db } = require("../firebase");
const { sendFlagAlert } = require("./emailService");

// ===================================================
// RESTAURANT FLAG ENGINE
// Calculates flag score for a single restaurant
// ===================================================

const calculateRestaurantFlagScore = async (restaurant) => {
  try {
    const restaurantId = restaurant.restaurantId;
    const reasons = [];
    let flagScore = 0;

    // Fetch all orders for this restaurant
    const ordersSnap = await db
      .collection("Orders")
      .where("restaurantId", "==", restaurantId)
      .get();

    const orders = ordersSnap.docs.map((doc) => doc.data());
    const totalOrders = orders.length;

    if (totalOrders === 0) {
      return { flagScore: 0, reasons: [] };
    }

    // -----------------------------------------------
    // RULE 1: Low average rating (< 3.0) → +30 points
    // -----------------------------------------------
    const avgRating = restaurant.avgRating || 0;
    if (avgRating > 0 && avgRating < 3.0) {
      flagScore += 30;
      reasons.push(
        `Low average rating: ${avgRating.toFixed(1)}/5.0 (threshold: 3.0)`
      );
    }

    // -----------------------------------------------
    // RULE 2: High cancellation rate (> 20%) → +25 points
    // -----------------------------------------------
    const cancelledOrders = orders.filter(
      (o) => o.status === "cancelled"
    ).length;
    const cancelledPercent = (cancelledOrders / totalOrders) * 100;

    if (cancelledPercent > 20) {
      flagScore += 25;
      reasons.push(
        `High cancellation rate: ${cancelledPercent.toFixed(1)}% (threshold: 20%)`
      );
    }

    // -----------------------------------------------
    // RULE 3: High late delivery rate (> 40%) → +20 points
    // -----------------------------------------------
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered" && o.deliveredAt && o.placedAt
    );

    const lateDeliveries = deliveredOrders.filter((o) => {
      const placedAt = o.placedAt?.toDate?.() || new Date(o.placedAt);
      const deliveredAt = o.deliveredAt?.toDate?.() || new Date(o.deliveredAt);
      const actualMinutes = (deliveredAt - placedAt) / 1000 / 60;
      return actualMinutes > (o.estimatedDeliveryMinutes || 45) * 1.5;
    });

    const latePercent =
      deliveredOrders.length > 0
        ? (lateDeliveries.length / deliveredOrders.length) * 100
        : 0;

    if (latePercent > 40) {
      flagScore += 20;
      reasons.push(
        `High late delivery rate: ${latePercent.toFixed(1)}% (threshold: 40%)`
      );
    }

    // -----------------------------------------------
    // RULE 4: High negative review rate (> 30%) → +25 points
    // -----------------------------------------------
    const ratingsSnap = await db
      .collection("Ratings")
      .where("restaurantId", "==", restaurantId)
      .get();

    const ratings = ratingsSnap.docs.map((doc) => doc.data());
    const totalRatings = ratings.length;

    if (totalRatings > 0) {
      const negativeRatings = ratings.filter(
        (r) => r.restaurantStars <= 2
      ).length;
      const negativePercent = (negativeRatings / totalRatings) * 100;

      if (negativePercent > 30) {
        flagScore += 25;
        reasons.push(
          `High negative review rate: ${negativePercent.toFixed(1)}% (threshold: 30%)`
        );
      }
    }

    return { flagScore, reasons };
  } catch (err) {
    console.error(
      `❌ Error calculating flag score for restaurant ${restaurant.restaurantId}:`,
      err.message
    );
    return { flagScore: 0, reasons: [] };
  }
};

// ===================================================
// AGENT FLAG ENGINE
// Calculates flag score for a single delivery agent
// ===================================================

const calculateAgentFlagScore = async (agent) => {
  try {
    const agentId = agent.agentId;
    const reasons = [];
    let flagScore = 0;

    // -----------------------------------------------
    // RULE 1: Low average rating (< 3.0) → +30 points
    // -----------------------------------------------
    const avgRating = agent.avgRating || 0;
    if (avgRating > 0 && avgRating < 3.0) {
      flagScore += 30;
      reasons.push(
        `Low average rating: ${avgRating.toFixed(1)}/5.0 (threshold: 3.0)`
      );
    }

    // -----------------------------------------------
    // RULE 2: Too many late deliveries (> 10) → +30 points
    // -----------------------------------------------
    const lateDeliveries = agent.lateDeliveries || 0;
    if (lateDeliveries > 10) {
      flagScore += 30;
      reasons.push(
        `Too many late deliveries: ${lateDeliveries} (threshold: 10)`
      );
    }

    // -----------------------------------------------
    // RULE 3: Too many cancelled deliveries (> 5) → +25 points
    // -----------------------------------------------
    const ordersSnap = await db
      .collection("Orders")
      .where("deliveryAgentId", "==", agentId)
      .where("status", "==", "cancelled")
      .get();

    const cancelledDeliveries = ordersSnap.size;
    if (cancelledDeliveries > 5) {
      flagScore += 25;
      reasons.push(
        `Too many cancelled deliveries: ${cancelledDeliveries} (threshold: 5)`
      );
    }

    return { flagScore, reasons };
  } catch (err) {
    console.error(
      `❌ Error calculating flag score for agent ${agent.agentId}:`,
      err.message
    );
    return { flagScore: 0, reasons: [] };
  }
};

// ===================================================
// RUN RESTAURANT FLAG CHECK
// Checks all restaurants and updates flag status
// ===================================================

const runRestaurantFlagCheck = async () => {
  try {
    console.log("🔍 Running restaurant flag check...");

    const restaurantsSnap = await db
      .collection("Restaurants")
      .where("isApproved", "==", true)
      .get();

    if (restaurantsSnap.empty) {
      console.log("ℹ️ No restaurants to check.");
      return;
    }

    let flaggedCount = 0;
    let newlyFlaggedCount = 0;

    for (const doc of restaurantsSnap.docs) {
      const restaurant = doc.data();
      const { flagScore, reasons } = await calculateRestaurantFlagScore(restaurant);

      const newFlagStatus = flagScore >= 50 ? "flagged" : "none";
      const wasAlreadyFlagged = restaurant.flagStatus === "flagged";
      const isNewlyFlagged = newFlagStatus === "flagged" && !wasAlreadyFlagged;

      // Update flag status in Firestore
      await db.collection("Restaurants").doc(doc.id).update({
        flagStatus: newFlagStatus,
        lastFlagCheck: new Date(),
        flagScore: flagScore,
      });

      if (newFlagStatus === "flagged") {
        flaggedCount++;

        // Only send email alert if newly flagged (not on every cron run)
        if (isNewlyFlagged) {
          newlyFlaggedCount++;
          await sendFlagAlert(
            "Restaurant",
            restaurant.name,
            restaurant.restaurantId,
            flagScore,
            reasons
          );
          console.log(`🚩 Restaurant newly flagged: ${restaurant.name} (score: ${flagScore})`);
        }
      }
    }

    console.log(
      `✅ Restaurant flag check complete. Flagged: ${flaggedCount}, Newly flagged: ${newlyFlaggedCount}`
    );
  } catch (err) {
    console.error("❌ Restaurant flag check error:", err.message);
  }
};

// ===================================================
// RUN AGENT FLAG CHECK
// Checks all delivery agents and updates flag status
// ===================================================

const runAgentFlagCheck = async () => {
  try {
    console.log("🔍 Running agent flag check...");

    const agentsSnap = await db.collection("DeliveryAgentProfiles").get();

    if (agentsSnap.empty) {
      console.log("ℹ️ No agents to check.");
      return;
    }

    let flaggedCount = 0;
    let newlyFlaggedCount = 0;

    for (const doc of agentsSnap.docs) {
      const agent = doc.data();
      const { flagScore, reasons } = await calculateAgentFlagScore(agent);

      const newFlagStatus = flagScore >= 50 ? "flagged" : "none";
      const wasAlreadyFlagged = agent.flagStatus === "flagged";
      const isNewlyFlagged = newFlagStatus === "flagged" && !wasAlreadyFlagged;

      // Update flag status in Firestore
      await db.collection("DeliveryAgentProfiles").doc(doc.id).update({
        flagStatus: newFlagStatus,
        lastFlagCheck: new Date(),
        flagScore: flagScore,
      });

      if (newFlagStatus === "flagged") {
        flaggedCount++;

        if (isNewlyFlagged) {
          newlyFlaggedCount++;
          await sendFlagAlert(
            "Delivery Agent",
            agent.name,
            agent.agentId,
            flagScore,
            reasons
          );
          console.log(`🚩 Agent newly flagged: ${agent.name} (score: ${flagScore})`);
        }
      }
    }

    console.log(
      `✅ Agent flag check complete. Flagged: ${flaggedCount}, Newly flagged: ${newlyFlaggedCount}`
    );
  } catch (err) {
    console.error("❌ Agent flag check error:", err.message);
  }
};

// ===================================================
// GET FLAG SUMMARY FOR ADMIN DASHBOARD
// ===================================================

const getFlagSummary = async () => {
  try {
    const [flaggedRestaurants, flaggedAgents] = await Promise.all([
      db
        .collection("Restaurants")
        .where("flagStatus", "==", "flagged")
        .get(),
      db
        .collection("DeliveryAgentProfiles")
        .where("flagStatus", "==", "flagged")
        .get(),
    ]);

    return {
      flaggedRestaurants: flaggedRestaurants.size,
      flaggedAgents: flaggedAgents.size,
      flaggedRestaurantList: flaggedRestaurants.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        flagScore: doc.data().flagScore || 0,
        avgRating: doc.data().avgRating || 0,
      })),
      flaggedAgentList: flaggedAgents.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        flagScore: doc.data().flagScore || 0,
        avgRating: doc.data().avgRating || 0,
      })),
    };
  } catch (err) {
    console.error("❌ Flag summary error:", err.message);
    return {
      flaggedRestaurants: 0,
      flaggedAgents: 0,
      flaggedRestaurantList: [],
      flaggedAgentList: [],
    };
  }
};

module.exports = {
  runRestaurantFlagCheck,
  runAgentFlagCheck,
  getFlagSummary,
  calculateRestaurantFlagScore,
  calculateAgentFlagScore,
};