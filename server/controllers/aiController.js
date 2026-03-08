// ===================================================
// DISHDROP — AI Controller
// server/controllers/aiController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const {
  aiSearchMenuItems,
  aiChatSupport,
} = require("../services/groqService");
const {
  getRecommendationsForCustomer,
  getAvailableMenuItems,
} = require("../services/recommendationEngine");


// ===================================================
// AI NATURAL LANGUAGE SEARCH
// POST /api/ai/search
// Public (optionally authenticated)
// ===================================================

const aiSearch = async (req, res) => {
  try {
    const { query, restaurantId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    let menuItems = [];

    if (restaurantId) {
      // Search within a specific restaurant
      const menuSnap = await db
        .collection("MenuItems")
        .where("restaurantId", "==", restaurantId)
        .where("isAvailable", "==", true)
        .get();

      menuItems = menuSnap.docs.map((doc) => ({
        itemId: doc.id,
        ...doc.data(),
      }));
    } else {
      // Search across all available restaurants
      menuItems = await getAvailableMenuItems();
    }

    if (menuItems.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        searchSummary: "No menu items available to search.",
        query,
      });
    }

    // Limit items sent to Groq to avoid token limits
    // Send only essential fields
    const trimmedItems = menuItems.map((item) => ({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      price: item.discountedPrice || item.price,
      category: item.category,
      tags: item.tags || [],
      isVeg: item.isVeg,
      spiceLevel: item.spiceLevel,
      restaurantName: item.restaurantName,
    }));

    // Call Groq AI
    const aiResult = await aiSearchMenuItems(query.trim(), trimmedItems);

    // Map matched IDs back to full item objects
    const matchedItems = aiResult.matchedItemIds
      .map((id) => menuItems.find((item) => item.itemId === id))
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: matchedItems,
      searchSummary: aiResult.searchSummary,
      query,
      totalMatched: matchedItems.length,
    });
  } catch (err) {
    console.error("❌ AI Search error:", err.message);
    return res.status(500).json({
      success: false,
      message: "AI search failed. Please try again.",
    });
  }
};

// ===================================================
// AI FOOD RECOMMENDATIONS
// POST /api/ai/recommend
// Customer only
// ===================================================

const aiRecommend = async (req, res) => {
  try {
    const uid = req.user.uid;

    const result = await getRecommendationsForCustomer(uid);

    return res.status(200).json({
      success: true,
      data: result.recommendations,
      reason: result.reason,
      total: result.recommendations.length,
    });
  } catch (err) {
    console.error("❌ AI Recommend error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get recommendations.",
    });
  }
};

// ===================================================
// AI CHAT SUPPORT — SEND MESSAGE
// POST /api/ai/chat
// Customer only
// ===================================================

const aiChat = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { message, sessionId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    // Get or create chat session
    let session = null;
    let sessionDocId = sessionId;

    if (sessionId) {
      const sessionDoc = await db
        .collection("ChatSessions")
        .doc(sessionId)
        .get();

      if (sessionDoc.exists && sessionDoc.data().customerId === uid) {
        session = sessionDoc.data();
      }
    }

    // Create new session if not found
    if (!session) {
      sessionDocId = uuidv4();
      session = {
        sessionId: sessionDocId,
        customerId: uid,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection("ChatSessions")
        .doc(sessionDocId)
        .set(session);
    }

    // Fetch customer's recent orders for context
    const recentOrdersSnap = await db
      .collection("Orders")
      .where("customerId", "==", uid)
      .orderBy("placedAt", "desc")
      .limit(5)
      .get();

    const recentOrders = recentOrdersSnap.docs.map((doc) => {
      const order = doc.data();
      return {
        orderId: order.orderId,
        restaurantName: order.restaurantName,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items?.map((i) => i.name).join(", "),
        placedAt: order.placedAt?.toDate?.()?.toISOString() || null,
        estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      };
    });

    // Build message history for Groq
    const messageHistory = session.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add current user message
    messageHistory.push({
      role: "user",
      content: message.trim(),
    });

    // Call Groq AI
    const aiReply = await aiChatSupport(messageHistory, recentOrders);

    // Update session with new messages
    const now = new Date();
    const userMessage = {
      role: "user",
      content: message.trim(),
      timestamp: now,
    };

    const assistantMessage = {
      role: "assistant",
      content: aiReply,
      timestamp: now,
    };

    const updatedMessages = [
      ...session.messages,
      userMessage,
      assistantMessage,
    ];

    // Keep last 50 messages per session
    const trimmedMessages = updatedMessages.slice(-50);

    await db
      .collection("ChatSessions")
      .doc(sessionDocId)
      .update({
        messages: trimmedMessages,
        updatedAt: now,
      });

    return res.status(200).json({
      success: true,
      data: {
        sessionId: sessionDocId,
        reply: aiReply,
        timestamp: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ AI Chat error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Chat service unavailable. Please try again.",
    });
  }
};

// ===================================================
// GET CHAT SESSION HISTORY
// GET /api/ai/chat/:sessionId
// Customer only — returns full message history
// ===================================================

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const uid = req.user.uid;

    const sessionDoc = await db
      .collection("ChatSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
      });
    }

    const session = sessionDoc.data();

    // Verify ownership
    if (session.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this chat session.",
      });
    }

    // Format timestamps
    const messages = session.messages.map((m) => ({
      ...m,
      timestamp:
        m.timestamp?.toDate?.()?.toISOString() ||
        m.timestamp?.toISOString?.() ||
        new Date().toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        messages,
        createdAt:
          session.createdAt?.toDate?.()?.toISOString() ||
          session.createdAt,
        updatedAt:
          session.updatedAt?.toDate?.()?.toISOString() ||
          session.updatedAt,
      },
    });
  } catch (err) {
    console.error("❌ Get chat history error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history.",
    });
  }
};

// ===================================================
// GET OR CREATE ACTIVE SESSION
// GET /api/ai/chat/session
// Customer only — returns latest session or creates one
// ===================================================

const getOrCreateSession = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Find most recent session
    const sessionsSnap = await db
      .collection("ChatSessions")
      .where("customerId", "==", uid)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (!sessionsSnap.empty) {
      const sessionDoc = sessionsSnap.docs[0];
      const session = sessionDoc.data();

      // Format messages
      const messages = session.messages.map((m) => ({
        ...m,
        timestamp:
          m.timestamp?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      }));

      return res.status(200).json({
        success: true,
        data: {
          sessionId: sessionDoc.id,
          messages,
          isNew: false,
        },
      });
    }

    // Create new session
    const sessionId = uuidv4();
    const now = new Date();

    const newSession = {
      sessionId,
      customerId: uid,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("ChatSessions").doc(sessionId).set(newSession);

    return res.status(201).json({
      success: true,
      data: {
        sessionId,
        messages: [],
        isNew: true,
      },
    });
  } catch (err) {
    console.error("❌ Get or create session error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize chat session.",
    });
  }
};

// ===================================================
// CLEAR CHAT SESSION
// DELETE /api/ai/chat/:sessionId
// Customer only
// ===================================================

const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const uid = req.user.uid;

    const sessionDoc = await db
      .collection("ChatSessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found.",
      });
    }

    if (sessionDoc.data().customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to clear this session.",
      });
    }

    // Clear messages but keep session
    await db.collection("ChatSessions").doc(sessionId).update({
      messages: [],
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Chat history cleared.",
    });
  } catch (err) {
    console.error("❌ Clear chat session error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to clear chat session.",
    });
  }
};

module.exports = {
  aiSearch,
  aiRecommend,
  aiChat,
  getChatHistory,
  getOrCreateSession,
  clearChatSession,
};
