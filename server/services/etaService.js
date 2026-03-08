// ===================================================
// DISHDROP — ETA Service
// server/services/etaService.js
// ===================================================

const { db } = require("../firebase");

// ===================================================
// HAVERSINE FORMULA
// Calculates straight-line distance between two
// lat/lng coordinates in kilometers
// ===================================================

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (val) => (val * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// ===================================================
// GET TIME MULTIPLIER
// Adjusts ETA based on time of day (peak hours)
// ===================================================

const getTimeMultiplier = () => {
  const hour = new Date().getHours();

  // Peak lunch hours (12pm - 2pm)
  if (hour >= 12 && hour < 14) return 1.3;

  // Peak dinner hours (7pm - 9pm)
  if (hour >= 19 && hour < 21) return 1.4;

  // Late night (10pm - 12am) — fewer agents
  if (hour >= 22 || hour < 1) return 1.2;

  // Normal hours
  return 1.0;
};

// ===================================================
// CALCULATE ORDER ETA
// Main ETA calculation function
// ===================================================

const calculateOrderETA = async (
  restaurantId,
  customerLat,
  customerLng
) => {
  try {
    // Fetch restaurant details
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      return {
        etaMinutes: 35,
        distanceKm: 0,
        breakdown: {
          prepTime: 25,
          travelTime: 10,
          bufferTime: 0,
        },
      };
    }

    const restaurant = restaurantDoc.data();

    // Step 1: Base preparation time from restaurant data
    const prepTime = restaurant.avgDeliveryMinutes || 25;

    // Step 2: Calculate distance from restaurant to customer
    const distanceKm = haversineDistance(
      restaurant.lat,
      restaurant.lng,
      customerLat,
      customerLng
    );

    // Step 3: Calculate travel time (3 minutes per km average)
    const travelTime = Math.ceil(distanceKm * 3);

    // Step 4: Apply peak hour multiplier
    const timeMultiplier = getTimeMultiplier();

    // Step 5: Add buffer time for handoff, finding parking, etc.
    const bufferTime = 5;

    // Step 6: Calculate total ETA
    const rawETA = (prepTime + travelTime + bufferTime) * timeMultiplier;

    // Round up to nearest 5 minutes for cleaner display
    const etaMinutes = Math.ceil(rawETA / 5) * 5;

    return {
      etaMinutes,
      distanceKm,
      breakdown: {
        prepTime,
        travelTime,
        bufferTime,
        timeMultiplier,
      },
    };
  } catch (err) {
    console.error("❌ ETA calculation error:", err.message);
    return {
      etaMinutes: 35,
      distanceKm: 0,
      breakdown: {
        prepTime: 25,
        travelTime: 10,
        bufferTime: 0,
      },
    };
  }
};

// ===================================================
// GET REMAINING ETA
// Calculates how many minutes are left for delivery
// Based on when order was placed + estimated ETA
// ===================================================

const getRemainingETA = (placedAt, estimatedDeliveryMinutes) => {
  try {
    const placedTime =
      placedAt?.toDate?.() || new Date(placedAt);

    const estimatedDeliveryTime = new Date(
      placedTime.getTime() + estimatedDeliveryMinutes * 60 * 1000
    );

    const now = new Date();
    const remainingMs = estimatedDeliveryTime - now;
    const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 1000 / 60));

    return {
      remainingMinutes,
      estimatedArrival: estimatedDeliveryTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      isLate: remainingMinutes === 0 && now > estimatedDeliveryTime,
    };
  } catch (err) {
    console.error("❌ Remaining ETA error:", err.message);
    return {
      remainingMinutes: 0,
      estimatedArrival: "Soon",
      isLate: false,
    };
  }
};

// ===================================================
// FIND NEAREST AVAILABLE AGENTS
// Returns agents sorted by distance to restaurant
// ===================================================

const findNearestAgents = async (restaurantLat, restaurantLng, limit = 5) => {
  try {
    const agentsSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("isAvailable", "==", true)
      .get();

    if (agentsSnap.empty) return [];

    const agents = agentsSnap.docs.map((doc) => {
      const agent = doc.data();
      const distance = haversineDistance(
        restaurantLat,
        restaurantLng,
        agent.currentLat || 0,
        agent.currentLng || 0
      );
      return { ...agent, distanceFromRestaurant: distance };
    });

    // Sort by distance ascending
    return agents
      .sort((a, b) => a.distanceFromRestaurant - b.distanceFromRestaurant)
      .slice(0, limit);
  } catch (err) {
    console.error("❌ Find nearest agents error:", err.message);
    return [];
  }
};

// ===================================================
// FORMAT ETA FOR DISPLAY
// Returns human-friendly ETA string
// ===================================================

const formatETA = (etaMinutes) => {
  if (etaMinutes <= 0) return "Arriving now";
  if (etaMinutes < 60) return `${etaMinutes} mins`;

  const hours = Math.floor(etaMinutes / 60);
  const mins = etaMinutes % 60;

  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} mins`;
};

// ===================================================
// UPDATE LATE DELIVERY COUNT FOR AGENT
// Called when an order is delivered late
// ===================================================

const recordLateDelivery = async (agentId, orderId) => {
  try {
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("agentId", "==", agentId)
      .limit(1)
      .get();

    if (agentSnap.empty) return;

    const agentDoc = agentSnap.docs[0];
    const currentLate = agentDoc.data().lateDeliveries || 0;

    await agentDoc.ref.update({
      lateDeliveries: currentLate + 1,
    });

    console.log(`⏰ Late delivery recorded for agent ${agentId}, order ${orderId}`);
  } catch (err) {
    console.error("❌ Record late delivery error:", err.message);
  }
};

module.exports = {
  haversineDistance,
  calculateOrderETA,
  getRemainingETA,
  findNearestAgents,
  formatETA,
  recordLateDelivery,
};
