// ===================================================
// DISHDROP — Groq AI Service
// server/services/groqService.js
// ===================================================

const Groq = require("groq-sdk");
require("dotenv").config();

// ===================================================
// GROQ CLIENT INITIALIZATION
// ===================================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// ===================================================
// 1. AI NATURAL LANGUAGE FOOD SEARCH
// Matches customer query to available menu items
// ===================================================

const aiSearchMenuItems = async (query, menuItemsArray) => {
  try {
    const prompt = `You are a food search AI for DishDrop, a food delivery platform.
Given this customer search query: "${query}"
And these available menu items as JSON: ${JSON.stringify(menuItemsArray)}

Return ONLY this exact JSON, no markdown, no extra text:
{
  "matchedItemIds": ["array of itemId strings that best match"],
  "searchSummary": "one sentence explaining what you found"
}

Rules:
- Match by name, description, tags, cuisine type
- Match price range if mentioned (e.g. "under 200 rupees")
- Match spice level if mentioned (e.g. "spicy", "mild")
- Match veg/non-veg if mentioned
- Return empty array if nothing matches
- Never include items that don't match the query`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const raw = response.choices[0]?.message?.content?.trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      matchedItemIds: parsed.matchedItemIds || [],
      searchSummary: parsed.searchSummary || "Here are the results I found.",
    };
  } catch (err) {
    console.error("❌ Groq AI Search error:", err.message);
    return {
      matchedItemIds: [],
      searchSummary: "Search completed. Showing available items.",
    };
  }
};

// ===================================================
// 2. AI FOOD RECOMMENDATIONS
// Based on customer order history
// ===================================================

const aiGetRecommendations = async (orderHistory, availableItemsArray) => {
  try {
    const prompt = `You are a food recommendation AI for DishDrop.
Given this customer's order history: ${JSON.stringify(orderHistory)}
And these available restaurants and items: ${JSON.stringify(availableItemsArray)}

Return ONLY this exact JSON, no markdown, no extra text:
{
  "recommendedItemIds": ["top 6 itemId strings"],
  "recommendationReason": "one sentence why you picked these"
}

Rules:
- Recommend based on cuisine preferences from order history
- Consider favourite restaurants they order from often
- Match their typical price range patterns
- Consider time of day for recommendations
- If no order history, recommend top-rated popular items
- Always return exactly 6 item IDs if possible`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      recommendedItemIds: parsed.recommendedItemIds || [],
      recommendationReason:
        parsed.recommendationReason || "Recommended based on popular items.",
    };
  } catch (err) {
    console.error("❌ Groq AI Recommendations error:", err.message);
    return {
      recommendedItemIds: [],
      recommendationReason: "Showing popular items near you.",
    };
  }
};

// ===================================================
// 3. AI SUPPORT CHATBOT
// Maintains conversation context, returns AI reply
// ===================================================

const aiChatSupport = async (messages, recentOrdersContext) => {
  try {
    const systemPrompt = `You are DishDrop's friendly AI support assistant.
You help customers with: order status questions, refund queries,
restaurant recommendations, menu questions, and delivery issues.

Current customer order context:
${JSON.stringify(recentOrdersContext)}

Rules:
- Always be helpful, brief, and friendly
- Use simple language, no technical jargon
- If asked about a specific order, refer to the order context above
- If you cannot resolve an issue, say: "I'll escalate this to our human support team"
- Keep responses under 150 words
- Use emojis sparingly to keep it friendly 🍕`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    return reply || "I'm here to help! Could you please rephrase your question?";
  } catch (err) {
    console.error("❌ Groq AI Chat error:", err.message);
    return "I'm having trouble connecting right now. Please try again in a moment! 🙏";
  }
};

// ===================================================
// 4. AI SMART ETA PREDICTION TEXT
// Generates human-friendly ETA message
// ===================================================

const aiGenerateETAMessage = async (etaMinutes, restaurantName, items) => {
  try {
    const prompt = `You are DishDrop's delivery assistant.
A customer just ordered from ${restaurantName}.
Items ordered: ${items.map((i) => i.name).join(", ")}
Estimated delivery time: ${etaMinutes} minutes.

Write ONE friendly, exciting sentence telling the customer their order is confirmed
and when it will arrive. Keep it under 20 words. Include the restaurant name and ETA.
No markdown, just plain text.`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 100,
    });

    const message = response.choices[0]?.message?.content?.trim();
    return (
      message ||
      `Your order from ${restaurantName} will arrive in ${etaMinutes} minutes! 🚀`
    );
  } catch (err) {
    console.error("❌ Groq ETA message error:", err.message);
    return `Your order from ${restaurantName} will arrive in approximately ${etaMinutes} minutes! 🚀`;
  }
};

module.exports = {
  aiSearchMenuItems,
  aiGetRecommendations,
  aiChatSupport,
  aiGenerateETAMessage,
};