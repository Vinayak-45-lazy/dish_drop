// ===================================================
// DISHDROP — Loading Spinner Component
// client/src/components/LoadingSpinner.jsx
// ===================================================

import React from "react";
import { motion } from "framer-motion";

// ===================================================
// FULL PAGE SPINNER
// Used for page-level loading states
// ===================================================

export const FullPageSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center
            justify-center shadow-lg">
            <span className="text-white font-black text-lg">D</span>
          </div>
          <div>
            <span className="text-2xl font-black text-orange-500">Dish</span>
            <span className="text-2xl font-black text-gray-800">Drop</span>
          </div>
        </div>

        {/* Spinner */}
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-orange-100
            rounded-full" />
          <div className="absolute inset-0 border-4 border-orange-500
            border-t-transparent rounded-full animate-spin" />
        </div>

        {/* Message */}
        <p className="text-gray-400 text-sm font-medium">{message}</p>
      </motion.div>
    </div>
  );
};

// ===================================================
// INLINE SPINNER
// Used inside cards, buttons, sections
// ===================================================

export const InlineSpinner = ({ size = "md", color = "orange" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
    xl: "w-14 h-14 border-4",
  };

  const colors = {
    orange: "border-orange-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
    green: "border-green-500 border-t-transparent",
  };

  return (
    <div
      className={`${sizes[size]} ${colors[color]} rounded-full animate-spin
        flex-shrink-0`}
    />
  );
};

// ===================================================
// SECTION SPINNER
// Used for loading states inside page sections
// ===================================================

export const SectionSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-3 border-orange-100
          rounded-full" />
        <div className="absolute inset-0 border-3 border-orange-500
          border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

// ===================================================
// SKELETON CARD
// Used as placeholder while restaurant/menu loads
// ===================================================

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden
      animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
        <div className="h-3 bg-gray-200 rounded-lg w-full" />
        <div className="h-3 bg-gray-200 rounded-lg w-4/5" />
        <div className="flex justify-between pt-2">
          <div className="h-4 bg-gray-200 rounded-lg w-16" />
          <div className="h-4 bg-gray-200 rounded-lg w-16" />
          <div className="h-4 bg-gray-200 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
};

// ===================================================
// SKELETON MENU ITEM
// ===================================================

export const SkeletonMenuItem = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4
      animate-pulse">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
          <div className="h-3 bg-gray-200 rounded-lg w-full" />
          <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
          <div className="h-5 bg-gray-200 rounded-lg w-1/4 mt-2" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-28 h-24 bg-gray-200 rounded-xl" />
          <div className="w-20 h-8 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// ===================================================
// SKELETON ORDER CARD
// ===================================================

export const SkeletonOrderCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5
      animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-5 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-5 bg-gray-200 rounded-lg w-20" />
      </div>
      <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
      <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
      <div className="flex justify-between pt-2">
        <div className="h-8 bg-gray-200 rounded-xl w-24" />
        <div className="h-8 bg-gray-200 rounded-xl w-28" />
      </div>
    </div>
  );
};

// ===================================================
// DOTS LOADING ANIMATION
// Used for AI chat thinking indicator
// ===================================================

export const DotsLoader = ({ color = "orange" }) => {
  const dotColor = {
    orange: "bg-orange-400",
    gray: "bg-gray-400",
    white: "bg-white",
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${dotColor[color]}`}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ===================================================
// DEFAULT EXPORT
// ===================================================

const LoadingSpinner = ({ fullPage = false, message }) => {
  if (fullPage) return <FullPageSpinner message={message} />;
  return <InlineSpinner />;
};

export default LoadingSpinner;