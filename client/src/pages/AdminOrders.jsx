import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiChevronDown,
  FiChevronUp, FiMapPin, FiCalendar, FiX
} from "react-icons/fi";
import { MdRestaurant, MdDeliveryDining } from "react-icons/md";
import { adminAPI } from "../services/api";
import { SkeletonOrderCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

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

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "readyForPickup", label: "Ready" },
  { value: "pickedUp", label: "On the Way" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const OrderCard = ({ order, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const statusColor = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const canCancel = order.status !== "delivered" && order.status !== "cancelled";
  const items = order.items || [];
  const total = order.totalAmount ? order.totalAmount.toFixed(0) : "0";
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "";
  const addr = order.deliveryAddress || {};
  const addrLine = (addr.addressLine || "") + (addr.city ? ", " + addr.city : "");

  const formatDateTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleCancel = async () => {
    if (!window.confirm("Force cancel this order?")) return;
    try {
      setCancelling(true);
      await onCancel(order.orderId);
    } finally {
      setCancelling(false);
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

        {/* HEADER */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-gray-900 text-base">{"#" + shortId}</p>
              <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + statusColor}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
          </div>
          <p className="font-black text-gray-900 text-base">{"Rs." + total}</p>
        </div>

        {/* RESTAURANT + CUSTOMER */}
        <div className="flex items-center gap-4 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MdRestaurant className="text-orange-400 text-sm" />
            <p className="text-xs text-gray-600 font-medium">{order.restaurantName}</p>
          </div>
          {order.customerName && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-500 text-xs font-black">
                  {order.customerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500">{order.customerName}</p>
            </div>
          )}
        </div>

        {/* ADDRESS */}
        <div className="flex items-center gap-1.5 mb-3">
          <FiMapPin className="text-gray-300 text-xs flex-shrink-0" />
          <p className="text-xs text-gray-400 line-clamp-1">{addrLine}</p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {cancelling ? (
                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiX className="text-xs" />
              )}
              Force Cancel
            </button>
          )}
          {order.agentName && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 rounded-xl">
              <MdDeliveryDining className="text-indigo-400 text-sm" />
              <span className="text-xs text-indigo-600 font-medium">{order.agentName}</span>
            </div>
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

              {/* Items */}
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

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Order ID", value: order.orderId ? order.orderId.slice(-10) : "" },
                  { label: "Payment", value: order.paymentStatus || "paid" },
                  { label: "Customer", value: order.customerName || "N/A" },
                  { label: "Agent", value: order.agentName || "Not assigned" },
                ].map((info) => (
                  <div key={info.label} className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-xs text-gray-400">{info.label}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-400 mb-1">Delivery Address</p>
                <p className="text-xs text-gray-600">
                  {(addr.addressLine || "") + ", " + (addr.city || "") + " - " + (addr.pincode || "")}
                </p>
              </div>

              {/* Special Instructions */}
              {order.specialInstructions && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                  <p className="text-xs text-yellow-700">{"Note: " + order.specialInstructions}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {order.status === "cancelled" && order.cancellationReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-600">{"Cancelled: " + order.cancellationReason}</p>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const DATE_FILTERS = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllOrders();
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Fetch orders error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await adminAPI.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => o.orderId === orderId ? { ...o, status: "cancelled" } : o)
      );
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error("Failed to cancel order.");
    }
  };

  const isInDateRange = (ts) => {
    if (dateFilter === "all") return true;
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    if (dateFilter === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return d >= monthAgo;
    }
    return true;
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchDate = isInDateRange(o.createdAt);
    const matchSearch = !search ||
      (o.orderId && o.orderId.toLowerCase().includes(search.toLowerCase())) ||
      (o.restaurantName && o.restaurantName.toLowerCase().includes(search.toLowerCase())) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchDate && matchSearch;
  });

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const counts = {};
  STATUS_FILTERS.forEach((f) => {
    counts[f.value] = f.value === "all"
      ? orders.length
      : orders.filter((o) => o.status === f.value).length;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">All Orders</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {orders.length + " orders • Rs." + totalRevenue.toFixed(0) + " revenue"}
            </p>
          </div>
          <button onClick={fetchOrders} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: orders.length, color: "text-gray-900" },
            { label: "Delivered", value: counts.delivered || 0, color: "text-green-600" },
            { label: "Active", value: (counts.placed || 0) + (counts.confirmed || 0) + (counts.preparing || 0), color: "text-orange-500" },
            { label: "Cancelled", value: counts.cancelled || 0, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className={"text-xl font-black " + s.color}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, restaurant or customer..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
          />
        </div>

        {/* DATE FILTER */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {DATE_FILTERS.map((f) => {
            const isActive = dateFilter === f.value;
            const cls = "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all " +
              (isActive ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200");
            return (
              <button key={f.value} onClick={() => setDateFilter(f.value)} className={cls}>
                <FiCalendar className="text-xs" />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* STATUS FILTER TABS */}
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

        {/* ORDERS LIST */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonOrderCard key={i} />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MdRestaurant className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onCancel={handleCancel}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminOrders;