import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const roleDashboards = {
    customer: "/",
    restaurant_owner: "/owner/dashboard",
    delivery_agent: "/agent/dashboard",
    admin: "/admin/dashboard",
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      const redirect = from || roleDashboards[result.role] || "/";
      navigate(redirect, { replace: true });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    await forgotPassword(forgotEmail);
    setForgotLoading(false);
    setForgotMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex">

      {/* LEFT PANEL - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {["🍕", "🍔", "🍜", "🌮", "🍣", "🍛", "🥗", "🍩"].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-6xl animate-bounce"
              style={{
                left: (i % 4) * 25 + 5 + "%",
                top: Math.floor(i / 4) * 50 + 10 + "%",
                animationDelay: i * 0.3 + "s",
                animationDuration: 2 + (i % 3) + "s",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-4xl font-black text-orange-500">D</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4">DishDrop</h1>
          <p className="text-orange-100 text-xl font-medium mb-8">Fresh. Fast. Delivered.</p>
          <div className="space-y-3">
            {["Order from top restaurants", "Real-time order tracking", "AI-powered recommendations"].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">✓</span>
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-white text-2xl font-black">D</span>
            </div>
            <h1 className="text-2xl font-black">
              <span className="text-orange-500">Dish</span>
              <span className="text-gray-800">Drop</span>
            </h1>
          </div>

          {!forgotMode ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back!</h2>
                <p className="text-gray-500">Sign in to continue to DishDrop</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </motion.button>
              </form>

              {/* Test Credentials */}
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Test Accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: "Customer", email: "customer@dishdrop.com" },
                    { role: "Owner", email: "owner@dishdrop.com" },
                    { role: "Agent", email: "agent@dishdrop.com" },
                    { role: "Admin", email: "admin@dishdrop.com" },
                  ].map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword("Test@123");
                      }}
                      className="text-left p-2 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all"
                    >
                      <p className="text-xs font-bold text-gray-700">{acc.role}</p>
                      <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Password: Test@123
                </p>
              </div>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-500 mt-6">
                Do not have an account?{" "}
                <Link to="/register" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
                  Sign Up
                </Link>
              </p>
            </>
          ) : (
            // Forgot Password Form
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-500 text-sm">
                  Enter your email and we will send you a reset link.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-200"
                >
                  {forgotLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : "Send Reset Link"}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full py-3 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;