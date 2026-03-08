import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiEdit2,
  FiSave, FiX, FiPlus, FiTrash2, FiCamera
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const CustomerProfile = () => {
  const { userProfile, refreshProfile } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const [newAddress, setNewAddress] = useState({
    label: "Home",
    addressLine: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    try {
      setLoading(true);
      await authAPI.updateProfile(formData);
      await refreshProfile();
      setEditMode(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    try {
      setUploadingPhoto(true);
      const form = new FormData();
      form.append("photo", file);
      await authAPI.updateProfilePhoto(form);
      await refreshProfile();
      toast.success("Photo updated!");
    } catch (err) {
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.addressLine || !newAddress.city || !newAddress.pincode) {
      toast.error("Please fill all address fields.");
      return;
    }
    try {
      await authAPI.addAddress(newAddress);
      await refreshProfile();
      setShowAddAddress(false);
      setNewAddress({ label: "Home", addressLine: "", city: "", pincode: "" });
      toast.success("Address added!");
    } catch (err) {
      toast.error("Failed to add address.");
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      await authAPI.deleteAddress(index);
      await refreshProfile();
      toast.success("Address removed.");
    } catch (err) {
      toast.error("Failed to remove address.");
    }
  };

  if (!userProfile) return null;

  const avatarInitial = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "U";
  const addresses = userProfile.addresses || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your account details</p>
        </div>

        <div className="space-y-4">

          {/* PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">

            {/* Avatar + Photo Upload */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-orange-100 flex items-center justify-center flex-shrink-0">
                  {userProfile.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-orange-500">{avatarInitial}</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-md">
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCamera className="text-white text-xs" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{userProfile.name}</h2>
                <p className="text-gray-400 text-sm">{userProfile.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full capitalize">
                  {userProfile.role || "customer"}
                </span>
              </div>
            </div>

            {/* Edit Toggle */}
            <div className="flex justify-end mb-4">
              {editMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <FiX className="text-xs" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiSave className="text-xs" />
                    )}
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <FiEdit2 className="text-xs" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                {editMode ? (
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <FiUser className="text-gray-400 text-sm flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">{userProfile.name}</span>
                  </div>
                )}
              </div>

              {/* Email - always readonly */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                  <FiMail className="text-gray-400 text-sm flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">{userProfile.email}</span>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    Cannot edit
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                {editMode ? (
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      maxLength={10}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <FiPhone className="text-gray-400 text-sm flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">
                      {userProfile.phone || "Not set"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ADDRESSES */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <FiMapPin className="text-orange-500" />
                Saved Addresses
              </h3>
              <button
                onClick={() => setShowAddAddress((p) => !p)}
                className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
              >
                <FiPlus className="text-sm" />
                Add New
              </button>
            </div>

            {/* Address List */}
            {addresses.length === 0 && !showAddAddress ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No saved addresses yet.
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {addresses.map((addr, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiMapPin className="text-orange-500 text-xs" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{addr.label || "Home"}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {addr.addressLine + ", " + addr.city + " - " + addr.pincode}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(i)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-all"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            {showAddAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-3 border-t border-gray-100 overflow-hidden"
              >
                <p className="text-sm font-bold text-gray-700">New Address</p>

                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((label) => {
                    const isActive = newAddress.label === label;
                    const cls = "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all " +
                      (isActive ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500");
                    return (
                      <button key={label} onClick={() => setNewAddress((p) => ({ ...p, label }))} className={cls}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={newAddress.addressLine}
                  onChange={(e) => setNewAddress((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder="Street address, building, landmark"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                  />
                  <input
                    type="text"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress((p) => ({ ...p, pincode: e.target.value }))}
                    placeholder="Pincode"
                    maxLength={6}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAddress}
                    className="flex-1 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Save Address
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* ACCOUNT STATS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 text-base mb-4">Account Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-orange-500">
                  {userProfile.totalOrders || 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Total Orders</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-green-500">
                  {userProfile.totalSaved || 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Rs. Saved</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-blue-500">
                  {addresses.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Addresses</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;