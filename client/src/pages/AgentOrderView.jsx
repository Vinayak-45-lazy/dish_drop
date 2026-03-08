import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone, FiMapPin, FiRefreshCw,
  FiCheck, FiChevronDown, FiChevronUp,
  FiClock, FiPackage
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { orderAPI, agentAPI } from "../services/api";
import MapView from "../components/MapView";
import { SkeletonOrderCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  confirmed: "bg-purple-100 text-purple-600",
  preparing: "bg-yellow-100 text-yellow-600",
  readyForPickup: "bg-orange-100 text-orange-600",
  pickedUp: "bg-indigo-100 text-indigo-600",
  delivered: "bg-green-100 text-green-600",
  cancelled: "bg-red-100 text-red-500",
};

const STATUS_LABELS = {
  confirmed: "Confirmed",
  preparing: "Preparing",
  readyForPickup: "Ready for Pickup",
  pickedUp: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const NEXT_STATUS = {
  readyForPickup: { value: "pickedUp", label: "Mark Picked Up" },
  pickedUp: { value: "delivered", label: "Mark Delivered" },
};

const OrderMapWrapper = ({ order }) => {
  const addr = order.deliveryAddress || {};
  const rLat = order.restaurantLat || null;
  const rLng = order.restaurantLng || null;
  const rName = order.restaurantName || "";
  const cLat = addr.lat || null;
  const cLng = addr.lng || null;
  return (
    <MapView
      restaurantLat={rLat}
      restaurantLng={rLng}
      restaurantName={rName}
      customerLat={cLat}
      customerLng={cLng}
      height="220px"
    />
  );
};

const AgentOrderCard = ({ order, onStatusUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const nextAction = NEXT_STATUS[order.status] || null;
  const isActive = order.status === "readyForPickup" || order.status === "pickedUp";
  const isDelivered = order.status === "delivered";

  const items = order.items || [];
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
  const addr = order.deliveryAddress || {};
  const addrLine = (addr.addressLine || "") + (addr.city ? ", " + addr.city : "");
  const restaurantPhone = order.restaurantPhone || "";
  const customerPhone = order.customerPhone || "";
  const telRestaurant = "tel:" + restaurantPhone;
  const telCustomer = "tel:" + customerPhone;
  const earnings = order.agentEarnings ? "Rs." + order.agentEarnings : "";

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const handleStatusUpdate = async () => {
    if (!nextAction) return;
    try {
      setUpdating(true);
      await agentAPI.updateOrderStatus(order.orderId, nextAction.value);
      onStatusUpdate(order.orderId, nextAction.value);
      toast.success("Status updated to " + nextAction.label.replace("Mark ", ""));
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const cardBorderClass = isActive
    ? "bg-white rounded-2xl border-2 border-orange-300 overflow-hidden shadow-md shadow-orange-100"
    : "bg-white rounded-2xl border border-gray-100 overflow-hidden";

  const advanceBtnClass = "flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cardBorderClass}
    >
      {/* ACTIVE BADGE */}
      {isActive && (
        <div className="bg-orange-500 px-4 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold">Active Delivery</span>
        </div>
      )}

      <div className="p-4">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-gray-900 text-base">{"#" + shortId}</p>
              <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + statusColor}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900">{"Rs." + total}</p>
            {earnings && (
              <p className="text-xs text-green-600 font-bold">{"Earn " + earnings}</p>
            )}
          </div>
        </div>

        {/* RESTAURANT */}
        <div className="flex items-center gap-2 mb-2">
          <MdDeliveryDining className="text-orange-400 text-base flex-shrink-0" />
          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{order.restaurantName}</p>
        </div>

        {/* DELIVERY ADDRESS */}
        <div className="flex items-start gap-2 mb-3">
          <FiMapPin className="text-green-400 text-sm flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">{addrLine}</p>
        </div>

        {/* ITEMS PREVIEW */}
        <p className="text-xs text-gray-400 mb-3 line-clamp-1">
          {items.map((i) => i.name + " x" + i.quantity).join(", ")}
        </p>

        {/* CALL BUTTONS */}
        <div className="flex gap-2 mb-3">
          {restaurantPhone && (
            <a href={telRestaurant} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors">
              <FiPhone className="text-xs" />
              Restaurant
            </a>
          )}
          {customerPhone && (
            <a href={telCustomer} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100 transition-colors">
              <FiPhone className="text-xs" />
              Customer
            </a>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {nextAction && (
            <button onClick={handleStatusUpdate} disabled={updating} className={advanceBtnClass}>
              {updating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="text-sm" />
              )}
              {nextAction.label}
            </button>
          )}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="ml-auto flex items-center gap-1 text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
          >
            {expanded ? "Less" : "More"}
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
            <div className="p-4 space-y-4">

              {/* MAP */}
              {isActive && (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <OrderMapWrapper order={order} />
                </div>
              )}

              {/* ALL ITEMS */}
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name + " x" + item.quantity}</span>
                    <span className="font-medium text-gray-800">
                      {"Rs." + (item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-orange-500">{"Rs." + total}</span>
                </div>
              </div>

              {/* FULL ADDRESS */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 mb-1">Delivery Address</p>
                <p className="text-xs text-gray-600">{addr.label || "Home"}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(addr.addressLine || "") + ", " + (addr.city || "") + " - " + (addr.pincode || "")}
                </p>
              </div>

              {/* SPECIAL INSTRUCTIONS */}
              {order.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <p className="text-xs text-yellow-700">
                    {"Note: " + order.specialInstructions}
                  </p>
                </div>
              )}

              {/* EARNINGS */}
              {isDelivered && earnings && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-500 font-medium">You earned</p>
                  <p className="text-xl font-black text-green-600">{earnings}</p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AgentOrderView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  const FILTERS = [
    { value: "active", label: "Active" },
    { value: "delivered", label: "Delivered" },
    { value: "all", label: "All" },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAgentOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Fetch agent orders error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => o.orderId === orderId ? { ...o, status: newStatus } : o)
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") {
      return o.status === "confirmed" ||
        o.status === "preparing" ||
        o.status === "readyForPickup" ||
        o.status === "pickedUp";
    }
    if (filter === "delivered") return o.status === "delivered";
    return true;
  });

  const activeCount = orders.filter((o) =>
    o.status === "readyForPickup" || o.status === "pickedUp"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {activeCount > 0 ? activeCount + " active" : "No active deliveries"}
            </p>
          </div>
          <button onClick={fetchOrders} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
          </button>
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 mb-5">
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            const cls = "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all " +
              (isActive ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200");
            return (
              <button key={f.value} onClick={() => setFilter(f.value)} className={cls}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ORDERS */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonOrderCard key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MdDeliveryDining className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === "active" ? "No active deliveries right now." : "No orders found."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <AgentOrderCard
                  key={order.orderId}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};

export default AgentOrderView;