// ===================================================
// DISHDROP — AI Recommendation Engine
// server/services/recommendationEngine.js
// ===================================================

const { db } = require("../firebase");
const { aiGetRecommendations } = require("./groqService");

// ===================================================
// GET CUSTOMER ORDER HISTORY
// Fetches last 10 orders for a customer
// ===================================================

const getCustomerOrderHistory = async (customerId) => {
  try {
    const ordersSnap = await db
      .collection("Orders")
      .where("customerId", "==", customerId)
      .where("status", "==", "delivered")
      .orderBy("placedAt", "desc")
      .limit(10)
      .get();

    if (ordersSnap.empty) return [];

    return ordersSnap.docs.map((doc) => {
      const order = doc.data();
      return {
        orderId: order.orderId,
        restaurantName: order.restaurantName,
        items: order.items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount: order.totalAmount,
        placedAt: order.placedAt?.toDate?.()?.toISOString() || null,
      };
    });
  } catch (err) {
    console.error("❌ Error fetching order history:", err.message);
    return [];
  }
};

// ===================================================
// GET AVAILABLE MENU ITEMS
// Fetches all available items from approved restaurants
// ===================================================

const getAvailableMenuItems = async () => {
  try {
    // Get all approved and open restaurants
    // Get all restaurants
const restaurantsSnap = await db
  .collection("Restaurants")
  .get();
    if (restaurantsSnap.empty) return [];

    const restaurantIds = restaurantsSnap.docs.map((doc) => doc.id);
    const restaurantMap = {};
    restaurantsSnap.docs.forEach((doc) => {
      restaurantMap[doc.id] = doc.data().name;
    });

    // Firestore "in" query supports max 30 items at a time
    const chunkSize = 30;
    const chunks = [];
    for (let i = 0; i < restaurantIds.length; i += chunkSize) {
      chunks.push(restaurantIds.slice(i, i + chunkSize));
    }

    let allItems = [];

    for (const chunk of chunks) {
      const menuSnap = await db
        .collection("MenuItems")
        .where("restaurantId", "in", chunk)
        .where("isAvailable", "==", true)
        .get();

      const items = menuSnap.docs.map((doc) => {
        const item = doc.data();
        return {
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          price: item.discountedPrice || item.price,
          category: item.category,
          tags: item.tags || [],
          isVeg: item.isVeg,
          spiceLevel: item.spiceLevel,
          avgRating: item.avgRating || 0,
          totalOrders: item.totalOrders || 0,
          restaurantId: item.restaurantId,
          restaurantName: restaurantMap[item.restaurantId] || "Unknown",
          imageUrl: item.imageUrl,
        };
      });

      allItems = [...allItems, ...items];
    }

    return allItems;
  } catch (err) {
    console.error("❌ Error fetching available menu items:", err.message);
    return [];
  }
};

// ===================================================
// GET POPULAR ITEMS FALLBACK
// Used when customer has no order history
// Returns top items by totalOrders
// ===================================================

const getPopularItems = async (limit = 6) => {
  try {
    const menuSnap = await db
      .collection("MenuItems")
      .where("isAvailable", "==", true)
      .orderBy("totalOrders", "desc")
      .limit(limit)
      .get();

    if (menuSnap.empty) return [];

    return menuSnap.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("❌ Error fetching popular items:", err.message);
    return [];
  }
};

// ===================================================
// MAIN — GET RECOMMENDATIONS FOR CUSTOMER
// Combines order history + Groq AI to get suggestions
// ===================================================

const getRecommendationsForCustomer = async (customerId) => {
  try {
    // Step 1: Get customer order history
    const orderHistory = await getCustomerOrderHistory(customerId);

    // Step 2: Get all available menu items
    const availableItems = await getAvailableMenuItems();

    if (availableItems.length === 0) {
      return {
        recommendations: [],
        reason: "No items available right now.",
      };
    }

    // Step 3: If no order history, return popular items
    if (orderHistory.length === 0) {
      const popular = await getPopularItems(6);
      return {
        recommendations: popular,
        reason: "Here are our most popular items loved by DishDrop customers! 🔥",
      };
    }

    // Step 4: Call Groq AI for personalized recommendations
    const aiResult = await aiGetRecommendations(orderHistory, availableItems);

    if (!aiResult.recommendedItemIds || aiResult.recommendedItemIds.length === 0) {
      const popular = await getPopularItems(6);
      return {
        recommendations: popular,
        reason: "Trending items you might love! 🔥",
      };
    }

    // Step 5: Map recommended IDs back to full item objects
    const recommendedItems = aiResult.recommendedItemIds
      .map((id) => availableItems.find((item) => item.itemId === id))
      .filter(Boolean) // Remove any unmatched IDs
      .slice(0, 6);

    // Step 6: If AI returned fewer than 3 items, pad with popular ones
    if (recommendedItems.length < 3) {
      const popular = await getPopularItems(6);
      const popularNotInRecs = popular.filter(
        (p) => !recommendedItems.find((r) => r.itemId === p.itemId)
      );
      recommendedItems.push(...popularNotInRecs.slice(0, 6 - recommendedItems.length));
    }

    return {
      recommendations: recommendedItems,
      reason: aiResult.recommendationReason,
    };
  } catch (err) {
    console.error("❌ Recommendation engine error:", err.message);

    // Final fallback
    const popular = await getPopularItems(6);
    return {
      recommendations: popular,
      reason: "Popular items near you! 🔥",
    };
  }
};

// ===================================================
// GET SIMILAR ITEMS
// For "You might also like" on RestaurantDetail page
// ===================================================

const getSimilarItems = async (currentItem, restaurantId, limit = 4) => {
  try {
    const menuSnap = await db
      .collection("MenuItems")
      .where("restaurantId", "==", restaurantId)
      .where("isAvailable", "==", true)
      .get();

    if (menuSnap.empty) return [];

    const allItems = menuSnap.docs
      .map((doc) => doc.data())
      .filter((item) => item.itemId !== currentItem.itemId);

    // Score by similarity
    const scored = allItems.map((item) => {
      let score = 0;

      // Same category
      if (item.category === currentItem.category) score += 3;

      // Same veg/non-veg
      if (item.isVeg === currentItem.isVeg) score += 2;

      // Shared tags
      const sharedTags = (item.tags || []).filter((tag) =>
        (currentItem.tags || []).includes(tag)
      );
      score += sharedTags.length;

      // Similar price range (within 20%)
      const priceDiff = Math.abs(item.price - currentItem.price) / currentItem.price;
      if (priceDiff <= 0.2) score += 2;

      // Higher rated items get a boost
      score += item.avgRating || 0;

      return { ...item, similarityScore: score };
    });

    // Sort by similarity score and return top items
    return scored
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map(({ similarityScore, ...item }) => item);
  } catch (err) {
    console.error("❌ Similar items error:", err.message);
    return [];
  }
};

module.exports = {
  getRecommendationsForCustomer,
  getSimilarItems,
  getAvailableMenuItems,
  getPopularItems,
};