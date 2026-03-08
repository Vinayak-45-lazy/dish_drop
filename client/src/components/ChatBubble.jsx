// ===================================================
// DISHDROP — Chat Bubble Component
// client/src/components/ChatBubble.jsx
// ===================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiCopy, FiCheck } from "react-icons/fi";
import { DotsLoader } from "./LoadingSpinner";

// ===================================================
// INDIVIDUAL CHAT BUBBLE
// ===================================================

const ChatBubble = ({ message, isTyping = false }) => {
  const [copied, setCopied] = useState(false);

  const isUser = message?.role === "user";
  const isAssistant = message?.role === "assistant";

  // -----------------------------------------------
  // FORMAT TIMESTAMP
  // -----------------------------------------------
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // -----------------------------------------------
  // COPY MESSAGE
  // -----------------------------------------------
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // -----------------------------------------------
  // FORMAT MESSAGE CONTENT
  // Handles bold, line breaks, lists
  // -----------------------------------------------
  const formatContent = (content) => {
    if (!content) return null;

    const lines = content.split("\n");

    return lines.map((line, lineIndex) => {
      if (!line.trim()) {
        return <br key={lineIndex} />;
      }

      // Handle bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        const text = line.trim().slice(2);
        return (
          <div key={lineIndex} className="flex items-start gap-2 my-0.5">
            <span className="text-orange-400 mt-1 flex-shrink-0">•</span>
            <span>{formatInlineText(text)}</span>
          </div>
        );
      }

      // Handle numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 my-0.5">
            <span className="text-orange-400 font-bold flex-shrink-0 min-w-4">
              {numberedMatch[1]}.
            </span>
            <span>{formatInlineText(numberedMatch[2])}</span>
          </div>
        );
      }

      return (
        <p key={lineIndex} className="my-0.5 leading-relaxed">
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // -----------------------------------------------
  // FORMAT INLINE TEXT
  // Handles **bold** and `code`
  // -----------------------------------------------
  const formatInlineText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-gray-100 text-orange-600 px-1.5 py-0.5 rounded
              text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // -----------------------------------------------
  // TYPING INDICATOR
  // -----------------------------------------------
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-2 mb-4"
      >
        {/* AI Avatar */}
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center
          justify-center flex-shrink-0 shadow-sm">
          <span className="text-white text-xs font-black">AI</span>
        </div>

        {/* Typing Bubble */}
        <div className="bg-white border border-gray-100 rounded-2xl
          rounded-bl-sm shadow-sm">
          <DotsLoader color="orange" />
        </div>
      </motion.div>
    );
  }

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 mb-4 group ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* ---- AVATAR ---- */}
      {isAssistant && (
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center
          justify-center flex-shrink-0 shadow-sm mb-5">
          <span className="text-white text-xs font-black">AI</span>
        </div>
      )}

      {isUser && (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center
          justify-center flex-shrink-0 mb-5">
          <FiUser className="text-gray-500 text-sm" />
        </div>
      )}

      {/* ---- BUBBLE ---- */}
      <div className={`max-w-xs sm:max-w-sm lg:max-w-md relative ${
        isUser ? "items-end" : "items-start"
      } flex flex-col`}>

        {/* Message Content */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
            ${isUser
              ? "bg-orange-500 text-white rounded-br-sm"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
            }`}
        >
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <div className="space-y-0.5">
              {formatContent(message.content)}
            </div>
          )}
        </div>

        {/* Timestamp + Copy */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}>
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>

          {/* Copy button (AI messages only) */}
          {isAssistant && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity
                p-1 rounded-lg hover:bg-gray-100"
            >
              {copied ? (
                <FiCheck className="text-green-500 text-xs" />
              ) : (
                <FiCopy className="text-gray-400 text-xs" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ===================================================
// SYSTEM MESSAGE
// Shown for system notifications in chat
// ===================================================

export const SystemMessage = ({ text }) => {
  return (
    <div className="flex justify-center my-3">
      <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5
        rounded-full">
        {text}
      </span>
    </div>
  );
};

// ===================================================
// DATE DIVIDER
// ===================================================

export const DateDivider = ({ date }) => {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
};

export default ChatBubble;