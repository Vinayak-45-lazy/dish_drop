// ===================================================
// DISHDROP — Cart Drawer Component
// client/src/components/CartDrawer.jsx
// ===================================================

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiTrash2,
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const CartDrawer = () => {
  const {
    cartItems,
    cartRestaurant,
    isCartOpen,
    closeCart,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    subtotal,
    deliveryFee,
    totalAmount,
    totalItems,
    isEmpty,
  } = useCart();

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* ---- BACKDROP ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeCart}
          />

          {/* ---- DRAWER ---- */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white
              shadow-2xl z-50 flex flex-col"
          >
            {/* ---- HEADER ---- */}
            <div className="flex items-center justify-between px-5 py-4
              border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiShoppingCart className="text-orange-500 text-xl" />
                <h2 className="font-bold text-gray-900 text-lg">Your Cart</h2>
                {totalItems > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold
                    w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEmpty && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-400 hover:text-red-500
                      font-medium transition-colors px-2 py-1 rounded-lg
                      hover:bg-red-50"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-gray-500 text-xl" />
                </button>
              </div>
            </div>

            {/* ---- RESTAURANT INFO ---- */}
            {cartRestaurant && (
              <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <MdRestaurant className="text-orange-400" />
                  <span className="text-sm font-medium text-orange-700">
                    {cartRestaurant.name}
                  </span>
                </div>
              </div>
            )}

            {/* ---- CART ITEMS ---- */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isEmpty ? (
                // Empty State
                <div className="flex flex-col items-center justify-center
                  h-full text-center py-12">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex
                    items-center justify-center mb-4">
                    <FiShoppingCart className="text-3xl text-orange-300" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Add items from a restaurant to get started
                  </p>
                  <button
                    onClick={() => {
                      closeCart();
                      navigate("/restaurants");
                    }}
                    className="px-6 py-3 bg-orange-500 text-white font-semibold
                      rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Browse Restaurants
                  </button>
                </div>
              ) : (
                // Cart Items List
                <div className="space-y-3">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.itemId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 bg-gray-50
                          rounded-xl p-3"
                      >
                        {/* Item Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden
                          bg-gray-200 flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center
                              justify-center bg-orange-50">
                              <MdRestaurant className="text-orange-300" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          {/* Veg indicator + Name */}
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className={`w-3 h-3 border rounded-sm
                              flex items-center justify-center flex-shrink-0
                              ${item.isVeg
                                ? "border-green-500"
                                : "border-red-500"}`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full
                                ${item.isVeg
                                  ? "bg-green-500"
                                  : "bg-red-500"}`}
                              />
                            </div>
                            <p className="font-semibold text-gray-800 text-sm
                              line-clamp-1">
                              {item.name}
                            </p>
                          </div>

                          {/* Price */}
                          <p className="text-orange-500 font-bold text-sm">
                            Rs.{(item.price * item.quantity).toFixed(0)}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Rs.{item.price} x {item.quantity}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1 bg-white
                            border border-gray-200 rounded-lg p-0.5">
                            <button
                              onClick={() => decrementItem(item.itemId)}
                              className="w-7 h-7 flex items-center justify-center
                                rounded-md hover:bg-orange-50 transition-colors"
                            >
                              <FiMinus className="text-orange-500 text-xs" />
                            </button>
                            <span className="text-sm font-bold text-gray-800
                              min-w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => incrementItem(item.itemId)}
                              className="w-7 h-7 flex items-center justify-center
                                rounded-md hover:bg-orange-50 transition-colors"
                            >
                              <FiPlus className="text-orange-500 text-xs" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.itemId)}
                            className="p-1 text-red-400 hover:text-red-500
                              hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ---- FOOTER / BILL SUMMARY ---- */}
            {!isEmpty && (
              <div className="border-t border-gray-100 px-5 py-4 bg-white">
                {/* Bill Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">Rs.{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Delivery Fee</span>
                    <span className={`font-medium ${
                      deliveryFee === 0 ? "text-green-500" : ""
                    }`}>
                      {deliveryFee === 0 ? "FREE" : `Rs.${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 border-t
                    border-dashed border-gray-200 pt-2">
                    <span>Taxes & charges</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900
                    text-base border-t border-gray-100 pt-2">
                    <span>Total</span>
                    <span className="text-orange-500">
                      Rs.{totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-orange-500 text-white font-bold
                    text-base rounded-xl hover:bg-orange-600 transition-colors
                    shadow-lg shadow-orange-200 flex items-center justify-between
                    px-5"
                >
                  <span className="bg-orange-600 rounded-lg px-2 py-0.5 text-sm">
                    {totalItems} items
                  </span>
                  <span>Proceed to Checkout</span>
                  <span>Rs.{totalAmount.toFixed(0)}</span>
                </motion.button>

                {/* Min Order Warning */}
                {cartRestaurant?.minimumOrderAmount > subtotal && (
                  <p className="text-xs text-red-400 text-center mt-2">
                    Add Rs.
                    {(cartRestaurant.minimumOrderAmount - subtotal).toFixed(0)}{" "}
                    more to meet minimum order
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;