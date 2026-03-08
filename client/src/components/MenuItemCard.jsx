// ===================================================
// DISHDROP — Menu Item Card Component
// client/src/components/MenuItemCard.jsx
// ===================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiMinus, FiStar } from "react-icons/fi";
import { MdLocalFireDepartment } from "react-icons/md";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const MenuItemCard = ({ item, restaurant }) => {
  const { addItem, incrementItem, decrementItem, getItemQuantity } = useCart();
  const { isCustomer, isLoggedIn } = useAuth();

  const {
    itemId,
    name,
    description,
    price,
    discountedPrice,
    imageUrl,
    isVeg,
    isAvailable = true,
    spiceLevel,
    tags = [],
    avgRating = 0,
    totalOrders = 0,
  } = item;

  const quantity = getItemQuantity(itemId);
  const hasDiscount = discountedPrice && discountedPrice < price;
  const displayPrice = discountedPrice || price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountedPrice) / price) * 100)
    : 0;

  const getSpiceIcon = () => {
    const levels = {
      hot: 3,
      "extra-hot": 4,
      medium: 2,
      mild: 1,
    };
    const count = levels[spiceLevel] || 0;
    if (count === 0) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MdLocalFireDepartment
            key={i}
            className="text-orange-400 text-xs"
          />
        ))}
      </div>
    );
  };

  const handleAdd = () => {
    if (!isAvailable) return;
    addItem(item, restaurant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden
        hover:shadow-md transition-all duration-300
        ${!isAvailable ? "opacity-60" : ""}`}
    >
      <div className="flex gap-3 p-4">

        {/* ---- LEFT: DETAILS ---- */}
        <div className="flex-1 min-w-0">

          {/* Veg / Non-Veg Indicator */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`w-4 h-4 border-2 rounded-sm flex items-center
              justify-center flex-shrink-0
              ${isVeg
                ? "border-green-500"
                : "border-red-500"}`}
            >
              <div className={`w-2 h-2 rounded-full
                ${isVeg ? "bg-green-500" : "bg-red-500"}`}
              />
            </div>
            {spiceLevel && spiceLevel !== "mild" && getSpiceIcon()}
            {totalOrders > 100 && (
              <span className="text-xs bg-orange-50 text-orange-500
                font-medium px-1.5 py-0.5 rounded-md">
                Bestseller
              </span>
            )}
          </div>

          {/* Name */}
          <h4 className="font-bold text-gray-900 text-base leading-tight
            line-clamp-1 mb-1">
            {name}
          </h4>

          {/* Description */}
          <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed mb-2">
            {description}
          </p>

          {/* Rating */}
          {avgRating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <FiStar className="text-yellow-400 text-xs" />
              <span className="text-xs text-gray-500 font-medium">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-base">
              Rs.{displayPrice}
            </span>
            {hasDiscount && (
              <>
                <span className="text-gray-400 text-sm line-through">
                  Rs.{price}
                </span>
                <span className="text-green-500 text-xs font-bold bg-green-50
                  px-1.5 py-0.5 rounded-md">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Not Available Badge */}
          {!isAvailable && (
            <span className="inline-block mt-2 text-xs text-red-500
              bg-red-50 px-2 py-0.5 rounded-md font-medium">
              Currently unavailable
            </span>
          )}
        </div>

        {/* ---- RIGHT: IMAGE + ADD BUTTON ---- */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">

          {/* Image */}
          <div className="relative w-28 h-24 rounded-xl overflow-hidden
            bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                bg-orange-50">
                <span className="text-3xl">🍽️</span>
              </div>
            )}

            {/* Discount Badge on Image */}
            {hasDiscount && (
              <div className="absolute top-1.5 left-1.5 bg-green-500
                text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
                -{discountPercent}%
              </div>
            )}
          </div>

          {/* Add / Quantity Controls */}
          {isCustomer && isAvailable && (
            <AnimatePresence mode="wait">
              {quantity === 0 ? (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleAdd}
                  className="w-full py-1.5 px-4 bg-orange-500 text-white
                    text-sm font-bold rounded-xl hover:bg-orange-600
                    active:scale-95 transition-all shadow-md shadow-orange-200"
                >
                  ADD
                </motion.button>
              ) : (
                <motion.div
                  key="counter"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 bg-orange-500 rounded-xl
                    px-2 py-1.5 shadow-md shadow-orange-200"
                >
                  <button
                    onClick={() => decrementItem(itemId)}
                    className="w-6 h-6 bg-white rounded-lg flex items-center
                      justify-center hover:bg-orange-50 transition-colors"
                  >
                    <FiMinus className="text-orange-500 text-xs font-bold" />
                  </button>

                  <motion.span
                    key={quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-white font-bold text-sm min-w-4 text-center"
                  >
                    {quantity}
                  </motion.span>

                  <button
                    onClick={() => incrementItem(itemId)}
                    className="w-6 h-6 bg-white rounded-lg flex items-center
                      justify-center hover:bg-orange-50 transition-colors"
                  >
                    <FiPlus className="text-orange-500 text-xs font-bold" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Not logged in hint */}
          {!isLoggedIn && isAvailable && (
            <span className="text-xs text-gray-400 text-center">
              Login to order
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MenuItemCard;