// ===================================================
// DISHDROP — Rating Modal Component
// client/src/components/RatingModal.jsx
// ===================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiStar } from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { ratingAPI } from "../services/api";
import toast from "react-hot-toast";

// ===================================================
// STAR RATING COMPONENT
// ===================================================

const StarRating = ({ value, onChange, label, disabled = false }) => {
  const [hovered, setHovered] = useState(0);

  const getStarColor = (star) => {
    const active = hovered || value;
    if (star <= active) {
      if (active >= 4) return "text-green-400";
      if (active >= 3) return "text-yellow-400";
      return "text-red-400";
    }
    return "text-gray-200";
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Great",
      5: "Excellent!",
    };
    return labels[rating] || "";
  };

  return (
    <div className="mb-5">
      {label && (
        <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      )}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.2 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            className={`text-4xl transition-colors duration-150
              ${disabled ? "cursor-default" : "cursor-pointer"}`}
          >
            <FiStar
              className={`${getStarColor(star)} ${
                star <= (hovered || value) ? "fill-current" : ""
              }`}
            />
          </motion.button>
        ))}

        {/* Rating Label */}
        <AnimatePresence mode="wait">
          {(hovered || value) > 0 && (
            <motion.span
              key={hovered || value}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm font-bold ml-1 ${
                (hovered || value) >= 4
                  ? "text-green-500"
                  : (hovered || value) >= 3
                  ? "text-yellow-500"
                  : "text-red-400"
              }`}
            >
              {getRatingLabel(hovered || value)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ===================================================
// RATING MODAL
// ===================================================

const RatingModal = ({ order, onClose, onSuccess }) => {
  const [restaurantStars, setRestaurantStars] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [agentStars, setAgentStars] = useState(0);
  const [agentComment, setAgentComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasAgent = !!order?.deliveryAgentId;

  const handleSubmit = async () => {
    if (restaurantStars === 0) {
      toast.error("Please rate the restaurant.");
      return;
    }

    try {
      setSubmitting(true);

      await ratingAPI.submit({
        orderId: order.orderId,
        restaurantStars,
        restaurantComment,
        agentStars: hasAgent ? agentStars : null,
        agentComment: hasAgent ? agentComment : "",
      });

      toast.success("Thank you for your rating! 🌟");
      onSuccess?.();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to submit rating.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md
            overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400
            px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-xl">
                  Rate Your Order
                </h2>
                <p className="text-orange-100 text-sm mt-0.5">
                  from {order?.restaurantName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center
                  justify-center text-white hover:bg-white/30 transition-colors"
              >
                <FiX />
              </button>
            </div>

            {/* Order Items Preview */}
            {order?.items && order.items.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {order.items.slice(0, 3).map((item, i) => (
                  <span
                    key={i}
                    className="bg-white/20 text-white text-xs px-2 py-1
                      rounded-full"
                  >
                    {item.name} x{item.quantity}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-1
                    rounded-full">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Restaurant Rating */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex
                  items-center justify-center">
                  <span className="text-base">🍽️</span>
                </div>
                <p className="font-bold text-gray-900">
                  {order?.restaurantName}
                </p>
              </div>

              <StarRating
                value={restaurantStars}
                onChange={setRestaurantStars}
                label="Food & Restaurant"
              />

              <textarea
                value={restaurantComment}
                onChange={(e) => setRestaurantComment(e.target.value)}
                placeholder="Share your experience with the food... (optional)"
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2.5 text-sm border border-gray-200
                  rounded-xl resize-none focus:outline-none focus:ring-2
                  focus:ring-orange-300 focus:border-orange-400 transition-all
                  text-gray-700 placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {restaurantComment.length}/300
              </p>
            </div>

            {/* Delivery Agent Rating */}
            {hasAgent && (
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex
                    items-center justify-center">
                    <MdDeliveryDining className="text-blue-500" />
                  </div>
                  <p className="font-bold text-gray-900">Delivery Agent</p>
                </div>

                <StarRating
                  value={agentStars}
                  onChange={setAgentStars}
                  label="Delivery Experience"
                />

                <textarea
                  value={agentComment}
                  onChange={(e) => setAgentComment(e.target.value)}
                  placeholder="How was the delivery? (optional)"
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200
                    rounded-xl resize-none focus:outline-none focus:ring-2
                    focus:ring-orange-300 focus:border-orange-400 transition-all
                    text-gray-700 placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {agentComment.length}/200
                </p>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting || restaurantStars === 0}
              className="w-full mt-5 py-3.5 bg-orange-500 text-white font-bold
                rounded-xl hover:bg-orange-600 disabled:opacity-50
                disabled:cursor-not-allowed transition-all shadow-lg
                shadow-orange-200"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white
                    border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Rating"
              )}
            </motion.button>

            {/* Skip */}
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 text-sm text-gray-400
                hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RatingModal;