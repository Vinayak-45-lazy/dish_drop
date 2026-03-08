// ===================================================
// DISHDROP — AI Search Bar Component
// client/src/components/AISearchBar.jsx
// ===================================================

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiZap } from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { aiAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { InlineSpinner } from "./LoadingSpinner";

// ===================================================
// SEARCH SUGGESTIONS
// ===================================================

const SUGGESTIONS = [
  "Spicy chicken biryani",
  "Veg pizza under Rs.300",
  "Healthy salad bowls",
  "Chocolate desserts",
  "North Indian curry",
  "Quick snacks under 20 mins",
  "Gluten free options",
  "Late night food",
];

// ===================================================
// AI SEARCH BAR COMPONENT
// ===================================================

const AISearchBar = ({ restaurantId = null, onResults, placeholder }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSummary, setSearchSummary] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // -----------------------------------------------
  // CLOSE ON OUTSIDE CLICK
  // -----------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setShowResults(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -----------------------------------------------
  // HANDLE SEARCH
  // -----------------------------------------------
  const handleSearch = async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q || q.length < 2) return;

    try {
      setLoading(true);
      setShowSuggestions(false);
      setHasSearched(true);

      const res = await aiAPI.search({
        query: q,
        restaurantId: restaurantId || undefined,
      });

      const { data, searchSummary: summary } = res.data;
      setResults(data);
      setSearchSummary(summary);
      setShowResults(true);

      // Pass results to parent if callback provided
      onResults?.(data, summary, q);
    } catch (err) {
      console.error("❌ AI Search error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // HANDLE INPUT CHANGE
  // -----------------------------------------------
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length === 0) {
      setShowResults(false);
      setShowSuggestions(true);
      setHasSearched(false);
    } else {
      setShowSuggestions(false);
    }
  };

  // -----------------------------------------------
  // HANDLE KEY DOWN
  // -----------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") {
      setShowResults(false);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // -----------------------------------------------
  // CLEAR SEARCH
  // -----------------------------------------------
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setShowSuggestions(false);
    setHasSearched(false);
    onResults?.(null, "", "");
    inputRef.current?.focus();
  };

  // -----------------------------------------------
  // NAVIGATE TO RESTAURANT
  // -----------------------------------------------
  const handleItemClick = (item) => {
    setShowResults(false);
    if (item.restaurantId) {
      navigate(`/restaurants/${item.restaurantId}`);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ---- SEARCH INPUT ---- */}
      <div className={`flex items-center gap-3 bg-white border-2 rounded-2xl
        px-4 py-3 transition-all duration-200 shadow-sm
        ${showResults || showSuggestions
          ? "border-orange-400 shadow-orange-100 shadow-md"
          : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* AI Icon */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {loading ? (
            <InlineSpinner size="sm" color="orange" />
          ) : (
            <motion.div
              animate={{ rotate: query ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <FiZap className={`text-lg ${
                query ? "text-orange-500" : "text-gray-400"
              }`} />
            </motion.div>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!query) setShowSuggestions(true);
          }}
          placeholder={
            placeholder || "Search with AI — try 'spicy veg under Rs.200'"
          }
          className="flex-1 text-sm text-gray-800 placeholder-gray-400
            focus:outline-none bg-transparent"
        />

        {/* Clear / Search Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiX className="text-gray-400 text-sm" />
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-bold
              rounded-xl hover:bg-orange-600 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors flex items-center
              gap-1"
          >
            <FiSearch className="text-xs" />
            Search
          </motion.button>
        </div>
      </div>

      {/* ---- DROPDOWN ---- */}
      <AnimatePresence>
        {(showSuggestions || showResults) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl
              shadow-2xl border border-gray-100 overflow-hidden z-30 max-h-96
              overflow-y-auto"
          >
            {/* ---- SUGGESTIONS ---- */}
            {showSuggestions && (
              <div className="p-3">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                  <FiZap className="text-orange-400 text-sm" />
                  <p className="text-xs font-semibold text-gray-500 uppercase
                    tracking-wider">
                    Try searching for
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50
                        text-gray-600 hover:text-orange-600 text-xs font-medium
                        rounded-xl border border-gray-200 hover:border-orange-200
                        transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- SEARCH RESULTS ---- */}
            {showResults && (
              <>
                {/* AI Summary */}
                {searchSummary && (
                  <div className="px-4 py-3 bg-orange-50 border-b
                    border-orange-100">
                    <div className="flex items-start gap-2">
                      <FiZap className="text-orange-400 text-sm mt-0.5
                        flex-shrink-0" />
                      <p className="text-xs text-orange-700 leading-relaxed">
                        {searchSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Results List */}
                {results.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <FiSearch className="text-3xl text-gray-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-500">
                      No results found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try different keywords
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-gray-400">
                        {results.length} item{results.length !== 1 ? "s" : ""} found
                      </p>
                    </div>

                    {results.slice(0, 6).map((item) => (
                      <motion.button
                        key={item.itemId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3
                          hover:bg-gray-50 transition-colors border-b
                          border-gray-50 last:border-0 text-left"
                      >
                        {/* Item Image */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden
                          bg-gray-100 flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center
                              justify-center">
                              <MdRestaurant className="text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm
                            line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                            {item.restaurantName || "Restaurant"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-orange-500">
                              Rs.{item.discountedPrice || item.price}
                            </span>
                            {item.isVeg && (
                              <span className="text-xs text-green-500
                                font-medium">
                                Veg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-300 flex-shrink-0">
                          <FiSearch className="text-xs" />
                        </div>
                      </motion.button>
                    ))}

                    {/* View All */}
                    {results.length > 6 && (
                      <button
                        onClick={() => {
                          setShowResults(false);
                          onResults?.(results, searchSummary, query);
                        }}
                        className="w-full py-3 text-sm text-orange-500
                          font-semibold hover:bg-orange-50 transition-colors
                          border-t border-gray-100"
                      >
                        View all {results.length} results
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISearchBar;