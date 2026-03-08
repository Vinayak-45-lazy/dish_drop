import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiShoppingBag, FiDollarSign, FiStar, FiClock,
  FiTrendingUp, FiAlertCircle, FiToggleLeft,
  FiToggleRight, FiChevronRight, FiRefreshCw
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { restaurantAPI, orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const StatCard = ({ icon, label, value, sub, color, delay }) => {
  const bgClass = color === "orange" ? "bg-orange-50"
    : color === "green" ? "bg-green-50"
    : color === "blue" ? "bg-blue-50"
    : "bg-purple-50";

  const iconClass = color === "orange" ? "text-orange-500"
    : color === "green" ? "text-green-500"
    : color === "blue" ? "text-blue-500"
    : "text-purple-500";

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
          <span className="text-xs text-green-500 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
};

const OrderRow = ({ order }) => {
  const statusColors = {
    placed: "bg-blue-100 text-blue-600",
    confirmed: "bg-purple-100 text-purple-600",
    preparing: "bg-yellow-100 text-yellow-600",
    readyForPickup: "bg-orange-100 text-orange-600",
    pickedUp: "bg-indigo-100 text-indigo-600",
    delivered: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-500",
  };
  const statusLabels = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    readyForPickup: "Ready",
    pickedUp: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const statusColor = statusColors[order.status] || "bg-gray-100 text-gray-500";
  const statusLabel = statusLabels[order.status] || order.status;

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const items = order.items || [];
  const itemText = items.slice(0, 2).map((i) => i.name).join(", ") + (items.length > 2 ? " +" + (items.length - 2) + " more" : "");

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-gray-900 text-sm">
            {"#" + (order.orderId ? order.orderId.slice(-6).toUpperCase() : "")}
          </p>
          <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + statusColor}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-gray-400 line-clamp-1">{itemText}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          {"Rs." + (order.totalAmount ? order.totalAmount.toFixed(0) : "0")}
        </p>
        <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
      </div>
    </div>
  );
};

const RestaurantOwnerDashboard = () => {
  const { userProfile } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restaurantRes, ordersRes] = await Promise.all([
        restaurantAPI.getMyRestaurant(),
        orderAPI.getOwnerOrders({ limit: 5 }),
      ]);
      setRestaurant(restaurantRes.data.data);
      setRecentOrders(ordersRes.data.data || []);

      const orderData = ordersRes.data.data || [];
      const totalRevenue = orderData.filter((o) => o.status === "delivered").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const todayOrders = orderData.filter((o) => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return date.toDateString() === new Date().toDateString();
      });

      setStats({
        totalOrders: restaurantRes.data.data?.totalOrders || 0,
        todayOrders: todayOrders.length,
        totalRevenue: totalRevenue,
        avgRating: restaurantRes.data.data?.avgRating || 0,
      });
    } catch (err) {
      console.error("Dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOpen = async () => {
    if (!restaurant) return;
    try {
      setTogglingStatus(true);
      const newStatus = !restaurant.isOpen;
      await restaurantAPI.updateStatus({ isOpen: newStatus });
      setRestaurant((prev) => ({ ...prev, isOpen: newStatus }));
      toast.success(newStatus ? "Restaurant is now Open!" : "Restaurant is now Closed.");
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Restaurant Found</h2>
          <p className="text-gray-400 text-sm">Your restaurant profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  const isApproved = restaurant.isApproved;
  const isOpen = restaurant.isOpen;
  const rating = restaurant.avgRating ? restaurant.avgRating.toFixed(1) : "New";
  const totalOrders = stats ? stats.totalOrders : 0;
  const todayOrders = stats ? stats.todayOrders : 0;
  const totalRevenue = stats ? stats.totalRevenue.toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {restaurant.cuisineTypes ? restaurant.cuisineTypes.join(" • ") : ""}
            </p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className="text-gray-400 text-sm" />
          </button>
        </div>

        {/* APPROVAL WARNING */}
        {!isApproved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3"
          >
            <FiAlertCircle className="text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-yellow-800 text-sm">Pending Approval</p>
              <p className="text-yellow-600 text-xs mt-0.5">
                Your restaurant is under review. You will be notified once approved.
              </p>
            </div>
          </motion.div>
        )}

        {/* OPEN/CLOSE TOGGLE */}
        {isApproved && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Restaurant Status</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isOpen ? "Accepting orders right now" : "Not accepting orders"}
              </p>
            </div>
            <button
              onClick={handleToggleOpen}
              disabled={togglingStatus}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: isOpen ? "#dcfce7" : "#fee2e2",
                color: isOpen ? "#16a34a" : "#dc2626",
              }}
            >
              {togglingStatus ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isOpen ? (
                <FiToggleRight className="text-xl" />
              ) : (
                <FiToggleLeft className="text-xl" />
              )}
              {isOpen ? "Open" : "Closed"}
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FiShoppingBag className="text-lg" />}
            label="Total Orders"
            value={totalOrders}
            color="orange"
            delay={0}
          />
          <StatCard
            icon={<FiClock className="text-lg" />}
            label="Today's Orders"
            value={todayOrders}
            color="blue"
            delay={0.1}
          />
          <StatCard
            icon={<FiDollarSign className="text-lg" />}
            label="Revenue"
            value={"Rs." + totalRevenue}
            color="green"
            delay={0.2}
          />
          <StatCard
            icon={<FiStar className="text-lg" />}
            label="Avg Rating"
            value={rating}
            color="purple"
            delay={0.3}
          />
        </div>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Manage Menu", to: "/owner/menu", icon: <MdDeliveryDining className="text-xl" />, color: "orange" },
            { label: "View Orders", to: "/owner/orders", icon: <FiShoppingBag className="text-xl" />, color: "blue" },
            { label: "Analytics", to: "/owner/analytics", icon: <FiTrendingUp className="text-xl" />, color: "green" },
            { label: "Profile", to: "/profile", icon: <FiStar className="text-xl" />, color: "purple" },
          ].map((link) => {
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
              </Link>
            );
          })}
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Recent Orders</h3>
            <Link to="/owner/orders" className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              View All
              <FiChevronRight className="text-xs" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No orders yet today.</p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => (
                <OrderRow key={order.orderId} order={order} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RestaurantOwnerDashboard;