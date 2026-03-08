import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart, FiPlus, FiMinus, FiTrash2,
  FiArrowRight, FiTag
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";

const Cart = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const {
    cartItems, cartRestaurant, isEmpty,
    incrementItem, decrementItem, removeItem, clearCart,
    subtotal, deliveryFee, totalAmount, totalItems,
  } = useCart();

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <EmptyState
            type="cart"
            title="Your cart is empty"
            description="Add items from a restaurant to get started"
            actionLabel="Browse Restaurants"
            onAction={() => navigate("/restaurants")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ---- HEADER ---- */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Your Cart</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalItems} items from{" "}
              <span className="text-orange-500 font-semibold">
                {cartRestaurant?.name}
              </span>
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 rounded-xl"
          >
            <FiTrash2 className="text-sm" />
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ---- CART ITEMS ---- */}
          <div className="lg:col-span-2 space-y-3">

            {/* Restaurant Info */}
            <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MdRestaurant className="text-orange-500 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">
                  {cartRestaurant?.name}
                </p>
                <p className="text-xs text-gray-400">
                  Delivering to your address
                </p>
              </div>
              <Link
                to={"/restaurants/" + cartRestaurant?.restaurantId}
                className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                Add More
              </Link>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.itemId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                          <MdRestaurant className="text-orange-300 text-xl" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={"w-3 h-3 border-2 rounded-sm flex items-center justify-center flex-shrink-0 " +
                          (item.isVeg ? "border-green-500" : "border-red-500")}>
                          <div className={"w-1.5 h-1.5 rounded-full " +
                            (item.isVeg ? "bg-green-500" : "bg-red-500")} />
                        </div>
                        <p className="font-semibold text-gray-800 text-sm line-clamp-1">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-orange-500 font-bold text-sm">
                        Rs.{(item.price * item.quantity).toFixed(0)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Rs.{item.price} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-xl p-1">
                        <button
                          onClick={() => decrementItem(item.itemId)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <FiMinus className="text-orange-500 text-xs" />
                        </button>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className="text-sm font-bold text-gray-800 min-w-6 text-center"
                        >
                          {item.quantity}
                        </motion.span>
                        <button
                          onClick={() => incrementItem(item.itemId)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <FiPlus className="text-orange-500 text-xs" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors text-red-400 hover:text-red-500"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Special Instructions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                placeholder="Any special requests? (e.g. extra spicy, no onions)"
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* ---- BILL SUMMARY ---- */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 text-base mb-4">
                Bill Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Subtotal ({totalItems} items)
                  </span>
                  <span className="font-medium">Rs.{subtotal.toFixed(0)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={"font-medium " + (deliveryFee === 0 ? "text-green-500" : "")}>
                    {deliveryFee === 0 ? "FREE" : "Rs." + deliveryFee}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-400 border-t border-dashed border-gray-200 pt-3">
                  <span>Taxes</span>
                  <span>Included</span>
                </div>

                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-3">
                  <span>Total</span>
                  <span className="text-orange-500">
                    Rs.{totalAmount.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Min Order Warning */}
              {cartRestaurant?.minimumOrderAmount > subtotal && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-700 font-medium">
                    Add Rs.{(cartRestaurant.minimumOrderAmount - subtotal).toFixed(0)} more to meet minimum order of Rs.{cartRestaurant.minimumOrderAmount}
                  </p>
                </div>
              )}

              {/* Coupon Hint */}
              <Link
                to="/checkout"
                className="flex items-center gap-2 mt-3 p-3 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors"
              >
                <FiTag className="text-orange-400 text-sm flex-shrink-0" />
                <span className="text-xs text-orange-600 font-medium">
                  Apply coupon at checkout
                </span>
                <FiArrowRight className="text-orange-400 text-xs ml-auto" />
              </Link>

              {/* Checkout Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={cartRestaurant?.minimumOrderAmount > subtotal}
                className="w-full mt-4 py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <FiArrowRight />
              </motion.button>

              {!isLoggedIn && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  You will be asked to login
                </p>
              )}
            </div>

            {/* Savings Card */}
            {deliveryFee === 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-green-700 text-sm font-semibold">
                  You are saving on delivery!
                </p>
                <p className="text-green-500 text-xs mt-0.5">
                  Free delivery on this order
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;