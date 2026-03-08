import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch, FiRefreshCw, FiFlag, FiChevronDown,
  FiChevronUp, FiStar, FiPackage, FiAlertCircle,
  FiCheckCircle, FiPhone
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { adminAPI } from "../services/api";
import { SkeletonCard } from "../components/LoadingSpinner";
import toast from "react-hot-toast";
const CallButton = ({ telHref }) => {
  const cls = "flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-500 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors";
  return (
    <a href={telHref} className={cls}>
      <FiPhone className="text-xs" />
      Call
    </a>
  );
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Offline" },
  { value: "flagged", label: "Flagged" },
];

const AgentCard = ({ agent, onFlag, onUnflag }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFlagged = agent.isFlagged === true;
  const isAvailable = agent.isAvailable === true;
  const avgRating = agent.avgRating > 0 ? agent.avgRating.toFixed(1) : "New";
  const totalDeliveries = agent.totalDeliveries || 0;
  const flagScore = agent.flagScore || 0;
  const lateCount = agent.lateDeliveries || 0;
  const phone = agent.phone || "";
  const telHref = "tel:" + phone;
  const vehicleText = (agent.vehicleType || "bike") + (agent.vehicleNumber ? " - " + agent.vehicleNumber : "");
  const initial = agent.name ? agent.name.charAt(0).toUpperCase() : "A";

  const availClass = isAvailable
    ? "bg-green-100 text-green-600"
    : "bg-gray-100 text-gray-400";
  const availLabel = isAvailable ? "Available" : "Offline";

  const flagClass = isFlagged
    ? "bg-red-100 text-red-500"
    : "bg-gray-100 text-gray-400";

  const ratingColor = agent.avgRating >= 4.5 ? "text-green-500"
    : agent.avgRating >= 3.5 ? "text-yellow-500"
    : "text-red-400";

  const flagBarColor = flagScore >= 50 ? "bg-red-500"
    : flagScore >= 30 ? "bg-yellow-400"
    : "bg-green-500";

  const flagBarWidth = Math.min(flagScore, 100) + "%";

  const handleFlag = async () => {
    try {
      setLoading(true);
      await onFlag(agent.userId);
    } finally {
      setLoading(false);
    }
  };

  const handleUnflag = async () => {
    try {
      setLoading(true);
      await onUnflag(agent.userId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={"bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all " +
        (isFlagged ? "border-red-200" : "border-gray-100")}
    >
      <div className="p-4">

        {/* HEADER */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 font-black text-lg">{initial}</span>
            </div>
            <span className={"absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white " +
              (isAvailable ? "bg-green-500" : "bg-gray-300")} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{agent.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{agent.email}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + availClass}>
                  {availLabel}
                </span>
                {isFlagged && (
                  <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + flagClass}>
                    Flagged
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-center gap-1.5 mt-1">
              <MdDeliveryDining className="text-orange-400 text-sm" />
              <span className="text-xs text-gray-500 capitalize">{vehicleText}</span>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className={"text-base font-black " + ratingColor}>{avgRating}</p>
            <p className="text-xs text-gray-400">Rating</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-base font-black text-gray-900">{totalDeliveries}</p>
            <p className="text-xs text-gray-400">Deliveries</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className={"text-base font-black " + (lateCount > 5 ? "text-red-400" : "text-gray-900")}>
              {lateCount}
            </p>
            <p className="text-xs text-gray-400">Late</p>
          </div>
        </div>

        {/* FLAG SCORE BAR */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Flag Score</span>
            <span className={"text-xs font-bold " +
              (flagScore >= 50 ? "text-red-500" : flagScore >= 30 ? "text-yellow-500" : "text-green-500")}>
              {flagScore + "/100"}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: flagBarWidth }}
              transition={{ duration: 0.6 }}
              className={"h-1.5 rounded-full " + flagBarColor}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {isFlagged ? (
            <button
              onClick={handleUnflag}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <FiCheckCircle className="text-xs" />
              Unflag
            </button>
          ) : (
            <button
              onClick={handleFlag}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <FiFlag className="text-xs" />
              Flag
            </button>
          )}
          {phone && (
  <CallButton telHref={telHref} />
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
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Phone", value: phone || "N/A" },
                  { label: "Vehicle", value: agent.vehicleType || "bike" },
                  { label: "Reg. Number", value: agent.vehicleNumber || "N/A" },
                  { label: "Joined", value: agent.createdAt ? new Date(agent.createdAt).toLocaleDateString("en-IN") : "N/A" },
                  { label: "Total Earnings", value: "Rs." + (agent.totalEarnings || 0) },
                  { label: "On-Time Rate", value: (agent.onTimeRate || 0) + "%" },
                ].map((info) => (
                  <div key={info.label} className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-xs text-gray-400">{info.label}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Flag History */}
              {agent.flagReasons && agent.flagReasons.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-600 mb-2">Flag History</p>
                  <div className="space-y-1">
                    {agent.flagReasons.map((reason, i) => (
                      <p key={i} className="text-xs text-red-500">{"• " + reason}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllAgents();
      setAgents(res.data.data || []);
    } catch (err) {
      console.error("Fetch agents error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async (userId) => {
    try {
      await adminAPI.flagAgent(userId);
      setAgents((prev) =>
        prev.map((a) => a.userId === userId ? { ...a, isFlagged: true } : a)
      );
      toast.success("Agent flagged.");
    } catch (err) {
      toast.error("Failed to flag agent.");
    }
  };

  const handleUnflag = async (userId) => {
    try {
      await adminAPI.unflagAgent(userId);
      setAgents((prev) =>
        prev.map((a) => a.userId === userId ? { ...a, isFlagged: false } : a)
      );
      toast.success("Agent unflagged.");
    } catch (err) {
      toast.error("Failed to unflag agent.");
    }
  };

  const filteredAgents = agents.filter((a) => {
    const matchSearch = !search ||
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.vehicleNumber && a.vehicleNumber.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" ||
      (filter === "available" && a.isAvailable && !a.isFlagged) ||
      (filter === "unavailable" && !a.isAvailable && !a.isFlagged) ||
      (filter === "flagged" && a.isFlagged);
    return matchSearch && matchFilter;
  });

  const counts = {
    all: agents.length,
    available: agents.filter((a) => a.isAvailable && !a.isFlagged).length,
    unavailable: agents.filter((a) => !a.isAvailable && !a.isFlagged).length,
    flagged: agents.filter((a) => a.isFlagged).length,
  };

  const flaggedCount = counts.flagged;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Delivery Agents</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {agents.length + " agents • " + counts.available + " online"}
            </p>
          </div>
          <button onClick={fetchAgents} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <FiRefreshCw className={loading ? "animate-spin text-orange-500" : "text-gray-400"} />
          </button>
        </div>

        {/* FLAGGED ALERT */}
        {flaggedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3"
          >
            <FiAlertCircle className="text-red-500 text-lg flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-red-800 text-sm">
                {flaggedCount + " flagged agent" + (flaggedCount > 1 ? "s" : "") + " need attention"}
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                Review their performance and take action.
              </p>
            </div>
            <button
              onClick={() => setFilter("flagged")}
              className="text-xs text-red-600 font-bold hover:text-red-700 transition-colors"
            >
              View
            </button>
          </motion.div>
        )}

        {/* SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: agents.length, color: "text-gray-900" },
            { label: "Online", value: counts.available, color: "text-green-600" },
            { label: "Offline", value: counts.unavailable, color: "text-gray-400" },
            { label: "Flagged", value: flaggedCount, color: "text-red-500" },
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
            placeholder="Search by name, email or vehicle number..."
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

        {/* AGENTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <MdDeliveryDining className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No agents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.userId}
                  agent={agent}
                  onFlag={handleFlag}
                  onUnflag={handleUnflag}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAgents;