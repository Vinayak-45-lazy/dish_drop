import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiCheckCircle, FiXCircle,
  FiRefreshCw, FiChevronDown, FiChevronUp,
  FiStar, FiClock, FiTruck
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { adminAPI } from "../services/api";
import { SkeletonCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const RestaurantCard = ({ restaurant, onApprove, onReject, onToggleOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isApproved = restaurant.isApproved === true;
  const isRejected = restaurant.isRejected === true;
  const isPending = !isApproved && !isRejected;
  const isOpen = restaurant.isOpen === true;

  const statusLabel = isApproved ? "Approved" : isRejected ? "Rejected" : "Pending";
  const statusClass = isApproved
    ? "bg-green-100 text-green-600"
    : isRejected
    ? "bg-red-100 text-red-500"
    : "bg-yellow-100 text-yellow-600";

  const openClass = isOpen
    ? "bg-green-50 text-green-600 border border-green-200"
    : "bg-gray-100 text-gray-400 border border-gray-200";

  const cuisines = restaurant.cuisineTypes ? restaurant.cuisineTypes.join(", ") : "";
  const rating = restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : "New";
  const totalOrders = restaurant.totalOrders || 0;
  const deliveryFee = restaurant.deliveryFee === 0 ? "Free" : "Rs." + restaurant.deliveryFee;
  const deliveryTime = (restaurant.avgDeliveryMinutes || 30) + " min";

  const handleApprove = async () => {
    try {
      setLoading(true);
      await onApprove(restaurant.restaurantId);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await onReject(restaurant.restaurantId);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setLoading(true);
      await onToggleOpen(restaurant.restaurantId, !isOpen);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* Cover / Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0">
            {restaurant.coverImageUrl ? (
              <img src={restaurant.coverImageUrl} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MdRestaurant className="text-orange-300 text-2xl" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base line-clamp-1">{restaurant.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cuisines}</p>
              </div>
              <span className={"text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 " + statusClass}>
                {statusLabel}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FiStar className="text-yellow-400 text-xs" />
                {rating}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FiClock className="text-orange-400 text-xs" />
                {deliveryTime}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FiTruck className="text-blue-400 text-xs" />
                {deliveryFee}
              </span>
              <span className="text-xs text-gray-400">{totalOrders + " orders"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {isPending && (
            <>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <FiCheckCircle className="text-xs" />
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                <FiXCircle className="text-xs" />
                Reject
              </button>
            </>
          )}
          {isApproved && (
            <button
              onClick={handleToggle}
              disabled={loading}
              className={"flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors " + openClass}
            >
              {isOpen ? "Open" : "Closed"}
            </button>
          )}
          {isRejected && (
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <FiCheckCircle className="text-xs" />
              Re-approve
            </button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
          >
            Details
            {expanded ? <FiChevronUp className="text-xs" /> : <FiChevronDown className="text-xs" />}
          </button>
        </div>
      </div>

      {/* EXPANDED */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-50"
          >
            <div className="p-4 space-y-3">
              {restaurant.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{restaurant.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Owner", value: restaurant.ownerName || "N/A" },
                  { label: "Phone", value: restaurant.phone || "N/A" },
                  { label: "Min Order", value: "Rs." + (restaurant.minimumOrderAmount || 0) },
                  { label: "Hours", value: (restaurant.openingTime || "9:00") + " - " + (restaurant.closingTime || "22:00") },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              {restaurant.address && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-sm text-gray-600 mt-0.5">{restaurant.address}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllRestaurants();
      setRestaurants(res.data.data || []);
    } catch (err) {
      console.error("Fetch restaurants error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (restaurantId) => {
    try {
      await adminAPI.approveRestaurant(restaurantId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.restaurantId === restaurantId
            ? { ...r, isApproved: true, isRejected: false }
            : r
        )
      );
      toast.success("Restaurant approved!");
    } catch (err) {
      toast.error("Failed to approve.");
    }
  };

  const handleReject = async (restaurantId) => {
    try {
      await adminAPI.rejectRestaurant(restaurantId);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.restaurantId === restaurantId
            ? { ...r, isApproved: false, isRejected: true }
            : r
        )
      );
      toast.success("Restaurant rejected.");
    } catch (err) {
      toast.error("Failed to reject.");
    }
  };

  const handleToggleOpen = async (restaurantId, newStatus) => {
    try {
      await adminAPI.toggleRestaurantOpen(restaurantId, newStatus);
      setRestaurants((prev) =>
        prev.map((r) =>
          r.restaurantId === restaurantId ? { ...r, isOpen: newStatus } : r
        )
      );
      toast.success(newStatus ? "Restaurant opened." : "Restaurant closed.");
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.cuisineTypes || []).some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" ||
      (filter === "pending" && !r.isApproved && !r.isRejected) ||
      (filter === "approved" && r.isApproved) ||
      (filter === "rejected" && r.isRejected);
    return matchSearch && matchFilter;
  });

  const counts = {
    all: restaurants.length,
    pending: restaurants.filter((r) => !r.isApproved && !r.isRejected).length,
    approved: restaurants.filter((r) => r.isApproved).length,
    rejected: restaurants.filter((r) => r.isRejected).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Restaurants</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {restaurants.length + " total • " + counts.pending + " pending"}
            </p>
          </div>
          <button onClick={fetchRestaurants} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or cuisine..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
          />
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {STATUS_FILTERS.map((f) => {
            const isActive = filter === f.value;
            const count = counts[f.value] || 0;
            const cls = "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all " +
              (isActive ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200");
            return (
              <button key={f.value} onClick={() => setFilter(f.value)} className={cls}>
                {f.label}
                {count > 0 && (
                  <span className={"text-xs px-1.5 py-0.5 rounded-full font-black " +
                    (isActive ? "bg-white/30 text-white" : "bg-gray-100 text-gray-500")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* LIST */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MdRestaurant className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No restaurants found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurantId}
                  restaurant={restaurant}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onToggleOpen={handleToggleOpen}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRestaurants;