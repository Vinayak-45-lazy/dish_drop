import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiZap, FiRefreshCw, FiStar, FiClock, FiShoppingCart } from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { aiAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import { DotsLoader } from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const RecommendationCard = ({ item, index, onAddToCart }) => {
  const navigate = useNavigate();
  const vegClass = item.isVeg ? "border-green-500" : "border-red-500";
  const dotClass = item.isVeg ? "bg-green-500" : "bg-red-500";
  const hasDiscount = item.discountedPrice && item.discountedPrice < item.price;
  const displayPrice = hasDiscount ? item.discountedPrice : item.price;
  const matchScore = item.matchScore || 0;
  const scoreColor = matchScore >= 80 ? "text-green-500" : matchScore >= 60 ? "text-orange-500" : "text-gray-400";
  const scoreBar = matchScore >= 80 ? "bg-green-500" : matchScore >= 60 ? "bg-orange-500" : "bg-gray-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
    >
      {/* Image */}
      <div
        className="relative h-40 bg-gray-100 overflow-hidden cursor-pointer"
        onClick={() => navigate("/restaurants/" + item.restaurantId)}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <MdRestaurant className="text-orange-200 text-5xl" />
          </div>
        )}

        {/* Match Score Badge */}
        <div className="absolute top-2 right-2 bg-white rounded-xl px-2 py-1 shadow-md">
          <div className="flex items-center gap-1">
            <FiZap className="text-orange-400 text-xs" />
            <span className={"text-xs font-black " + scoreColor}>{matchScore}%</span>
          </div>
        </div>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-xl">
            {Math.round(((item.price - item.discountedPrice) / item.price) * 100) + "% OFF"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className={"w-3 h-3 border-2 rounded-sm flex items-center justify-center flex-shrink-0 " + vegClass}>
                <div className={"w-1.5 h-1.5 rounded-full " + dotClass} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
            </div>
            <p className="text-xs text-gray-400 line-clamp-1">{item.restaurantName}</p>
          </div>
        </div>

        {/* Match Score Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">AI Match</span>
            <span className={"text-xs font-bold " + scoreColor}>{matchScore}% match</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: matchScore + "%" }}
              transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
              className={"h-1.5 rounded-full " + scoreBar}
            />
          </div>
        </div>

        {/* Reason */}
        {item.reason && (
          <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">
            {item.reason}
          </p>
        )}

        {/* Price + Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-gray-900 text-base">{"Rs." + displayPrice}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1.5">{"Rs." + item.price}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(item)}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl hover:bg-orange-600 transition-colors"
          >
            <FiShoppingCart className="text-xs" />
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AIRecommendations = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { addItem, openCart } = useCart();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  const TAGS = ["All", "Veg", "Non-Veg", "Under Rs.200", "Bestsellers", "New"];

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const res = await aiAPI.getRecommendations();
      const data = res.data.data || [];
      setRecommendations(data);
      setAiMessage(res.data.message || "");
    } catch (err) {
      console.error("Recommendations error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddToCart = (item) => {
    const restaurant = {
      restaurantId: item.restaurantId,
      name: item.restaurantName,
      deliveryFee: item.deliveryFee || 0,
      minimumOrderAmount: item.minimumOrderAmount || 0,
    };
    addItem(item, restaurant);
    toast.success(item.name + " added to cart!");
    openCart();
  };

  const filteredItems = recommendations.filter((item) => {
    if (selectedTag === "All") return true;
    if (selectedTag === "Veg") return item.isVeg === true;
    if (selectedTag === "Non-Veg") return item.isVeg === false;
    if (selectedTag === "Under Rs.200") {
      const price = item.discountedPrice || item.price;
      return price < 200;
    }
    if (selectedTag === "Bestsellers") return (item.totalOrders || 0) > 100;
    if (selectedTag === "New") return (item.totalOrders || 0) < 10;
    return true;
  });

  const firstName = userProfile ? (userProfile.name || "").split(" ")[0] : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
                <FiZap className="text-white text-sm" />
              </div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                AI Powered
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              {firstName ? "For You, " + firstName : "Recommendations"}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Personalized picks based on your order history
            </p>
          </div>
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className={refreshing ? "animate-spin text-orange-500" : "text-gray-400"} />
            Refresh
          </button>
        </div>

        {/* AI MESSAGE */}
        {aiMessage && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 flex items-start gap-3"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FiZap className="text-white text-sm" />
            </div>
            <p className="text-sm text-orange-700 leading-relaxed">{aiMessage}</p>
          </motion.div>
        )}

        {/* FILTER TAGS */}
        {!loading && recommendations.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {TAGS.map((tag) => {
              const isActive = selectedTag === tag;
              const cls = "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all " +
                (isActive ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300");
              return (
                <button key={tag} onClick={() => setSelectedTag(tag)} className={cls}>
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiZap className="text-orange-400 text-2xl" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">AI is thinking...</h3>
            <p className="text-gray-400 text-sm mb-4">Analyzing your taste preferences</p>
            <DotsLoader />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            type="orders"
            title="No recommendations yet"
            description="Place a few orders and our AI will learn your preferences!"
            actionLabel="Browse Restaurants"
            onAction={() => navigate("/restaurants")}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredItems.length + " items matched"}
              </p>
              {selectedTag !== "All" && (
                <button
                  onClick={() => setSelectedTag("All")}
                  className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item, index) => (
                <RecommendationCard
                  key={item.itemId}
                  item={item}
                  index={index}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </>
        )}

        {/* HOW IT WORKS */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 bg-white rounded-2xl border border-gray-100 p-6"
          >
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <FiZap className="text-orange-500" />
              How AI Recommendations Work
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Analyzes Orders", desc: "Reviews your past orders to understand your taste" },
                { step: "02", title: "Finds Patterns", desc: "Identifies cuisine preferences and price range" },
                { step: "03", title: "Suggests Items", desc: "Recommends items you are likely to enjoy" },
              ].map((s) => (
                <div key={s.step} className="text-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-xs font-black text-orange-300 tracking-widest">STEP {s.step}</span>
                  <h4 className="font-bold text-gray-800 text-sm mt-1 mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default AIRecommendations;