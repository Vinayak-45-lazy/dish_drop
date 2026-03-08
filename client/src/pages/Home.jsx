import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiSearch, FiMapPin, FiArrowRight, FiZap, FiStar, FiClock
} from "react-icons/fi";
import { MdDeliveryDining } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { restaurantAPI } from "../services/api";
import RestaurantCard from "../components/RestaurantCard";
import AISearchBar from "../components/AISearchBar";
import { SkeletonCard } from "../components/LoadingSpinner";

// ===================================================
// CUISINE FILTER CHIPS
// ===================================================

const CUISINES = [
  { label: "All", value: "" },
  { label: "Biryani", value: "biryani" },
  { label: "Pizza", value: "pizza" },
  { label: "Burger", value: "burger" },
  { label: "Indian", value: "indian" },
  { label: "Chinese", value: "chinese" },
  { label: "South Indian", value: "south indian" },
  { label: "Healthy", value: "healthy" },
  { label: "Desserts", value: "desserts" },
];

// ===================================================
// STATS COUNTER ANIMATION
// ===================================================

const StatCard = ({ value, label, delay }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = parseInt(value);
      const duration = 1500;
      const increment = end / (duration / 16);
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(counter);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(counter);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="text-center">
      <p className="text-3xl font-black text-orange-500">
        {count.toLocaleString()}+
      </p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
};

// ===================================================
// HOME PAGE
// ===================================================

const HomePage = () => {
  const { isLoggedIn, userProfile, isCustomer } = useAuth();
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchSummary, setSearchSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCuisine]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = { isApproved: true };
      if (selectedCuisine) params.cuisine = selectedCuisine;
      const res = await restaurantAPI.getAll(params);
      setRestaurants(res.data.data || []);
    } catch (err) {
      console.error("Fetch restaurants error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (results, summary, query) => {
    setSearchResults(results);
    setSearchSummary(summary);
    setSearchQuery(query);
  };

  const displayRestaurants = searchResults || restaurants;
  const isShowingSearchResults = searchResults !== null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===================================================
          HERO SECTION
      =================================================== */}
     
<section className="bg-gradient-to-br from-orange-500 via-orange-420 to-yellow-400 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          
<div className="absolute top-10 right-10 w-64 h-64 bg-yellow-200 rounded-full blur-3xl" />
<div className="absolute bottom-0 left-20 w-48 h-48 bg-orange-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {isLoggedIn && userProfile ? (
       <p className="text-orange-100 font-medium mb-2">
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                  {userProfile.name?.split(" ")[0]}!
                </p>
              ) : null}

              <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
                Delicious food,
                <br />
                <span className="text-yellow-300">delivered fast</span>
              </h1>
           <p className="text-orange-100 text-lg mb-8">
                Order from the best restaurants in your city. Fresh food at your doorstep in minutes.
              </p>
            </motion.div>

            {/* AI Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-1.5 shadow-2xl"
            >
              <AISearchBar
                onResults={handleSearchResults}
                placeholder="Search with AI - try 'spicy chicken under Rs.300'"
              />
            </motion.div>

            {/* Quick Filters */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mt-4 flex-wrap"
            >
             <span className="text-orange-200 text-xs font-medium">Popular:</span>
              {["Biryani", "Pizza", "Burger", "Healthy"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate("/restaurants?cuisine=" + tag.toLowerCase())}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-full transition-colors backdrop-blur-sm"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================================================
          STATS SECTION
      =================================================== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value={500} label="Happy Customers" delay={0} />
            <StatCard value={50} label="Restaurants" delay={200} />
            <StatCard value={1000} label="Orders Delivered" delay={400} />
            <StatCard value={30} label="Min Avg Delivery" delay={600} />
          </div>
        </div>
      </section>

      {/* ===================================================
          HOW IT WORKS
      =================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-black text-gray-900 text-center mb-8">
          How DishDrop Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Choose Restaurant",
              description: "Browse restaurants near you or search for your favorite cuisine",
              icon: <FiSearch className="text-2xl" />,
              color: "bg-orange-500",
            },
            {
              step: "02",
              title: "Place Order",
              description: "Add items to cart, apply coupons, and pay securely with Razorpay",
              icon: <FiZap className="text-2xl" />,
              color: "bg-blue-500",
            },
            {
              step: "03",
              title: "Fast Delivery",
              description: "Track your order live on the map as it makes its way to you",
              icon: <MdDeliveryDining className="text-2xl" />,
              color: "bg-green-500",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className={"w-12 h-12 " + item.color + " rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"}>
                {item.icon}
              </div>
              <span className="text-xs font-black text-gray-300 tracking-widest">
                STEP {item.step}
              </span>
              <h3 className="font-bold text-gray-900 text-lg mt-1 mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================================================
          RESTAURANT LISTING
      =================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              {isShowingSearchResults
                ? "Search Results"
                : selectedCuisine
                ? selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1) + " Restaurants"
                : "All Restaurants"}
            </h2>
            {isShowingSearchResults && searchSummary && (
              <p className="text-sm text-orange-500 mt-1 flex items-center gap-1">
                <FiZap className="text-xs" />
                {searchSummary}
              </p>
            )}
            {isShowingSearchResults && (
              <button
                onClick={() => {
                  setSearchResults(null);
                  setSearchQuery("");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 mt-1 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
          <Link
            to="/restaurants"
            className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
          >
            View All
            <FiArrowRight className="text-sm" />
          </Link>
        </div>

        {/* Cuisine Filter Chips */}
        {!isShowingSearchResults && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {CUISINES.map((cuisine) => (
              <button
                key={cuisine.value}
                onClick={() => setSelectedCuisine(cuisine.value)}
                className={"flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all " +
                  (selectedCuisine === cuisine.value
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300")}
              >
                {cuisine.label}
              </button>
            ))}
          </div>
        )}

        {/* Restaurant Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍽️</p>
            <h3 className="font-bold text-gray-800 text-xl mb-2">No restaurants found</h3>
            <p className="text-gray-400 text-sm">Try a different cuisine or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayRestaurants.slice(0, 8).map((restaurant, index) => (
              <RestaurantCard
                key={restaurant.restaurantId}
                restaurant={restaurant}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {/* ===================================================
          CTA BANNER
      =================================================== */}
      {!isLoggedIn && (
        <section className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-black mb-4">
                Ready to order?
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Join DishDrop today and get your first order with exclusive deals.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/30 text-lg"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-colors text-lg"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===================================================
          AI RECOMMENDATION BANNER (logged in customers)
      =================================================== */}
      {isLoggedIn && isCustomer && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FiZap className="text-yellow-300" />
                <span className="text-orange-100 text-sm font-medium uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <h3 className="text-2xl font-black mb-1">
                Discover food made for you
              </h3>
              <p className="text-orange-100 text-sm">
                Our AI analyzes your order history to recommend dishes you will love
              </p>
            </div>
            <Link
              to="/recommendations"
              className="flex-shrink-0 px-6 py-3 bg-white text-orange-500 font-bold rounded-2xl hover:bg-orange-50 transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <FiStar />
              See Recommendations
            </Link>
          </motion.div>
        </section>
      )}

    </div>
  );
};

export default HomePage;