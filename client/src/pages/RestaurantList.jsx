import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiFilter, FiX, FiChevronDown, FiZap } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { restaurantAPI } from "../services/api";
import RestaurantCard from "../components/RestaurantCard";
import AISearchBar from "../components/AISearchBar";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/LoadingSpinner";

const CUISINES = [
  "Indian", "Chinese", "Pizza", "Burger", "Biryani",
  "South Indian", "North Indian", "Healthy", "Desserts",
  "Fast Food", "Continental", "Mexican",
];

const SORT_OPTIONS = [
  { value: "rating", label: "Top Rated" },
  { value: "deliveryTime", label: "Fastest Delivery" },
  { value: "deliveryFee", label: "Lowest Delivery Fee" },
  { value: "minOrder", label: "Lowest Min Order" },
];

const RestaurantList = () => {
  const [searchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get("cuisine") || "");
  const [sortBy, setSortBy] = useState("rating");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [showFreeDelivery, setShowFreeDelivery] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [textSearch, setTextSearch] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCuisine, sortBy, showOpenOnly, showFreeDelivery]);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const params = { isApproved: true };
      if (selectedCuisine) params.cuisine = selectedCuisine;
      if (showOpenOnly) params.isOpen = true;
      if (sortBy) params.sortBy = sortBy;
      const res = await restaurantAPI.getAll(params);
      setRestaurants(res.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCuisine, sortBy, showOpenOnly, showFreeDelivery]);

  const handleAiResults = (results, summary) => {
    setAiResults(results || null);
    setAiSummary(summary || "");
  };

  const clearFilters = () => {
    setSelectedCuisine("");
    setSortBy("rating");
    setShowOpenOnly(false);
    setShowFreeDelivery(false);
    setAiResults(null);
    setAiSummary("");
    setTextSearch("");
  };

  const activeFilterCount =
    (selectedCuisine ? 1 : 0) +
    (showOpenOnly ? 1 : 0) +
    (showFreeDelivery ? 1 : 0) +
    (sortBy !== "rating" ? 1 : 0);

  const displayList = aiResults
    ? null
    : restaurants.filter((r) => {
        if (!textSearch.trim()) return true;
        const q = textSearch.toLowerCase();
        return (
          r.name?.toLowerCase().includes(q) ||
          r.cuisineTypes?.some((c) => c.toLowerCase().includes(q))
        );
      });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ---- STICKY HEADER ---- */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* AI Search */}
          <div className="mb-3">
            <AISearchBar
              onResults={handleAiResults}
              placeholder="Search with AI or type restaurant name..."
            />
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold flex-shrink-0 transition-all " +
                (activeFilterCount > 0
                  ? "border-orange-500 bg-orange-50 text-orange-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300")}
            >
              <FiFilter className="text-sm" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none focus:border-orange-400 bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>

            {/* Open Now */}
            <button
              onClick={() => setShowOpenOnly((p) => !p)}
              className={"px-4 py-2 rounded-xl border-2 text-sm font-semibold flex-shrink-0 transition-all " +
                (showOpenOnly
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300")}
            >
              Open Now
            </button>

            {/* Free Delivery */}
            <button
              onClick={() => setShowFreeDelivery((p) => !p)}
              className={"px-4 py-2 rounded-xl border-2 text-sm font-semibold flex-shrink-0 transition-all " +
                (showFreeDelivery
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300")}
            >
              Free Delivery
            </button>

            {/* Cuisine Chips */}
            {CUISINES.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setAiResults(null);
                  setSelectedCuisine(selectedCuisine === c ? "" : c);
                }}
                className={"px-4 py-2 rounded-xl border-2 text-sm font-semibold flex-shrink-0 transition-all " +
                  (selectedCuisine === c
                    ? "border-orange-500 bg-orange-50 text-orange-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300")}
              >
                {c}
              </button>
            ))}

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 font-semibold hover:text-red-500 flex-shrink-0 transition-colors"
              >
                <FiX className="text-xs" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                All Cuisines
              </p>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setAiResults(null);
                      setSelectedCuisine(selectedCuisine === c ? "" : c);
                    }}
                    className={"px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all " +
                      (selectedCuisine === c
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ---- CONTENT ---- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Results Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            {aiResults ? (
              <div>
                <h2 className="font-bold text-gray-900 text-lg">AI Search Results</h2>
                {aiSummary && (
                  <p className="text-sm text-orange-500 flex items-center gap-1 mt-0.5">
                    <FiZap className="text-xs" />
                    {aiSummary}
                  </p>
                )}
              </div>
            ) : (
              <h2 className="font-bold text-gray-900 text-lg">
                {loading
                  ? "Loading..."
                  : (displayList?.length || 0) + " restaurants"}
                {selectedCuisine && (
                  <span className="text-orange-500"> in {selectedCuisine}</span>
                )}
              </h2>
            )}
          </div>
          {aiResults && (
            <button
              onClick={() => { setAiResults(null); setAiSummary(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <FiX className="text-xs" />
              Clear search
            </button>
          )}
        </div>

        {/* AI Results */}
        {aiResults && (
          <div>
            {aiResults.length === 0 ? (
              <EmptyState type="search" />
            ) : (
              <div className="space-y-2">
                {aiResults.map((item) => (
                  <motion.div
                    key={item.itemId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.location.href = "/restaurants/" + item.restaurantId}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-50 flex items-center justify-center text-orange-300 font-black text-xl">D</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.restaurantName}</p>
                      <p className="text-sm font-bold text-orange-500 mt-1">
                        Rs.{item.discountedPrice || item.price}
                      </p>
                    </div>
                    <span className="text-xs text-orange-500 font-semibold flex-shrink-0">View</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restaurant Grid */}
        {!aiResults && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : !displayList || displayList.length === 0 ? (
              <EmptyState
                type="restaurants"
                onAction={clearFilters}
                actionLabel="Clear Filters"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayList.map((restaurant, index) => (
                  <RestaurantCard
                    key={restaurant.restaurantId}
                    restaurant={restaurant}
                    index={index}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantList;