// ===================================================
// DISHDROP — Restaurant Card Component
// client/src/components/RestaurantCard.jsx
// ===================================================

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiStar, FiClock, FiTruck } from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";

const RestaurantCard = ({ restaurant, index = 0 }) => {
  const {
    restaurantId,
    name,
    description,
    cuisineTypes = [],
    coverImageUrl,
    avgRating = 0,
    totalRatings = 0,
    avgDeliveryMinutes = 30,
    deliveryFee = 0,
    minimumOrderAmount = 0,
    isOpen = true,
    isApproved = true,
  } = restaurant;

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500";
    if (rating >= 4.0) return "bg-green-400";
    if (rating >= 3.5) return "bg-yellow-400";
    if (rating >= 3.0) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link to={`/restaurants/${restaurantId}`}>
        <div className={`bg-white rounded-2xl shadow-sm hover:shadow-xl
          transition-all duration-300 overflow-hidden border border-gray-100
          ${!isOpen ? "opacity-75" : ""}`}
        >
          {/* ---- COVER IMAGE ---- */}
          <div className="relative h-48 overflow-hidden bg-gray-100">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105
                  transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                bg-orange-50">
                <MdRestaurant className="text-6xl text-orange-200" />
              </div>
            )}

            {/* Closed Overlay */}
            {!isOpen && (
              <div className="absolute inset-0 bg-black/50 flex items-center
                justify-center">
                <span className="bg-white text-gray-800 font-bold text-sm
                  px-4 py-2 rounded-full shadow-lg">
                  Currently Closed
                </span>
              </div>
            )}

            {/* Rating Badge */}
            <div className={`absolute top-3 left-3 flex items-center gap-1
              px-2 py-1 rounded-lg text-white text-xs font-bold shadow-md
              ${getRatingColor(avgRating)}`}
            >
              <FiStar className="text-xs" />
              <span>{avgRating > 0 ? avgRating.toFixed(1) : "New"}</span>
            </div>

            {/* Free Delivery Badge */}
            {deliveryFee === 0 && (
              <div className="absolute top-3 right-3 bg-green-500 text-white
                text-xs font-bold px-2 py-1 rounded-lg shadow-md">
                Free Delivery
              </div>
            )}
          </div>

          {/* ---- CONTENT ---- */}
          <div className="p-4">
            {/* Name + Cuisine */}
            <div className="mb-2">
              <h3 className="font-bold text-gray-900 text-lg leading-tight
                group-hover:text-orange-500 transition-colors line-clamp-1">
                {name}
              </h3>
              <p className="text-gray-500 text-sm mt-0.5 line-clamp-1 capitalize">
                {cuisineTypes.slice(0, 3).join(" • ")}
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-xs line-clamp-2 mb-3 leading-relaxed">
              {description}
            </p>

            {/* Stats Row */}
            <div className="flex items-center justify-between pt-3
              border-t border-gray-100">
              {/* Delivery Time */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiClock className="text-orange-400 text-sm" />
                <span className="text-sm font-medium">
                  {avgDeliveryMinutes} min
                </span>
              </div>

              {/* Delivery Fee */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <FiTruck className="text-orange-400 text-sm" />
                <span className="text-sm font-medium">
                  {deliveryFee === 0
                    ? "Free"
                    : `Rs.${deliveryFee}`}
                </span>
              </div>

              {/* Min Order */}
              <div className="text-right">
                <span className="text-xs text-gray-400">
                  Min: Rs.{minimumOrderAmount}
                </span>
              </div>
            </div>

            {/* Total Ratings */}
            {totalRatings > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {totalRatings.toLocaleString()} ratings
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RestaurantCard;