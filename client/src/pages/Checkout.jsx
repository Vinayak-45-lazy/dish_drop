import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiMapPin, FiPlus, FiCheck, FiChevronDown,
  FiChevronUp, FiAlertCircle
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CouponInput from "../components/CouponInput";
import { initiatePayment, TEST_CARD } from "../services/razorpay";
import toast from "react-hot-toast";

const Checkout = () => {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  const {
    cartItems, cartRestaurant, subtotal,
    deliveryFee, totalAmount, clearCart, isEmpty,
  } = useCart();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [showItems, setShowItems] = useState(false);
  const [showTestCard, setShowTestCard] = useState(false);
  const [processing, setProcessing] = useState(false);

  // New address form
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    addressLine: "",
    city: "",
    pincode: "",
    lat: 12.9716,
    lng: 77.5946,
  });

  useEffect(() => {
    if (isEmpty) {
      navigate("/cart");
      return;
    }
    // Auto-select first address
    if (userProfile?.addresses?.length > 0 && !selectedAddress) {
      setSelectedAddress(userProfile.addresses[0]);
    }
  }, [userProfile, isEmpty]);

  const finalTotal = totalAmount - discount;

  // -----------------------------------------------
  // ADD ADDRESS
  // -----------------------------------------------
  const handleAddAddress = async () => {
    if (!newAddress.addressLine || !newAddress.city || !newAddress.pincode) {
      toast.error("Please fill all address fields.");
      return;
    }
    try {
      const { authAPI } = await import("../services/api");
await authAPI.addAddress({
  label: newAddress.label,
  fullAddress: `${newAddress.addressLine}, ${newAddress.city} - ${newAddress.pincode}`,
  lat: newAddress.lat,
  lng: newAddress.lng,
});
      await refreshProfile();
      setShowAddAddress(false);
      setNewAddress({ label: "Home", addressLine: "", city: "", pincode: "", lat: 12.9716, lng: 77.5946 });
      toast.success("Address added!");
    } catch (err) {
      toast.error("Failed to add address.");
    }
  };

  // -----------------------------------------------
  // COUPON HANDLERS
  // -----------------------------------------------
  const handleCouponApplied = (couponData) => {
    setDiscount(couponData.discountAmount);
    setCouponCode(couponData.code);
  };

  const handleCouponRemoved = () => {
    setDiscount(0);
    setCouponCode("");
  };

  // -----------------------------------------------
  // PLACE ORDER
  // -----------------------------------------------
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address.");
      return;
    }
    if (!cartRestaurant) {
      toast.error("Cart error. Please try again.");
      return;
    }

    setProcessing(true);

    await initiatePayment({
      orderData: {
        restaurantId: cartRestaurant.restaurantId,
        restaurantName: cartRestaurant.name,
        items: cartItems.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          label: selectedAddress.label,
          addressLine: selectedAddress.addressLine,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode,
          lat: selectedAddress.lat || 12.9716,
          lng: selectedAddress.lng || 77.5946,
        },
        specialInstructions,
        couponCode: couponCode || null,
        discount,
        subtotal,
        deliveryFee,
        totalAmount: finalTotal,
      },
      userInfo: {
        name: userProfile?.name,
        email: userProfile?.email,
        phone: userProfile?.phone,
      },
      onSuccess: ({ orderId }) => {
        clearCart();
        setProcessing(false);
        navigate("/orders/" + orderId + "/track");
      },
      onFailure: () => {
        setProcessing(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Complete your order from{" "}
            <span className="text-orange-500 font-semibold">
              {cartRestaurant?.name}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* ---- DELIVERY ADDRESS ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <FiMapPin className="text-orange-500" />
                Delivery Address
              </h3>

              {/* Address List */}
              {userProfile?.addresses?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {userProfile.addresses.map((addr, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAddress(addr)}
                      className={"w-full text-left p-3 rounded-xl border-2 transition-all " +
                        (selectedAddress?.addressLine === addr.addressLine
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300")}
                    >
                      <div className="flex items-start gap-3">
                        <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 " +
                          (selectedAddress?.addressLine === addr.addressLine
                            ? "border-orange-500"
                            : "border-gray-300")}>
                          {selectedAddress?.addressLine === addr.addressLine && (
                            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {addr.label || "Home"}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {addr.addressLine}, {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm mb-3">
                  No saved addresses. Add one below.
                </div>
              )}

              {/* Add Address Toggle */}
              <button
                onClick={() => setShowAddAddress((p) => !p)}
                className="flex items-center gap-2 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                <FiPlus className="text-sm" />
                Add New Address
                {showAddAddress
                  ? <FiChevronUp className="text-xs" />
                  : <FiChevronDown className="text-xs" />}
              </button>

              {/* Add Address Form */}
              {showAddAddress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  {/* Label */}
                  <div className="flex gap-2">
                    {["Home", "Work", "Other"].map((label) => (
                      <button
                        key={label}
                        onClick={() => setNewAddress((p) => ({ ...p, label }))}
                        className={"px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all " +
                          (newAddress.label === label
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-200 text-gray-500")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress((p) => ({ ...p, addressLine: e.target.value }))}
                    placeholder="Street address, building, landmark"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    />
                    <input
                      type="text"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))}
                      placeholder="Pincode"
                      maxLength={6}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleAddAddress}
                    className="w-full py-2.5 bg-orange-500 text-white font-semibold rounded-xl text-sm hover:bg-orange-600 transition-colors"
                  >
                    Save Address
                  </button>
                </motion.div>
              )}
            </div>

            {/* ---- ORDER ITEMS ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <button
                onClick={() => setShowItems((p) => !p)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <MdRestaurant className="text-orange-500" />
                  Order Items ({cartItems.length})
                </h3>
                {showItems
                  ? <FiChevronUp className="text-gray-400" />
                  : <FiChevronDown className="text-gray-400" />}
              </button>

              {showItems && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 space-y-3"
                >
                  {cartItems.map((item) => (
                    <div key={item.itemId} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                            <MdRestaurant className="text-orange-300 text-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                        Rs.{(item.price * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ---- SPECIAL INSTRUCTIONS ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-base mb-3">
                Special Instructions
              </h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests? (e.g. extra spicy, no onions, ring doorbell)"
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {specialInstructions.length}/200
              </p>
            </div>

            {/* ---- COUPON ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                Apply Coupon
              </h3>
              <CouponInput
                orderAmount={subtotal}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
              />
            </div>

            {/* ---- TEST CARD INFO ---- */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <button
                onClick={() => setShowTestCard((p) => !p)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="text-blue-400 text-sm" />
                  <span className="text-sm font-semibold text-blue-700">
                    Test Payment Details
                  </span>
                </div>
                {showTestCard
                  ? <FiChevronUp className="text-blue-400 text-sm" />
                  : <FiChevronDown className="text-blue-400 text-sm" />}
              </button>

              {showTestCard && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 space-y-1.5"
                >
                  {[
                    { label: "Card Number", value: "4111 1111 1111 1111" },
                    { label: "Expiry", value: "Any future date" },
                    { label: "CVV", value: "Any 3 digits" },
                    { label: "OTP", value: "1234" },
                    { label: "UPI", value: "success@razorpay" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-xs">
                      <span className="text-blue-500 font-medium">{item.label}:</span>
                      <span className="text-blue-700 font-mono font-bold">{item.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* ---- BILL SUMMARY ---- */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 text-base mb-4">
                Bill Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">Rs.{subtotal.toFixed(0)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={"font-medium " + (deliveryFee === 0 ? "text-green-500" : "")}>
                    {deliveryFee === 0 ? "FREE" : "Rs." + deliveryFee}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-bold">- Rs.{discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-400 border-t border-dashed border-gray-200 pt-3">
                  <span>Taxes</span>
                  <span>Included</span>
                </div>

                <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-100 pt-3">
                  <span>Total</span>
                  <span className="text-orange-500">Rs.{finalTotal.toFixed(0)}</span>
                </div>

                {discount > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <p className="text-green-600 text-xs font-semibold text-center">
                      You save Rs.{discount} with coupon!
                    </p>
                  </div>
                )}
              </div>

              {/* Address check */}
              {!selectedAddress && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <FiAlertCircle className="text-yellow-500 text-sm flex-shrink-0" />
                  <p className="text-xs text-yellow-700 font-medium">
                    Please add a delivery address
                  </p>
                </div>
              )}

              {/* Pay Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddress}
                className="w-full mt-4 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiCheck />
                    Pay Rs.{finalTotal.toFixed(0)}
                  </span>
                )}
              </motion.button>

              <p className="text-xs text-gray-400 text-center mt-2">
                Secured by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;