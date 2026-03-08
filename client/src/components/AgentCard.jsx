import React from "react";
import { motion } from "framer-motion";
import { FiStar, FiPackage, FiMapPin, FiAlertTriangle, FiPhone } from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";

const AgentCard = ({ agent, index = 0, showDistance = false, showEarnings = false, onFlag, onUnflag, isAdminView = false }) => {
  const { name, phone, vehicleType, vehicleNumber, isAvailable = false, totalDeliveries = 0, avgRating = 0, totalRatings = 0, totalEarnings = 0, lateDeliveries = 0, flagStatus = "none", flagScore = 0, distanceKm, lastActiveAt } = agent;

  const isFlagged = flagStatus === "flagged";

  const getLastActive = () => {
    if (!lastActiveAt) return "Unknown";
    const date = lastActiveAt?.toDate?.() || new Date(lastActiveAt);
    const diffMins = Math.floor((new Date() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return diffMins + "m ago";
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + "h ago";
    return Math.floor(diffHours / 24) + "d ago";
  };

  const getVehicleLabel = () => {
    if (vehicleType === "bicycle") return "Bicycle";
    if (vehicleType === "scooter") return "Scooter";
    return "Bike";
  };

  const getRatingColor = (r) => {
    if (r >= 4.5) return "text-green-500";
    if (r >= 4.0) return "text-green-400";
    if (r >= 3.5) return "text-yellow-500";
    return "text-red-400";
  };

  const onTimePercent = Math.round((totalDeliveries / Math.max(1, totalDeliveries + lateDeliveries)) * 100);

  const cardClass = isFlagged
    ? "bg-white rounded-2xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    : "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden";

  const avatarClass = isAvailable
    ? "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-black bg-green-100 text-green-600"
    : "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-black bg-gray-100 text-gray-400";

  const availabilityDotClass = isAvailable ? "w-2 h-2 rounded-full flex-shrink-0 bg-green-500" : "w-2 h-2 rounded-full flex-shrink-0 bg-gray-400";
  const availabilityTextClass = isAvailable ? "text-xs font-medium text-green-600" : "text-xs font-medium text-gray-400";
  const lateClass = lateDeliveries > 5 ? "rounded-xl p-2.5 text-center bg-red-50" : "rounded-xl p-2.5 text-center bg-gray-50";
  const lateTextClass = lateDeliveries > 5 ? "font-bold text-sm text-red-500" : "font-bold text-sm text-gray-900";
  const lateIconClass = lateDeliveries > 5 ? "text-xs mx-auto mb-0.5 text-red-400" : "text-xs mx-auto mb-0.5 text-gray-400";

  const flagScoreColor = flagScore >= 50 ? "text-red-500" : flagScore >= 30 ? "text-yellow-500" : "text-green-500";
  const flagBarColor = flagScore >= 50 ? "bg-red-400" : flagScore >= 30 ? "bg-yellow-400" : "bg-green-400";
  const flagBarWidth = Math.min((flagScore / 85) * 100, 100) + "%";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cardClass}
    >
      <div className="p-4">

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={avatarClass}>
              {name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">{name}</h3>
                {isFlagged && (
                  <span className="bg-red-100 text-red-500 text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <FiAlertTriangle className="text-xs" />
                    Flagged
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={availabilityDotClass} />
                <span className={availabilityTextClass}>
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-xs text-gray-400">{getLastActive()}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className={"flex items-center gap-1 justify-end " + getRatingColor(avgRating)}>
              <FiStar className="text-sm fill-current" />
              <span className="font-bold text-base">
                {avgRating > 0 ? avgRating.toFixed(1) : "New"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{totalRatings} ratings</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <FiPackage className="text-orange-400 text-xs mx-auto mb-0.5" />
            <p className="font-bold text-gray-900 text-sm">{totalDeliveries}</p>
            <p className="text-gray-400 text-xs">Deliveries</p>
          </div>

          <div className={lateClass}>
            <MdDeliveryDining className={lateIconClass} />
            <p className={lateTextClass}>{lateDeliveries}</p>
            <p className="text-gray-400 text-xs">Late</p>
          </div>

          {showDistance && distanceKm !== undefined ? (
            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
              <FiMapPin className="text-blue-400 text-xs mx-auto mb-0.5" />
              <p className="font-bold text-blue-600 text-sm">{distanceKm} km</p>
              <p className="text-gray-400 text-xs">Away</p>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-2.5 text-center">
              <p className="text-green-400 text-xs font-bold mb-0.5">Rs</p>
              <p className="font-bold text-green-600 text-sm">
                {showEarnings ? totalEarnings.toLocaleString() : onTimePercent + "%"}
              </p>
              <p className="text-gray-400 text-xs">
                {showEarnings ? "Earned" : "On Time"}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <div className="flex items-center gap-2">
            <MdDeliveryDining className="text-gray-400 text-lg" />
            <span className="text-sm font-medium text-gray-700">{getVehicleLabel()}</span>
          </div>
          {vehicleNumber && (
            <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-lg tracking-wider">
              {vehicleNumber}
            </span>
          )}
        </div>

        {isAdminView && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 font-medium">Flag Score</span>
              <span className={"text-xs font-bold " + flagScoreColor}>{flagScore}/85</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={"h-1.5 rounded-full transition-all " + flagBarColor} style={{ width: flagBarWidth }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {phone && (
            <a href={"tel:" + phone} className="text-xs text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1.5">
              <FiPhone className="text-xs" />
              {phone}
            </a>
          )}
          {isAdminView && (
            <div className="flex gap-2 ml-auto">
              {isFlagged ? (
                <button onClick={() => onUnflag?.(agent)} className="text-xs font-semibold text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                  Unflag
                </button>
              ) : (
                <button onClick={() => onFlag?.(agent)} className="text-xs font-semibold text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <FiAlertTriangle className="text-xs" />
                  Flag
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default AgentCard;