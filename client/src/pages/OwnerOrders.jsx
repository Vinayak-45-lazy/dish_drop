import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiRefreshCw, FiChevronDown, FiChevronUp,
  FiClock, FiCheck, FiX, FiMapPin
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { orderAPI } from "../services/api";
import { SkeletonOrderCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const STATUS_FLOW = [
  { value: "placed", label: "Placed", next: "confirmed" },
  { value: "confirmed", label: "Confirmed", next: "preparing" },
  { value: "preparing", label: "Preparing", next: "readyForPickup" },
  { value: "readyForPickup", label: "Ready for Pickup", next: null },
  { value: "delivered", label: "Delivered", next: null },
  { value: "cancelled", label: "Cancelled", next: null },
];

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
  placed: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  readyForPickup: "Ready",
  pickedUp: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "placed", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "readyForPickup", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const OrderCard = ({ order, onStatusUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const statusColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusFlow = STATUS_FLOW.find((s) => s.value === order.status);
  const nextStatus = statusFlow ? statusFlow.next : null;
  const nextFlow = nextStatus ? STATUS_FLOW.find((s) => s.value === nextStatus) : null;
  const nextLabel = nextFlow ? nextFlow.label : "";
  const isTerminal = order.status === "delivered" || order.status === "cancelled";
  const canCancel = order.status === "placed" || order.status === "confirmed";

  const items = order.items || [];
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
  const addr = order.deliveryAddress || {};

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleAdvance = async () => {
    if (!nextStatus) return;
    try {
      setUpdating(true);
      await orderAPI.updateStatus(order.orderId, nextStatus);
      onStatusUpdate(order.orderId, nextStatus);
      toast.success("Order status updated to " + nextLabel);
    } catch (err) {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      setUpdating(true);
      await orderAPI.updateStatus(order.orderId, "cancelled");
      onStatusUpdate(order.orderId, "cancelled");
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error("Failed to cancel order.");
    } finally {
      setUpdating(false);
    }
  };

  const advanceBtnClass = "flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors";
  const cancelBtnClass = "flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
    >
      {/* CARD HEADER */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-gray-900 text-base">{"#" + shortId}</p>
              <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + statusColor}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {formatDate(order.createdAt) + " at " + formatTime(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900 text-base">{"Rs." + total}</p>
            <p className="text-xs text-gray-400">{items.length + " items"}</p>
          </div>
        </div>

        {/* Items Preview */}
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          {items.map((i) => i.name + " x" + i.quantity).join(", ")}
        </p>

        {/* Customer + Address */}
        <div className="flex items-center gap-2 mb-3">
          <FiMapPin className="text-orange-400 text-xs flex-shrink-0" />
          <p className="text-xs text-gray-400 line-clamp-1">
            {(addr.addressLine || "") + (addr.city ? ", " + addr.city : "")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isTerminal && nextStatus && (
            <button onClick={handleAdvance} disabled={updating} className={advanceBtnClass}>
              {updating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="text-xs" />
              )}
              {nextLabel ? "Mark as " + nextLabel : "Advance"}
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={updating} className={cancelBtnClass}>
              <FiX className="text-xs" />
              Cancel
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

      {/* EXPANDED DETAILS */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-50"
          >
            <div className="p-4 space-y-3">

              {/* All Items */}
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name + " x" + item.quantity}</span>
                    <span className="font-medium text-gray-800">
                      {"Rs." + (item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill */}
              <div className="border-t border-dashed border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>{"Rs." + (order.subtotal ? order.subtotal.toFixed(0) : "0")}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Delivery Fee</span>
                  <span>{order.deliveryFee === 0 ? "FREE" : "Rs." + order.deliveryFee}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>{"Discount (" + (order.couponCode || "") + ")"}</span>
                    <span>{"- Rs." + order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-orange-500">{"Rs." + total}</span>
                </div>
              </div>

              {/* Delivery Address Full */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                <FiMapPin className="text-orange-400 text-sm flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-700">{addr.label || "Home"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(addr.addressLine || "") + ", " + (addr.city || "") + " - " + (addr.pincode || "")}
                  </p>
                </div>
              </div>

              {/* Agent Info */}
              {order.agentName && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                  <MdDeliveryDining className="text-blue-500 text-base flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-700">{order.agentName}</p>
                    <p className="text-xs text-blue-500">{order.agentVehicleType || "Delivery Agent"}</p>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <p className="text-xs text-yellow-700">
                    {"Note: " + order.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const OwnerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getOwnerOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Fetch orders error:", err.message);
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
    if (filter === "all") return true;
    return o.status === filter;
  });

  const newOrdersCount = orders.filter((o) => o.status === "placed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {orders.length + " total"}
              {newOrdersCount > 0 ? " • " + newOrdersCount + " new" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all " +
                (autoRefresh ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-500")}
            >
              <span className={autoRefresh ? "w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" : "w-1.5 h-1.5 bg-gray-400 rounded-full"} />
              {autoRefresh ? "Live" : "Paused"}
            </button>
            <button
              onClick={fetchOrders}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
            </button>
          </div>
        </div>

        {/* NEW ORDERS ALERT */}
        {newOrdersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiClock className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">
                {newOrdersCount + " new order" + (newOrdersCount > 1 ? "s" : "") + " waiting!"}
              </p>
              <p className="text-orange-600 text-xs">Confirm them to start preparing.</p>
            </div>
            <button
              onClick={() => setFilter("placed")}
              className="text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors"
            >
              View
            </button>
          </motion.div>
        )}

        {/* FILTER TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            const count = f.value === "all" ? orders.length : orders.filter((o) => o.status === f.value).length;
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

        {/* ORDERS LIST */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonOrderCard key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FiClock className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === "all" ? "No orders yet." : "No " + filter + " orders."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <OrderCard
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

export default OwnerOrders;