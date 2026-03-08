import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiToggleLeft, FiToggleRight, FiMapPin,
  FiPhone, FiRefreshCw, FiTrendingUp,
  FiPackage, FiClock, FiStar, FiAlertCircle
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { agentAPI, orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const StatCard = ({ icon, label, value, color, delay }) => {
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
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className={"w-10 h-10 rounded-xl flex items-center justify-center mb-3 " + bgClass}>
        <span className={iconClass}>{icon}</span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
};

const ActiveOrderCard = ({ order }) => {
  const items = order.items || [];
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";
  const addr = order.deliveryAddress || {};
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
  const addrText = (addr.addressLine || "") + (addr.city ? ", " + addr.city : "");
  const restaurantPhone = order.restaurantPhone || "";
  const customerPhone = order.customerPhone || "";
  const telRestaurant = "tel:" + restaurantPhone;
  const telCustomer = "tel:" + customerPhone;

  const statusColors = {
    confirmed: "bg-purple-100 text-purple-600",
    preparing: "bg-yellow-100 text-yellow-600",
    readyForPickup: "bg-orange-100 text-orange-600",
    pickedUp: "bg-indigo-100 text-indigo-600",
  };
  const statusColor = statusColors[order.status] || "bg-gray-100 text-gray-500";

  const statusLabels = {
    confirmed: "Confirmed",
    preparing: "Preparing",
    readyForPickup: "Ready for Pickup",
    pickedUp: "Picked Up",
  };
  const statusLabel = statusLabels[order.status] || order.status;

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-200 p-4 shadow-md shadow-orange-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-black text-gray-900 text-lg">{"#" + shortId}</p>
            <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + statusColor}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-500">{order.restaurantName}</p>
        </div>
        <p className="font-black text-orange-500 text-xl">{"Rs." + total}</p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <MdDeliveryDining className="text-orange-400 text-base flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            {"Pickup: " + (order.restaurantAddress || order.restaurantName)}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <FiMapPin className="text-green-400 text-sm flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">{"Deliver to: " + addrText}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
        {items.slice(0, 3).map((item, i) => (
          <span key={i} className="bg-gray-100 px-2 py-1 rounded-lg">
            {item.name}
          </span>
        ))}
        {items.length > 3 && (
          <span className="text-gray-400">{"+" + (items.length - 3) + " more"}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {restaurantPhone && (
          <a href={telRestaurant} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl text-xs hover:bg-blue-100 transition-colors">
            <FiPhone className="text-xs" />
            Restaurant
          </a>
        )}
        {customerPhone && (
          <a href={telCustomer} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 text-green-600 font-semibold rounded-xl text-xs hover:bg-green-100 transition-colors">
            <FiPhone className="text-xs" />
            Customer
          </a>
        )}
        <Link
          to="/agent/orders"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition-colors"
        >
          <FiMapPin className="text-xs" />
          View Details
        </Link>
      </div>
    </div>
  );
};

const DeliveryAgentDashboard = () => {
  const { userProfile } = useAuth();
  const [agentData, setAgentData] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const locationRef = useRef(null);

  useEffect(() => {
    fetchData();
    startLocationUpdates();
    return () => {
      if (locationRef.current) clearInterval(locationRef.current);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agentRes, ordersRes] = await Promise.all([
        agentAPI.getProfile(),
        orderAPI.getAgentOrders(),
      ]);
      const agent = agentRes.data.data;
      const orders = ordersRes.data.data || [];
      setAgentData(agent);
      setIsAvailable(agent.isAvailable || false);

      const active = orders.find((o) =>
        o.status === "confirmed" ||
        o.status === "preparing" ||
        o.status === "readyForPickup" ||
        o.status === "pickedUp"
      );
      setActiveOrder(active || null);

      const delivered = orders.filter((o) => o.status === "delivered");
      const today = delivered.filter((o) => {
        const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return d.toDateString() === new Date().toDateString();
      });
      const totalEarnings = delivered.reduce((sum, o) => sum + (o.agentEarnings || 0), 0);

      setStats({
        totalDeliveries: delivered.length,
        todayDeliveries: today.length,
        totalEarnings,
        avgRating: agent.avgRating || 0,
        onTimeRate: agent.onTimeRate || 0,
      });

      setRecentDeliveries(delivered.slice(0, 3));
    } catch (err) {
      console.error("Agent dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const startLocationUpdates = () => {
    if (!navigator.geolocation) return;
    locationRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await agentAPI.updateLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } catch (err) {}
        },
        () => {}
      );
    }, 15000);
  };

  const handleToggleAvailability = async () => {
    try {
      setTogglingAvail(true);
      const newVal = !isAvailable;
      await agentAPI.updateAvailability({ isAvailable: newVal });
      setIsAvailable(newVal);
      toast.success(newVal ? "You are now available!" : "You are now offline.");
    } catch (err) {
      toast.error("Failed to update availability.");
    } finally {
      setTogglingAvail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const isFlagged = agentData && agentData.isFlagged;
  const name = userProfile ? userProfile.name || "" : "";
  const firstName = name.split(" ")[0];
  const vehicleType = agentData ? (agentData.vehicleType || "bike") : "bike";
  const vehicleNumber = agentData ? (agentData.vehicleNumber || "") : "";
  const avgRating = stats ? (stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New") : "New";
  const totalEarnings = stats ? stats.totalEarnings.toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {firstName ? "Hey, " + firstName + "!" : "Dashboard"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MdDeliveryDining className="text-orange-400" />
              <span className="text-sm text-gray-400 capitalize">{vehicleType}</span>
              {vehicleNumber && (
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                  {vehicleNumber}
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className="text-gray-400 text-sm" />
          </button>
        </div>

        {/* FLAGGED WARNING */}
        {isFlagged && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-start gap-3"
          >
            <FiAlertCircle className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Account Flagged</p>
              <p className="text-red-600 text-xs mt-0.5">
                Your account has been flagged. Please contact support.
              </p>
            </div>
          </motion.div>
        )}

        {/* AVAILABILITY TOGGLE */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 text-sm">Availability</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAvailable ? "Accepting delivery requests" : "Not accepting requests"}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={togglingAvail || isFlagged}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{
              background: isAvailable ? "#dcfce7" : "#fee2e2",
              color: isAvailable ? "#16a34a" : "#dc2626",
            }}
          >
            {togglingAvail ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isAvailable ? (
              <FiToggleRight className="text-xl" />
            ) : (
              <FiToggleLeft className="text-xl" />
            )}
            {isAvailable ? "Online" : "Offline"}
          </button>
        </div>

        {/* ACTIVE ORDER */}
        {activeOrder && (
          <div className="mb-5">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
              Active Order
            </p>
            <ActiveOrderCard order={activeOrder} />
          </div>
        )}

        {/* NO ACTIVE ORDER */}
        {!activeOrder && isAvailable && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center mb-5">
            <MdDeliveryDining className="text-4xl text-orange-300 mx-auto mb-2" />
            <p className="font-bold text-orange-700 text-sm">Waiting for orders</p>
            <p className="text-orange-500 text-xs mt-0.5">
              You will be notified when a new order is assigned.
            </p>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <StatCard
            icon={<FiPackage className="text-lg" />}
            label="Total Deliveries"
            value={stats ? stats.totalDeliveries : 0}
            color="orange"
            delay={0}
          />
          <StatCard
            icon={<FiClock className="text-lg" />}
            label="Today"
            value={stats ? stats.todayDeliveries : 0}
            color="blue"
            delay={0.1}
          />
          <StatCard
            icon={<FiTrendingUp className="text-lg" />}
            label="Earnings"
            value={"Rs." + totalEarnings}
            color="green"
            delay={0.2}
          />
          <StatCard
            icon={<FiStar className="text-lg" />}
            label="Avg Rating"
            value={avgRating}
            color="purple"
            delay={0.3}
          />
        </div>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            to="/agent/orders"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <FiPackage className="text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">My Orders</p>
              <p className="text-xs text-gray-400">View all orders</p>
            </div>
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiStar className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">My Profile</p>
              <p className="text-xs text-gray-400">View ratings</p>
            </div>
          </Link>
        </div>

        {/* RECENT DELIVERIES */}
        {recentDeliveries.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Recent Deliveries</h3>
            </div>
            {recentDeliveries.map((order) => {
              const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
              const earnings = order.agentEarnings ? "Rs." + order.agentEarnings : "Rs.0";
              return (
                <div key={order.orderId} className="flex items-center gap-3 p-4 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MdDeliveryDining className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{"#" + shortId}</p>
                    <p className="text-xs text-gray-400">{order.restaurantName}</p>
                  </div>
                  <p className="font-bold text-green-600 text-sm">{earnings}</p>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default DeliveryAgentDashboard;