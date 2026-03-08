import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUsers, FiShoppingBag, FiDollarSign, FiStar,
  FiTrendingUp, FiAlertCircle, FiRefreshCw,
  FiChevronRight, FiCheckCircle, FiXCircle
} from "react-icons/fi";
import { MdRestaurant, MdDeliveryDining } from "react-icons/md";
import { adminAPI, orderAPI } from "../services/api";
import { SkeletonCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const StatCard = ({ icon, label, value, sub, color, delay }) => {
  const bgClass = color === "orange" ? "bg-orange-50"
    : color === "green" ? "bg-green-50"
    : color === "blue" ? "bg-blue-50"
    : color === "purple" ? "bg-purple-50"
    : "bg-red-50";
  const iconClass = color === "orange" ? "text-orange-500"
    : color === "green" ? "text-green-500"
    : color === "blue" ? "text-blue-500"
    : color === "purple" ? "text-purple-500"
    : "text-red-500";
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + bgClass}>
          <span className={iconClass}>{icon}</span>
        </div>
        {sub && (
          <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
};

const PendingRestaurantCard = ({ restaurant, onApprove, onReject }) => {
  const [loading, setLoading] = useState(false);
  const cuisines = restaurant.cuisineTypes ? restaurant.cuisineTypes.join(", ") : "";

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

  return (
    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <MdRestaurant className="text-orange-500 text-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{restaurant.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cuisines}</p>
        <p className="text-xs text-gray-300 mt-0.5">{restaurant.ownerName || ""}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiCheckCircle className="text-sm" />
          )}
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className="w-8 h-8 bg-red-100 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-200 disabled:opacity-50 transition-colors"
        >
          <FiXCircle className="text-sm" />
        </button>
      </div>
    </div>
  );
};

const RecentOrderRow = ({ order }) => {
  const STATUS_COLORS = {
    placed: "bg-blue-100 text-blue-600",
    confirmed: "bg-purple-100 text-purple-600",
    preparing: "bg-yellow-100 text-yellow-600",
    readyForPickup: "bg-orange-100 text-orange-600",
    pickedUp: "bg-indigo-100 text-indigo-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-500",
  };
  const STATUS_LABELS = {
    placed: "Placed", confirmed: "Confirmed", preparing: "Preparing",
    readyForPickup: "Ready", pickedUp: "Picked Up",
    delivered: "Delivered", cancelled: "Cancelled",
  };
  const statusColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-gray-900 text-sm">{"#" + shortId}</p>
          <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + statusColor}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-1">{order.restaurantName}</p>
      </div>
      <p className="font-bold text-gray-900 text-sm flex-shrink-0">{"Rs." + total}</p>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [flaggedAgents, setFlaggedAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, ordersRes, agentsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingRestaurants(),
        orderAPI.getAllOrders({ limit: 5 }),
        adminAPI.getFlaggedAgents(),
      ]);
      setStats(statsRes.data.data);
      setPendingRestaurants(pendingRes.data.data || []);
      setRecentOrders(ordersRes.data.data || []);
      setFlaggedAgents(agentsRes.data.data || []);
    } catch (err) {
      console.error("Admin dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRestaurant = async (restaurantId) => {
    try {
      await adminAPI.approveRestaurant(restaurantId);
      setPendingRestaurants((prev) => prev.filter((r) => r.restaurantId !== restaurantId));
      toast.success("Restaurant approved!");
    } catch (err) {
      toast.error("Failed to approve restaurant.");
    }
  };

  const handleRejectRestaurant = async (restaurantId) => {
    try {
      await adminAPI.rejectRestaurant(restaurantId);
      setPendingRestaurants((prev) => prev.filter((r) => r.restaurantId !== restaurantId));
      toast.success("Restaurant rejected.");
    } catch (err) {
      toast.error("Failed to reject restaurant.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = stats ? stats.totalUsers || 0 : 0;
  const totalRestaurants = stats ? stats.totalRestaurants || 0 : 0;
  const totalOrders = stats ? stats.totalOrders || 0 : 0;
  const totalRevenue = stats ? (stats.totalRevenue || 0).toFixed(0) : "0";
  const totalAgents = stats ? stats.totalAgents || 0 : 0;
  const pendingCount = pendingRestaurants.length;
  const flaggedCount = flaggedAgents.length;

  const QUICK_LINKS = [
    { label: "Restaurants", to: "/admin/restaurants", icon: <MdRestaurant className="text-xl" />, color: "orange", desc: "Manage & approve" },
    { label: "Orders", to: "/admin/orders", icon: <FiShoppingBag className="text-xl" />, color: "blue", desc: "View all orders" },
    { label: "Agents", to: "/admin/agents", icon: <MdDeliveryDining className="text-xl" />, color: "green", desc: "Manage agents" },
    { label: "Coupons", to: "/admin/coupons", icon: <FiStar className="text-xl" />, color: "purple", desc: "Create coupons" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">DishDrop control panel</p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className="text-gray-400 text-sm" />
          </button>
        </div>

        {/* ALERTS */}
        {(pendingCount > 0 || flaggedCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {pendingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3"
              >
                <FiAlertCircle className="text-yellow-500 text-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-yellow-800 text-sm">
                    {pendingCount + " restaurant" + (pendingCount > 1 ? "s" : "") + " pending approval"}
                  </p>
                </div>
                <Link to="/admin/restaurants" className="text-xs text-yellow-600 font-bold hover:text-yellow-700">
                  Review
                </Link>
              </motion.div>
            )}
            {flaggedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3"
              >
                <FiAlertCircle className="text-red-500 text-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-sm">
                    {flaggedCount + " flagged agent" + (flaggedCount > 1 ? "s" : "")}
                  </p>
                </div>
                <Link to="/admin/agents" className="text-xs text-red-600 font-bold hover:text-red-700">
                  Review
                </Link>
              </motion.div>
            )}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<FiUsers className="text-lg" />} label="Total Users" value={totalUsers} color="blue" delay={0} />
          <StatCard icon={<MdRestaurant className="text-lg" />} label="Restaurants" value={totalRestaurants} color="orange" delay={0.1} />
          <StatCard icon={<FiShoppingBag className="text-lg" />} label="Total Orders" value={totalOrders} color="purple" delay={0.2} />
          <StatCard icon={<FiDollarSign className="text-lg" />} label="Revenue" value={"Rs." + totalRevenue} color="green" delay={0.3} />
        </div>

        {/* SECOND ROW STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard icon={<MdDeliveryDining className="text-lg" />} label="Delivery Agents" value={totalAgents} color="blue" delay={0.4} />
          <StatCard icon={<FiAlertCircle className="text-lg" />} label="Pending Approvals" value={pendingCount} color="orange" delay={0.5} />
          <StatCard icon={<FiTrendingUp className="text-lg" />} label="Flagged Agents" value={flaggedCount} color="red" delay={0.6} />
        </div>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {QUICK_LINKS.map((link) => {
            const bgClass = link.color === "orange" ? "bg-orange-50 hover:bg-orange-100 text-orange-600"
              : link.color === "blue" ? "bg-blue-50 hover:bg-blue-100 text-blue-600"
              : link.color === "green" ? "bg-green-50 hover:bg-green-100 text-green-600"
              : "bg-purple-50 hover:bg-purple-100 text-purple-600";
            return (
              <Link
                key={link.label}
                to={link.to}
                className={"flex flex-col items-center gap-2 p-4 rounded-2xl transition-all " + bgClass}
              >
                {link.icon}
                <span className="text-xs font-bold">{link.label}</span>
                <span className="text-xs opacity-70">{link.desc}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* PENDING RESTAURANTS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Pending Approvals</h3>
              <Link to="/admin/restaurants" className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-600">
                View All
                <FiChevronRight className="text-xs" />
              </Link>
            </div>
            {pendingRestaurants.length === 0 ? (
              <div className="p-8 text-center">
                <FiCheckCircle className="text-3xl text-green-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">All caught up!</p>
              </div>
            ) : (
              pendingRestaurants.slice(0, 4).map((restaurant) => (
                <PendingRestaurantCard
                  key={restaurant.restaurantId}
                  restaurant={restaurant}
                  onApprove={handleApproveRestaurant}
                  onReject={handleRejectRestaurant}
                />
              ))
            )}
          </div>

          {/* RECENT ORDERS */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Recent Orders</h3>
              <Link to="/admin/orders" className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-600">
                View All
                <FiChevronRight className="text-xs" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">No orders yet.</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <RecentOrderRow key={order.orderId} order={order} />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;