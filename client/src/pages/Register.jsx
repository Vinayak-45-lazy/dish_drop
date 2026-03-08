import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff,
  FiChevronRight, FiChevronLeft, FiCheck
} from "react-icons/fi";
import { MdRestaurant, MdDeliveryDining } from "react-icons/md";
import { useAuth } from "../context/AuthContext";

// ===================================================
// ROLE SELECTOR CARD
// ===================================================

const RoleCard = ({ role, label, description, icon, selected, onClick }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={"w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 " +
        (selected
          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
          : "border-gray-200 bg-white hover:border-gray-300")}
    >
      <div className="flex items-center gap-3">
        <div className={"w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 " +
          (selected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500")}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={"font-bold text-sm " + (selected ? "text-orange-600" : "text-gray-800")}>
            {label}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {selected && (
          <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <FiCheck className="text-white text-xs" />
          </div>
        )}
      </div>
    </motion.button>
  );
};

// ===================================================
// REGISTER PAGE
// ===================================================

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    restaurantName: "",
    cuisineTypes: "",
    vehicleType: "bike",
    vehicleNumber: "",
  });

  const [errors, setErrors] = useState({});

  const roleDashboards = {
    customer: "/",
    restaurant_owner: "/owner/dashboard",
    delivery_agent: "/agent/dashboard",
  };

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // -----------------------------------------------
  // VALIDATE STEP 1
  // -----------------------------------------------
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = "Enter valid 10-digit Indian mobile number";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------------------------
  // VALIDATE STEP 3
  // -----------------------------------------------
  const validateStep3 = () => {
    const newErrors = {};
    if (formData.role === "restaurant_owner") {
      if (!formData.restaurantName.trim()) newErrors.restaurantName = "Restaurant name is required";
      if (!formData.cuisineTypes.trim()) newErrors.cuisineTypes = "Add at least one cuisine type";
    }
    if (formData.role === "delivery_agent") {
      if (!formData.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle number is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------------------------
  // NEXT STEP
  // -----------------------------------------------
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  };

  // -----------------------------------------------
  // SUBMIT
  // -----------------------------------------------
  const handleSubmit = async () => {
    if (!validateStep3()) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === "restaurant_owner") {
      payload.restaurantName = formData.restaurantName.trim();
      payload.cuisineTypes = formData.cuisineTypes.split(",").map((c) => c.trim()).filter(Boolean);
    }

    if (formData.role === "delivery_agent") {
      payload.vehicleType = formData.vehicleType;
      payload.vehicleNumber = formData.vehicleNumber.trim().toUpperCase();
    }

    setLoading(true);
    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      navigate(roleDashboards[result.role] || "/", { replace: true });
    }
  };

  // -----------------------------------------------
  // PROGRESS BAR
  // -----------------------------------------------
  const progressPercent = ((step - 1) / 2) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">D</span>
            </div>
            <span className="text-xl font-black">
              <span className="text-orange-500">Dish</span>
              <span className="text-gray-800">Drop</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-gray-900">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join thousands of food lovers</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
            <span className={step >= 1 ? "text-orange-500" : ""}>Details</span>
            <span className={step >= 2 ? "text-orange-500" : ""}>Role</span>
            <span className={step >= 3 ? "text-orange-500" : ""}>Setup</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="bg-orange-500 h-1.5 rounded-full"
              animate={{ width: progressPercent + "%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* STEP 1 - Personal Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 space-y-4"
              >
                <h3 className="font-bold text-gray-900 text-lg">Personal Details</h3>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="John Doe"
                      className={"w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                        (errors.name ? "border-red-300 bg-red-50" : "border-gray-200")}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      className={"w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                        (errors.email ? "border-red-300 bg-red-50" : "border-gray-200")}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className={"w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                        (errors.phone ? "border-red-300 bg-red-50" : "border-gray-200")}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="Min 6 characters"
                      className={"w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                        (errors.password ? "border-red-300 bg-red-50" : "border-gray-200")}
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      placeholder="Repeat your password"
                      className={"w-full pl-10 pr-12 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                        (errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200")}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  Continue
                  <FiChevronRight />
                </motion.button>
              </motion.div>
            )}

            {/* STEP 2 - Role Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 space-y-3"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-4">I want to join as</h3>

                <RoleCard
                  role="customer"
                  label="Customer"
                  description="Order food from restaurants near me"
                  icon={<span className="text-lg">🛒</span>}
                  selected={formData.role === "customer"}
                  onClick={() => update("role", "customer")}
                />
                <RoleCard
                  role="restaurant_owner"
                  label="Restaurant Owner"
                  description="List my restaurant and receive orders"
                  icon={<MdRestaurant className="text-xl" />}
                  selected={formData.role === "restaurant_owner"}
                  onClick={() => update("role", "restaurant_owner")}
                />
                <RoleCard
                  role="delivery_agent"
                  label="Delivery Agent"
                  description="Deliver orders and earn money"
                  icon={<MdDeliveryDining className="text-xl" />}
                  selected={formData.role === "delivery_agent"}
                  onClick={() => update("role", "delivery_agent")}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <FiChevronRight />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 - Role-specific Setup */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 space-y-4"
              >
                {formData.role === "customer" && (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🎉</div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">You are all set!</h3>
                    <p className="text-gray-400 text-sm">
                      Create your account and start ordering delicious food.
                    </p>
                  </div>
                )}

                {formData.role === "restaurant_owner" && (
                  <>
                    <h3 className="font-bold text-gray-900 text-lg">Restaurant Details</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Restaurant Name</label>
                      <div className="relative">
                        <MdRestaurant className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.restaurantName}
                          onChange={(e) => update("restaurantName", e.target.value)}
                          placeholder="e.g. Spice Garden"
                          className={"w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                            (errors.restaurantName ? "border-red-300 bg-red-50" : "border-gray-200")}
                        />
                      </div>
                      {errors.restaurantName && <p className="text-red-500 text-xs mt-1">{errors.restaurantName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cuisine Types</label>
                      <input
                        type="text"
                        value={formData.cuisineTypes}
                        onChange={(e) => update("cuisineTypes", e.target.value)}
                        placeholder="e.g. Indian, Chinese, Biryani"
                        className={"w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                          (errors.cuisineTypes ? "border-red-300 bg-red-50" : "border-gray-200")}
                      />
                      <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                      {errors.cuisineTypes && <p className="text-red-500 text-xs mt-1">{errors.cuisineTypes}</p>}
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs text-yellow-700 font-medium">
                        Your restaurant will be reviewed and approved by admin before going live.
                      </p>
                    </div>
                  </>
                )}

                {formData.role === "delivery_agent" && (
                  <>
                    <h3 className="font-bold text-gray-900 text-lg">Vehicle Details</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "bike", label: "Bike" },
                          { value: "scooter", label: "Scooter" },
                          { value: "bicycle", label: "Bicycle" },
                        ].map((v) => (
                          <button
                            key={v.value}
                            type="button"
                            onClick={() => update("vehicleType", v.value)}
                            className={"py-2.5 rounded-xl border-2 text-sm font-semibold transition-all " +
                              (formData.vehicleType === v.value
                                ? "border-orange-500 bg-orange-50 text-orange-600"
                                : "border-gray-200 text-gray-600 hover:border-gray-300")}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Number</label>
                      <input
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(e) => update("vehicleNumber", e.target.value.toUpperCase())}
                        placeholder="e.g. KA01AB1234"
                        className={"w-full px-4 py-3 border rounded-xl text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all " +
                          (errors.vehicleNumber ? "border-red-300 bg-red-50" : "border-gray-200")}
                      />
                      {errors.vehicleNumber && <p className="text-red-500 text-xs mt-1">{errors.vehicleNumber}</p>}
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiCheck />
                        Create Account
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-500 font-bold hover:text-orange-600 transition-colors">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;