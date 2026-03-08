import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp, FiShoppingBag, FiDollarSign,
  FiStar, FiRefreshCw, FiCalendar
} from "react-icons/fi";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend
} from "recharts";
import { orderAPI, restaurantAPI } from "../services/api";
import { SkeletonCard } from "../components/LoadingSpinner";

const COLORS = ["#FF4500", "#FF6B35", "#FFA552", "#FFD166", "#06D6A0", "#118AB2"];

const PERIODS = [
  { value: "7", label: "7 Days" },
  { value: "30", label: "30 Days" },
  { value: "90", label: "3 Months" },
];

const StatCard = ({ icon, label, value, sub, color, delay }) => {
  const bgClass = color === "orange" ? "bg-orange-50"
    : color === "green" ? "bg-green-50"
    : color === "blue" ? "bg-blue-50"
    : "bg-purple-50";
  const iconClass = color === "orange" ? "text-orange-500"
    : color === "green" ? "text-green-500"
    : color === "blue" ? "text-blue-500"
    : "text-purple-500";
  const subClass = sub && sub.startsWith("+") ? "text-green-500" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + bgClass}>
          <span className={iconClass}>{icon}</span>
        </div>
        {sub && (
          <span className={"text-xs font-bold " + subClass}>{sub}</span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name + ": " + (entry.name === "Revenue" ? "Rs." : "") + entry.value}
        </p>
      ))}
    </div>
  );
};

const OwnerAnalytics = () => {
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [ordersRes, restaurantRes] = await Promise.all([
        orderAPI.getOwnerOrders({ period }),
        restaurantAPI.getMyRestaurant(),
      ]);

      const orders = ordersRes.data.data || [];
      const rest = restaurantRes.data.data;
      setRestaurant(rest);

      const delivered = orders.filter((o) => o.status === "delivered");
      const cancelled = orders.filter((o) => o.status === "cancelled");
      const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;

      setStats({
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        totalRevenue,
        avgOrderValue,
        avgRating: rest?.avgRating || 0,
        cancelRate: orders.length > 0 ? ((cancelled.length / orders.length) * 100).toFixed(1) : 0,
      });

      buildChartData(delivered, Number(period));
      buildCategoryData(delivered);
      buildTopItems(delivered);
    } catch (err) {
      console.error("Analytics error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (orders, days) => {
    const map = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      map[key] = { date: key, Revenue: 0, Orders: 0 };
    }
    orders.forEach((o) => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (map[key]) {
        map[key].Revenue += o.totalAmount || 0;
        map[key].Orders += 1;
      }
    });
    const values = Object.values(map);
    setRevenueData(values);
    setOrdersData(values);
  };

  const buildCategoryData = (orders) => {
    const catMap = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const cat = item.category || "Other";
        if (!catMap[cat]) catMap[cat] = { name: cat, value: 0 };
        catMap[cat].value += item.quantity || 1;
      });
    });
    setCategoryData(Object.values(catMap).sort((a, b) => b.value - a.value));
  };

  const buildTopItems = (orders) => {
    const itemMap = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemMap[item.name].quantity += item.quantity || 1;
        itemMap[item.name].revenue += (item.price * item.quantity) || 0;
      });
    });
    const sorted = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    setTopItems(sorted.slice(0, 5));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="bg-white rounded-2xl h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  const totalRevenue = stats ? stats.totalRevenue.toFixed(0) : "0";
  const avgOrderVal = stats ? stats.avgOrderValue.toFixed(0) : "0";
  const avgRating = stats ? (stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "New") : "New";
  const cancelRate = stats ? stats.cancelRate : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {restaurant ? restaurant.name : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => {
              const isActive = period === p.value;
              const cls = "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all " +
                (isActive ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200");
              return (
                <button key={p.value} onClick={() => setPeriod(p.value)} className={cls}>
                  {p.label}
                </button>
              );
            })}
            <button onClick={fetchAnalytics} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <FiRefreshCw className="text-gray-400 text-sm" />
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FiDollarSign className="text-lg" />}
            label="Total Revenue"
            value={"Rs." + totalRevenue}
            color="orange"
            delay={0}
          />
          <StatCard
            icon={<FiShoppingBag className="text-lg" />}
            label="Total Orders"
            value={stats ? stats.totalOrders : 0}
            color="blue"
            delay={0.1}
          />
          <StatCard
            icon={<FiTrendingUp className="text-lg" />}
            label="Avg Order Value"
            value={"Rs." + avgOrderVal}
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

        {/* REVENUE CHART */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-orange-500" />
            Revenue Trend
          </h3>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="Revenue" stroke="#FF4500" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#FF4500" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ORDERS CHART */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <FiShoppingBag className="text-orange-500" />
            Orders per Day
          </h3>
          {ordersData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Orders" fill="#FF4500" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* CATEGORY PIE */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-base mb-4">Sales by Category</h3>
            {categoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* TOP ITEMS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 text-base mb-4">Top Selling Items</h3>
            {topItems.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                No data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => {
                  const maxQty = topItems[0].quantity;
                  const barWidth = maxQty > 0 ? (item.quantity / maxQty) * 100 : 0;
                  const barStyle = { width: barWidth + "%" };
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-orange-100 text-orange-600 text-xs font-black rounded-lg flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                        </div>
                        <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {item.quantity + " sold"}
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={barStyle}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="h-1.5 bg-orange-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <FiCalendar className="text-orange-500" />
            Period Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Delivered", value: stats ? stats.deliveredOrders : 0, color: "text-green-500" },
              { label: "Cancelled", value: stats ? stats.cancelledOrders : 0, color: "text-red-400" },
              { label: "Cancel Rate", value: cancelRate + "%", color: "text-orange-500" },
              { label: "Avg Rating", value: avgRating, color: "text-purple-500" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <p className={"text-xl font-black " + s.color}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OwnerAnalytics;