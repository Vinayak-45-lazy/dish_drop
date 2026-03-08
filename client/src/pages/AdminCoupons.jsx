import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiTrash2, FiRefreshCw, FiTag,
  FiCalendar, FiPercent, FiDollarSign, FiUsers
} from "react-icons/fi";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  expiryDate: "",
  isActive: true,
};

const CouponForm = ({ onSave, onClose, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!form.code.trim()) { toast.error("Coupon code is required."); return; }
    if (!form.discountValue || isNaN(form.discountValue) || Number(form.discountValue) <= 0) {
      toast.error("Valid discount value required.");
      return;
    }
    if (!form.expiryDate) { toast.error("Expiry date is required."); return; }
    onSave(form);
  };

  const pctClass = form.discountType === "percentage"
    ? "flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  const flatClass = form.discountType === "flat"
    ? "flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  const activeClass = form.isActive
    ? "flex-1 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  const inactiveClass = !form.isActive
    ? "flex-1 py-2.5 bg-gray-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto z-10"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-black text-gray-900 text-lg">Create Coupon</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 font-bold text-lg">
            x
          </button>
        </div>

        <div className="p-5 space-y-4">

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Coupon Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="e.g. SAVE50"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button onClick={() => update("discountType", "percentage")} className={pctClass}>
                Percentage %
              </button>
              <button onClick={() => update("discountType", "flat")} className={flatClass}>
                Flat Rs.
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {form.discountType === "percentage" ? "Discount %" : "Discount Rs."}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => update("discountValue", e.target.value)}
                placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 50"}
                min="0"
                max={form.discountType === "percentage" ? "100" : undefined}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Min Order (Rs.)
              </label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => update("minOrderAmount", e.target.value)}
                placeholder="e.g. 200"
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
          </div>

          {form.discountType === "percentage" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Max Discount Rs. (Optional)
              </label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => update("maxDiscount", e.target.value)}
                placeholder="e.g. 100"
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Usage Limit
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => update("usageLimit", e.target.value)}
                placeholder="e.g. 100"
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => update("expiryDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              <button onClick={() => update("isActive", true)} className={activeClass}>
                Active
              </button>
              <button onClick={() => update("isActive", false)} className={inactiveClass}>
                Inactive
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiTag className="text-sm" />
            )}
            Create Coupon
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const CouponCard = ({ coupon, onDelete, onToggle }) => {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isActive = coupon.isActive !== false;
  const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
  const usageCount = coupon.usageCount || 0;
  const usageLimit = coupon.usageLimit || 0;
  const usagePct = usageLimit > 0 ? Math.min((usageCount / usageLimit) * 100, 100) : 0;
  const usagePctStr = usagePct + "%";

  const statusLabel = isExpired ? "Expired" : isActive ? "Active" : "Inactive";
  const statusClass = isExpired
    ? "bg-gray-100 text-gray-400"
    : isActive
    ? "bg-green-100 text-green-600"
    : "bg-yellow-100 text-yellow-600";

  const discountText = coupon.discountType === "percentage"
    ? coupon.discountValue + "% OFF"
    : "Rs." + coupon.discountValue + " OFF";

  const discountBg = coupon.discountType === "percentage"
    ? "bg-orange-500"
    : "bg-blue-500";

  const expiryText = coupon.expiryDate
    ? new Date(coupon.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "No expiry";

  const usageBarColor = usagePct >= 90 ? "bg-red-500" : usagePct >= 60 ? "bg-yellow-400" : "bg-green-500";
  const toggleBtnClass = isActive
    ? "px-3 py-1.5 bg-yellow-50 text-yellow-600 text-xs font-semibold rounded-xl hover:bg-yellow-100 disabled:opacity-50 transition-colors"
    : "px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors";
  const toggleBtnLabel = isActive ? "Deactivate" : "Activate";

  const handleDelete = async () => {
    if (!window.confirm("Delete coupon " + coupon.code + "?")) return;
    try {
      setDeleting(true);
      await onDelete(coupon.couponId);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      await onToggle(coupon.couponId, !isActive);
    } finally {
      setToggling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={"bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all " +
        (isExpired ? "border-gray-200 opacity-70" : "border-gray-100")}
    >
      <div className="p-4">

        <div className="flex items-start gap-3 mb-3">
          <div className={"w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 " + discountBg}>
            <div className="text-center">
              <FiTag className="text-white text-sm mx-auto" />
              <p className="text-white text-xs font-black mt-0.5 leading-none">
                {coupon.discountType === "percentage" ? coupon.discountValue + "%" : "Rs." + coupon.discountValue}
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-black text-gray-900 text-lg font-mono tracking-wider">
                {coupon.code}
              </h3>
              <span className={"text-xs font-bold px-2.5 py-1 rounded-full " + statusClass}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm font-bold text-orange-500">{discountText}</p>
            {coupon.minOrderAmount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {"Min order: Rs." + coupon.minOrderAmount}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <FiUsers className="text-gray-400 text-sm mx-auto mb-0.5" />
            <p className="text-sm font-black text-gray-900">{usageCount}</p>
            <p className="text-xs text-gray-400">Used</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <FiPercent className="text-gray-400 text-sm mx-auto mb-0.5" />
            <p className="text-sm font-black text-gray-900">{usageLimit || "∞"}</p>
            <p className="text-xs text-gray-400">Limit</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <FiCalendar className="text-gray-400 text-sm mx-auto mb-0.5" />
            <p className="text-xs font-black text-gray-900">{expiryText}</p>
            <p className="text-xs text-gray-400">Expires</p>
          </div>
        </div>

        {usageLimit > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Usage</span>
              <span>{usageCount + "/" + usageLimit}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: usagePctStr }}
                transition={{ duration: 0.6 }}
                className={"h-1.5 rounded-full " + usageBarColor}
              />
            </div>
          </div>
        )}

        {coupon.maxDiscount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <FiDollarSign className="text-gray-400 text-xs" />
            <p className="text-xs text-gray-500">
              {"Max discount: Rs." + coupon.maxDiscount}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isExpired && (
            <button onClick={handleToggle} disabled={toggling} className={toggleBtnClass}>
              {toggling ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block mr-1" />
              ) : null}
              {toggleBtnLabel}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {deleting ? (
              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiTrash2 className="text-xs" />
            )}
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const FILTERS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "expired", label: "Expired" },
  ];

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCoupons();
      setCoupons(res.data.data || []);
    } catch (err) {
      console.error("Fetch coupons error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (form) => {
    try {
      setFormLoading(true);
      await adminAPI.createCoupon(form);
      toast.success("Coupon created!");
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error("Failed to create coupon.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (couponId) => {
    try {
      await adminAPI.deleteCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.couponId !== couponId));
      toast.success("Coupon deleted.");
    } catch (err) {
      toast.error("Failed to delete coupon.");
    }
  };

  const handleToggle = async (couponId, newStatus) => {
    try {
      await adminAPI.toggleCoupon(couponId, newStatus);
      setCoupons((prev) =>
        prev.map((c) => c.couponId === couponId ? { ...c, isActive: newStatus } : c)
      );
      toast.success(newStatus ? "Coupon activated." : "Coupon deactivated.");
    } catch (err) {
      toast.error("Failed to update coupon.");
    }
  };

  const isExpired = (coupon) => coupon.expiryDate && new Date(coupon.expiryDate) < new Date();

  const filteredCoupons = coupons.filter((c) => {
    if (filter === "all") return true;
    if (filter === "expired") return isExpired(c);
    if (filter === "active") return c.isActive !== false && !isExpired(c);
    if (filter === "inactive") return c.isActive === false && !isExpired(c);
    return true;
  });

  const counts = {
    all: coupons.length,
    active: coupons.filter((c) => c.isActive !== false && !isExpired(c)).length,
    inactive: coupons.filter((c) => c.isActive === false && !isExpired(c)).length,
    expired: coupons.filter((c) => isExpired(c)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {coupons.length + " total • " + counts.active + " active"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchCoupons} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-200 text-sm"
            >
              <FiPlus />
              New Coupon
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {FILTERS.map((f) => {
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FiTag className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-4">No coupons found.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors"
            >
              Create First Coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.couponId}
                  coupon={coupon}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <CouponForm
            onSave={handleCreate}
            onClose={() => setShowForm(false)}
            loading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;