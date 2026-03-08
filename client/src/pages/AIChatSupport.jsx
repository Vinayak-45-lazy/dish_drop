import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiRefreshCw, FiZap } from "react-icons/fi";
import { aiAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ChatBubble, { SystemMessage, DateDivider } from "../components/ChatBubble";
import { DotsLoader } from "../components/LoadingSpinner";

const QUICK_REPLIES = [
  "Track my order",
  "Cancel my order",
  "What are today's offers?",
  "Recommend something spicy",
  "Best rated restaurants",
  "Help with payment",
];

const WELCOME_MESSAGE = {
  role: "assistant",
  content: "Hi! I am DishDrop's AI assistant. I can help you track orders, find restaurants, get recommendations, and answer any questions about your food delivery. What can I help you with today?",
  timestamp: new Date().toISOString(),
};

const AIChatSupport = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSend = async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowQuickReplies(false);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiAPI.chat({
        message: messageText,
        history,
      });

      const assistantMessage = {
        role: "assistant",
        content: res.data.data.reply || "Sorry, I could not process that. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        role: "assistant",
        content: "I am having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickReplies(true);
    setInput("");
  };

  const firstName = userProfile ? (userProfile.name || "").split(" ")[0] : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-16 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <FiZap className="text-white text-base" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-base">AI Support</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 font-medium">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiRefreshCw className="text-xs" />
            Clear
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
      >
        <div className="max-w-3xl mx-auto">

          {/* Date Divider */}
          <DateDivider date={new Date().toISOString()} />

          {/* Welcome System Message */}
          {firstName ? (
            <SystemMessage text={"Welcome back, " + firstName + "!"} />
          ) : null}

          {/* Messages */}
          <div className="space-y-1">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
          </div>

          {/* Typing Indicator */}
          {loading && <ChatBubble isTyping={true} />}

          {/* Quick Replies */}
          {showQuickReplies && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-xs text-gray-400 font-medium mb-2 text-center">
                Quick questions
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your order..."
                rows={1}
                className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 flex-shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSend className="text-sm" />
              )}
            </motion.button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Powered by Groq AI
          </p>
        </div>
      </div>

    </div>
  );
};

export default AIChatSupport;