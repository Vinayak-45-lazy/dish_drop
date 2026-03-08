// ===================================================
// DISHDROP — Order Status Stepper Component
// client/src/components/OrderStatusStepper.jsx
// ===================================================

import React from "react";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiTruck,
} from "react-icons/fi";
import { MdRestaurant, MdDeliveryDining } from "react-icons/md";

const STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    subLabel: "We received your order",
    icon: FiPackage,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    subLabel: "Restaurant confirmed",
    icon: FiCheckCircle,
  },
  {
    key: "preparing",
    label: "Preparing",
    subLabel: "Chef is cooking",
    icon: MdRestaurant,
  },
  {
    key: "readyForPickup",
    label: "Ready",
    subLabel: "Waiting for agent",
    icon: FiClock,
  },
  {
    key: "pickedUp",
    label: "On the Way",
    subLabel: "Agent picked up",
    icon: MdDeliveryDining,
  },
  {
    key: "delivered",
    label: "Delivered",
    subLabel: "Enjoy your meal!",
    icon: FiCheckCircle,
  },
];

const STATUS_INDEX = {
  placed: 0,
  confirmed: 1,
  preparing: 2,
  readyForPickup: 3,
  pickedUp: 4,
  delivered: 5,
  cancelled: -1,
};

const OrderStatusStepper = ({ status, placedAt, estimatedDeliveryMinutes }) => {
  const currentIndex = STATUS_INDEX[status] ?? 0;
  const isCancelled = status === "cancelled";

  // -----------------------------------------------
  // CALCULATE ETA
  // -----------------------------------------------
  const getETA = () => {
    if (!placedAt || !estimatedDeliveryMinutes) return null;
    if (status === "delivered" || status === "cancelled") return null;

    const placed = placedAt?.toDate?.() || new Date(placedAt);
    const etaTime = new Date(
      placed.getTime() + estimatedDeliveryMinutes * 60000
    );
    const now = new Date();
    const remainingMs = etaTime - now;

    if (remainingMs <= 0) return "Arriving soon";

    const remainingMins = Math.ceil(remainingMs / 60000);
    if (remainingMins < 60) return `${remainingMins} min remaining`;

    return etaTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const eta = getETA();

  // -----------------------------------------------
  // CANCELLED STATE
  // -----------------------------------------------
  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center
            justify-center flex-shrink-0">
            <FiPackage className="text-red-400 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-red-700 text-base">
              Order Cancelled
            </h3>
            <p className="text-red-400 text-sm">
              This order has been cancelled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* ---- ETA BANNER ---- */}
      {eta && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-orange-50 border border-orange-100
            rounded-xl px-4 py-3 mb-5"
        >
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center
            justify-center flex-shrink-0">
            <FiClock className="text-white text-sm" />
          </div>
          <div>
            <p className="text-xs text-orange-600 font-medium">
              Estimated Delivery
            </p>
            <p className="text-base font-bold text-orange-700">{eta}</p>
          </div>

          {/* Pulse animation */}
          <div className="ml-auto">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full
                rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3
                bg-orange-500" />
            </span>
          </div>
        </motion.div>
      )}

      {/* ---- STEPPER ---- */}
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />

        {/* Progress Line Fill */}
        <motion.div
          className="absolute left-5 top-5 w-0.5 bg-orange-500 origin-top"
          initial={{ scaleY: 0 }}
          animate={{
            scaleY: currentIndex / (STEPS.length - 1),
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            height: `calc(100% - 40px)`,
          }}
        />

        {/* Steps */}
        <div className="space-y-0">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isPending = index > currentIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-4 relative"
                style={{ paddingBottom: index < STEPS.length - 1 ? "24px" : "0" }}
              >
                {/* Step Icon */}
                <div className="relative z-10 flex-shrink-0">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-10 h-10 bg-orange-500 rounded-full flex
                        items-center justify-center shadow-md shadow-orange-200"
                    >
                      <FiCheckCircle className="text-white text-lg" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-10 h-10 bg-orange-500 rounded-full flex
                        items-center justify-center shadow-lg shadow-orange-300
                        ring-4 ring-orange-100"
                    >
                      <Icon className="text-white text-lg" />
                    </motion.div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex
                      items-center justify-center">
                      <Icon className="text-gray-300 text-lg" />
                    </div>
                  )}
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <p className={`font-semibold text-sm leading-tight ${
                    isCompleted || isActive
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    isActive
                      ? "text-orange-500 font-medium"
                      : isCompleted
                      ? "text-gray-400"
                      : "text-gray-300"
                  }`}>
                    {isActive ? step.subLabel : isCompleted ? "Done" : step.subLabel}
                  </p>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <span className="text-xs bg-orange-100 text-orange-600
                      font-bold px-2 py-1 rounded-full">
                      Current
                    </span>
                  </div>
                )}

                {/* Completed checkmark */}
                {isCompleted && (
                  <div className="flex-shrink-0">
                    <FiCheckCircle className="text-orange-400 text-sm" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusStepper;