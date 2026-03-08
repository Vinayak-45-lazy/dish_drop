import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiStar, FiClock, FiTruck, FiInfo, FiChevronDown,
  FiChevronUp, FiShare2, FiHeart, FiSearch
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { restaurantAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import MenuItemCard from "../components/MenuItemCard";
import AISearchBar from "../components/AISearchBar";
import EmptyState from "../components/EmptyState";
import { SkeletonMenuItem } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const { totalItems, totalAmount, openCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchRestaurant();
    fetchMenu();
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await restaurantAPI.getById(id);
      setRestaurant(res.data.data);
    } catch (err) {
      toast.error("Restaurant not found.");
      navigate("/restaurants");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      setMenuLoading(true);
      const res = await restaurantAPI.getMenu(id);
      setMenuItems(res.data.data || []);
    } catch (err) {
      console.error("Fetch menu error:", err.message);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleAiResults = (results) => {
    setAiResults(results || null);
  };

  // Get unique categories
  const categories = ["All", ...new Set(
    menuItems.map((item) => item.category).filter(Boolean)
  )];

  // Filter menu items
  const filteredItems = (aiResults || menuItems).filter((item) => {
    if (showVegOnly && !item.isVeg) return false;
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (searchQuery && !aiResults) {
      const q = searchQuery.toLowerCase();
      return item.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category
  const groupedItems = {};
  filteredItems.forEach((item) => {
    const cat = item.category || "Other";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-64 bg-gray-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonMenuItem key={i} />)}
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  const restaurantData = {
    restaurantId: restaurant.restaurantId,
    name: restaurant.name,
    deliveryFee: restaurant.deliveryFee,
    minimumOrderAmount: restaurant.minimumOrderAmount,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* ---- COVER IMAGE ---- */}
      <div className="relative h-56 sm:h-72 bg-gray-200 overflow-hidden">
        {restaurant.coverImageUrl ? (
          <img
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <MdRestaurant className="text-8xl text-orange-200" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Back + Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <span className="text-gray-700 font-bold text-lg">←</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <FiShare2 className="text-gray-700 text-sm" />
            </button>
            <button
              onClick={() => setIsWishlisted((p) => !p)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
            >
              <FiHeart className={"text-sm " + (isWishlisted ? "text-red-500 fill-current" : "text-gray-700")} />
            </button>
          </div>
        </div>

        {/* Restaurant name on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">
            {restaurant.name}
          </h1>
          <p className="text-white/80 text-sm mt-1 capitalize">
            {restaurant.cuisineTypes?.join(" • ")}
          </p>
        </div>
      </div>

      {/* ---- RESTAURANT INFO ---- */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">

          {/* Stats Row */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-1.5">
              <div className={"px-2 py-1 rounded-lg text-white text-xs font-bold " +
                (restaurant.avgRating >= 4 ? "bg-green-500" : restaurant.avgRating >= 3 ? "bg-yellow-400" : "bg-red-400")}>
                <span className="flex items-center gap-1">
                  <FiStar className="text-xs" />
                  {restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                ({restaurant.totalRatings || 0} ratings)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <FiClock className="text-orange-400 text-sm" />
              <span className="text-sm font-medium">
                {restaurant.avgDeliveryMinutes || 30} min
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <FiTruck className="text-orange-400 text-sm" />
              <span className="text-sm font-medium">
                {restaurant.deliveryFee === 0 ? "Free Delivery" : "Rs." + restaurant.deliveryFee + " delivery"}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Min order: Rs.{restaurant.minimumOrderAmount || 0}
            </div>

            {/* Open/Closed Badge */}
            <span className={"text-xs font-bold px-2 py-1 rounded-full " +
              (restaurant.isOpen
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-500")}>
              {restaurant.isOpen ? "Open Now" : "Closed"}
            </span>
          </div>

          {/* Info Toggle */}
          <button
            onClick={() => setShowInfo((p) => !p)}
            className="flex items-center gap-1.5 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
          >
            <FiInfo className="text-sm" />
            Restaurant Info
            {showInfo ? <FiChevronUp className="text-xs" /> : <FiChevronDown className="text-xs" />}
          </button>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-2 text-sm text-gray-600">
                  {restaurant.description && (
                    <p className="leading-relaxed">{restaurant.description}</p>
                  )}
                  {restaurant.address && (
                    <p className="text-gray-400">
                      Address: {restaurant.address}
                    </p>
                  )}
                  {restaurant.openingTime && restaurant.closingTime && (
                    <p className="text-gray-400">
                      Hours: {restaurant.openingTime} - {restaurant.closingTime}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ---- MENU SECTION ---- */}
      <div className="max-w-5xl mx-auto px-4 pt-5">

        {/* Search + Veg Filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <AISearchBar
              restaurantId={id}
              onResults={handleAiResults}
              placeholder="Search menu items..."
            />
          </div>
          <button
            onClick={() => setShowVegOnly((p) => !p)}
            className={"flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold flex-shrink-0 transition-all " +
              (showVegOnly
                ? "border-green-500 bg-green-50 text-green-600"
                : "border-gray-200 text-gray-600")}
          >
            <div className={"w-3 h-3 border-2 rounded-sm " +
              (showVegOnly ? "border-green-500" : "border-gray-400")}>
              {showVegOnly && <div className="w-full h-full bg-green-500 scale-75 rounded-sm" />}
            </div>
            Veg
          </button>
        </div>

        {/* Category Tabs */}
        {categories.length > 1 && !aiResults && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={"flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all " +
                  (selectedCategory === cat
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300")}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items */}
        {menuLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonMenuItem key={i} />)}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState type="menu" />
        ) : selectedCategory === "All" && !aiResults ? (
          // Grouped by category
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-orange-500 rounded-full" />
                  {category}
                  <span className="text-gray-400 font-normal text-sm">({items.length})</span>
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.itemId}
                      item={item}
                      restaurant={restaurantData}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat list for filtered/AI results
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.itemId}
                item={item}
                restaurant={restaurantData}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---- FLOATING CART BUTTON ---- */}
      <AnimatePresence>
        {isCustomer && totalItems > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-30 max-w-md mx-auto"
          >
            <button
              onClick={openCart}
              className="w-full bg-orange-500 text-white rounded-2xl py-4 px-5 shadow-2xl shadow-orange-300 flex items-center justify-between hover:bg-orange-600 transition-colors"
            >
              <span className="bg-orange-600 rounded-xl px-2.5 py-1 text-sm font-black">
                {totalItems} items
              </span>
              <span className="font-bold text-base">View Cart</span>
              <span className="font-bold">Rs.{totalAmount.toFixed(0)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDetail;