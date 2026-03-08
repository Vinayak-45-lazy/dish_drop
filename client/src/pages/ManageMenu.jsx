import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiToggleLeft, FiToggleRight, FiX, FiSave,
  FiImage, FiChevronDown
} from "react-icons/fi";
import { MdRestaurant } from "react-icons/md";
import { restaurantAPI, menuAPI } from "../services/api";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Starters", "Main Course", "Breads", "Rice & Biryani",
  "Desserts", "Beverages", "Snacks", "Combos", "Other",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  discountedPrice: "",
  category: "Starters",
  isVeg: true,
  isAvailable: true,
  preparationTime: "",
  image: null,
  imagePreview: null,
};

const MenuForm = ({ initial, onSave, onClose, loading }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB."); return; }
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, image: file, imagePreview: preview }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Item name is required."); return; }
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      toast.error("Valid price is required.");
      return;
    }
    if (form.discountedPrice && Number(form.discountedPrice) >= Number(form.price)) {
      toast.error("Discounted price must be less than original price.");
      return;
    }
    onSave(form);
  };

  const vegBtnClass = form.isVeg
    ? "flex-1 py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  const nonVegBtnClass = !form.isVeg
    ? "flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm"
    : "flex-1 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto z-10"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-black text-gray-900 text-lg">
            {initial ? "Edit Item" : "Add Menu Item"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <FiX className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Item Photo
            </label>
            <div className="relative">
              {form.imagePreview || form.imageUrl ? (
                <div className="relative h-40 rounded-xl overflow-hidden">
                  <img
                    src={form.imagePreview || form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors">
                    <div className="text-white text-center">
                      <FiImage className="text-2xl mx-auto mb-1" />
                      <p className="text-xs font-medium">Change Photo</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              ) : (
                <label className="block h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all">
                  <div className="text-center">
                    <FiImage className="text-2xl text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400 font-medium">Upload Photo</p>
                    <p className="text-xs text-gray-300">Max 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Paneer Butter Masala"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the dish..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all bg-white pr-10"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Price (Rs.)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="e.g. 250"
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Offer Price (Optional)
              </label>
              <input
                type="number"
                value={form.discountedPrice}
                onChange={(e) => update("discountedPrice", e.target.value)}
                placeholder="e.g. 199"
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
              />
            </div>
          </div>

          {/* Prep Time */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Preparation Time (minutes)
            </label>
            <input
              type="number"
              value={form.preparationTime}
              onChange={(e) => update("preparationTime", e.target.value)}
              placeholder="e.g. 20"
              min="0"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
            />
          </div>

          {/* Veg / Non-Veg */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Food Type
            </label>
            <div className="flex gap-2">
              <button onClick={() => update("isVeg", true)} className={vegBtnClass}>
                Veg
              </button>
              <button onClick={() => update("isVeg", false)} className={nonVegBtnClass}>
                Non-Veg
              </button>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-800">Available</p>
              <p className="text-xs text-gray-400">Show this item on menu</p>
            </div>
            <button onClick={() => update("isAvailable", !form.isAvailable)}>
              {form.isAvailable ? (
                <FiToggleRight className="text-3xl text-green-500" />
              ) : (
                <FiToggleLeft className="text-3xl text-gray-300" />
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiSave className="text-sm" />
            )}
            {initial ? "Save Changes" : "Add to Menu"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MenuItemRow = ({ item, onEdit, onDelete, onToggle }) => {
  const isAvailable = item.isAvailable !== false;
  const hasDiscount = item.discountedPrice && item.discountedPrice < item.price;
  const vegBorderClass = item.isVeg ? "border-green-500" : "border-red-500";
  const vegDotClass = item.isVeg ? "bg-green-500" : "bg-red-500";
  const availBtnClass = isAvailable
    ? "text-2xl text-green-500"
    : "text-2xl text-gray-300";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
    >
      {/* Image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <MdRestaurant className="text-orange-300 text-lg" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={"w-3 h-3 border-2 rounded-sm flex items-center justify-center flex-shrink-0 " + vegBorderClass}>
            <div className={"w-1.5 h-1.5 rounded-full " + vegDotClass} />
          </div>
          <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</p>
        </div>
        <p className="text-xs text-gray-400 line-clamp-1">{item.category}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-orange-500 text-sm">
            {"Rs." + (hasDiscount ? item.discountedPrice : item.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{"Rs." + item.price}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onToggle(item)}>
          {isAvailable ? (
            <FiToggleRight className={availBtnClass} />
          ) : (
            <FiToggleLeft className={availBtnClass} />
          )}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-50 text-blue-400 hover:text-blue-500 transition-colors"
        >
          <FiEdit2 className="text-sm" />
        </button>
        <button
          onClick={() => onDelete(item.itemId)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
        >
          <FiTrash2 className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

const ManageMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await menuAPI.getMyMenu();
      setMenuItems(res.data.data || []);
    } catch (err) {
      console.error("Fetch menu error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      setFormLoading(true);
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key !== "image" && key !== "imagePreview" && form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });
      if (form.image) formData.append("image", form.image);

      if (editItem) {
        await menuAPI.updateItem(editItem.itemId, formData);
        toast.success("Item updated!");
      } else {
        await menuAPI.addItem(formData);
        toast.success("Item added!");
      }
      setShowForm(false);
      setEditItem(null);
      fetchMenu();
    } catch (err) {
      toast.error("Failed to save item.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await menuAPI.deleteItem(itemId);
      toast.success("Item deleted.");
      fetchMenu();
    } catch (err) {
      toast.error("Failed to delete item.");
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      const newVal = !item.isAvailable;
      await menuAPI.updateItem(item.itemId, { isAvailable: newVal });
      setMenuItems((prev) =>
        prev.map((i) => i.itemId === item.itemId ? { ...i, isAvailable: newVal } : i)
      );
    } catch (err) {
      toast.error("Failed to update availability.");
    }
  };

  const categories = ["All", ...new Set(menuItems.map((i) => i.category).filter(Boolean))];

  const filteredItems = menuItems.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const grouped = {};
  filteredItems.forEach((item) => {
    const cat = item.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Manage Menu</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {menuItems.length + " items"}
            </p>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-md shadow-orange-200 text-sm"
          >
            <FiPlus />
            Add Item
          </button>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all"
            />
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const cls = "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all " +
              (isActive ? "bg-orange-500 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200");
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={cls}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* MENU LIST */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <MdRestaurant className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No items found.</p>
            <button
              onClick={() => { setEditItem(null); setShowForm(true); }}
              className="mt-4 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 transition-colors"
            >
              Add First Item
            </button>
          </div>
        ) : selectedCategory === "All" ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full" />
                    {category}
                  </h3>
                  <span className="text-xs text-gray-400">{items.length + " items"}</span>
                </div>
                <AnimatePresence>
                  {items.map((item) => (
                    <MenuItemRow
                      key={item.itemId}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggleAvailability}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <MenuItemRow
                  key={item.itemId}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggleAvailability}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      <AnimatePresence>
        {showForm && (
          <MenuForm
            initial={editItem}
            onSave={handleSave}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            loading={formLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageMenu;