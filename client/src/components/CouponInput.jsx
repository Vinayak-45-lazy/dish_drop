// ===================================================
// DISHDROP — Coupon Input Component
// client/src/components/CouponInput.jsx
// ===================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTag, FiX, FiCheck, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { couponAPI } from "../services/api";
import toast from "react-hot-toast";

// ===================================================
// SUGGESTED COUPONS (shown as quick-apply chips)
// ===================================================

const SUGGESTED_COUPONS = [
  { code: "WELCOME50", label: "Rs.50 off", minOrder: "Rs.199 min" },
  { code: "SAVE20", label: "20% off", minOrder: "Rs.299 min" },
  { code: "FLAT100", label: "Rs.100 off", minOrder: "Rs.499 min" },
];

// ===================================================
// COUPON INPUT COMPONENT
// ===================================================

const CouponInput = ({ orderAmount, onCouponApplied, onCouponRemoved }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------------------------
  // APPLY COUPON
  // -----------------------------------------------
  const handleApply = async (couponCode) => {
    const codeToApply = (couponCode || code).trim().toUpperCase();

    if (!codeToApply) {
      setError("Please enter a coupon code.");
      return;
    }

    if (!orderAmount || orderAmount <= 0) {
      setError("Add items to cart first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await couponAPI.validate({
        code: codeToApply,
        orderAmount,
      });

      const couponData = res.data.data;
      setAppliedCoupon(couponData);
      setCode("");
      setShowSuggestions(false);

      toast.success(res.data.message);
      onCouponApplied?.(couponData);
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid coupon code.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // REMOVE COUPON
  // -----------------------------------------------
  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode("");
    setError("");
    onCouponRemoved?.();
    toast.success("Coupon removed.");
  };

  // -----------------------------------------------
  // HANDLE ENTER KEY
  // -----------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  // -----------------------------------------------
  // APPLIED STATE
  // -----------------------------------------------
  if (appliedCoupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Success Icon */}
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center
              justify-center flex-shrink-0">
              <FiCheck className="text-white text-lg font-bold" />
            </div>

            {/* Coupon Details */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-700 text-sm">
                  {appliedCoupon.code}
                </span>
                <span className="bg-green-100 text-green-600 text-xs font-medium
                  px-2 py-0.5 rounded-full">
                  Applied
                </span>
              </div>
              <p className="text-green-600 text-sm font-semibold mt-0.5">
                You save Rs.{appliedCoupon.discountAmount}!
              </p>
              <p className="text-green-500 text-xs">
                {appliedCoupon.discountType === "percent"
                  ? `${appliedCoupon.discountValue}% off`
                  : `Rs.${appliedCoupon.discountValue} flat off`}
                {appliedCoupon.maxDiscountAmount
                  ? ` (max Rs.${appliedCoupon.maxDiscountAmount})`
                  : ""}
              </p>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="p-2 rounded-xl hover:bg-green-100 transition-colors
              text-green-500 hover:text-green-700"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Savings Bar */}
        <div className="mt-3 flex items-center justify-between bg-green-100
          rounded-xl px-3 py-2">
          <span className="text-xs text-green-600">Original Amount</span>
          <span className="text-xs font-bold text-green-700">
            Rs.{appliedCoupon.originalAmount}
          </span>
        </div>
        <div className="flex items-center justify-between bg-green-500
          rounded-xl px-3 py-2 mt-1">
          <span className="text-xs text-white font-medium">Final Amount</span>
          <span className="text-sm font-bold text-white">
            Rs.{appliedCoupon.finalAmount}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---- INPUT ROW ---- */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <FiTag className="absolute left-3 top-1/2 -translate-y-1/2
            text-gray-400 text-sm" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code"
            maxLength={20}
            className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm
              font-medium uppercase tracking-wider transition-all
              focus:outline-none focus:ring-2 focus:ring-orange-300
              placeholder:normal-case placeholder:tracking-normal
              placeholder:font-normal
              ${error
                ? "border-red-300 bg-red-50 focus:ring-red-200"
                : "border-gray-200 focus:border-orange-400"
              }`}
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleApply()}
          disabled={loading || !code.trim()}
          className="px-5 py-3 bg-orange-500 text-white font-bold text-sm
            rounded-xl hover:bg-orange-600 disabled:opacity-50
            disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent
              rounded-full animate-spin" />
          ) : (
            "Apply"
          )}
        </motion.button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-xs font-medium flex items-center gap-1"
          >
            <FiX className="flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ---- SUGGESTED COUPONS ---- */}
      <div>
        <button
          onClick={() => setShowSuggestions((prev) => !prev)}
          className="flex items-center gap-1.5 text-xs text-orange-500
            font-semibold hover:text-orange-600 transition-colors"
        >
          <FiTag className="text-xs" />
          View available coupons
          {showSuggestions
            ? <FiChevronUp className="text-xs" />
            : <FiChevronDown className="text-xs" />
          }
        </button>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                {SUGGESTED_COUPONS.map((coupon) => (
                  <motion.div
                    key={coupon.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-orange-50
                      border border-orange-100 border-dashed rounded-xl
                      px-3 py-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-600 text-sm
                          tracking-wider">
                          {coupon.code}
                        </span>
                        <span className="bg-orange-100 text-orange-500 text-xs
                          font-medium px-2 py-0.5 rounded-full">
                          {coupon.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {coupon.minOrder}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApply(coupon.code)}
                      disabled={loading}
                      className="text-xs font-bold text-orange-500
                        hover:text-orange-600 bg-white border border-orange-200
                        px-3 py-1.5 rounded-lg transition-colors
                        hover:bg-orange-50 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CouponInput;