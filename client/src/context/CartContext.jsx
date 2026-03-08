// ===================================================
// DISHDROP — Cart Context
// client/src/context/CartContext.jsx
// ===================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import toast from "react-hot-toast";

// ===================================================
// CREATE CONTEXT
// ===================================================

const CartContext = createContext(null);

// ===================================================
// CART PROVIDER
// ===================================================

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);

  // -----------------------------------------------
  // LOAD CART FROM LOCALSTORAGE ON MOUNT
  // -----------------------------------------------
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("dishdrop_cart");
      const savedRestaurant = localStorage.getItem("dishdrop_cart_restaurant");

      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      if (savedRestaurant) {
        setCartRestaurant(JSON.parse(savedRestaurant));
      }
    } catch (err) {
      console.error("❌ Load cart error:", err.message);
      localStorage.removeItem("dishdrop_cart");
      localStorage.removeItem("dishdrop_cart_restaurant");
    }
  }, []);

  // -----------------------------------------------
  // SAVE CART TO LOCALSTORAGE ON CHANGE
  // -----------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem("dishdrop_cart", JSON.stringify(cartItems));
      localStorage.setItem(
        "dishdrop_cart_restaurant",
        JSON.stringify(cartRestaurant)
      );
    } catch (err) {
      console.error("❌ Save cart error:", err.message);
    }
  }, [cartItems, cartRestaurant]);

  // -----------------------------------------------
  // ADD ITEM TO CART
  // -----------------------------------------------
  const addItem = useCallback(
    (item, restaurant) => {
      // Check if adding from different restaurant
      if (
        cartRestaurant &&
        cartRestaurant.restaurantId !== restaurant.restaurantId &&
        cartItems.length > 0
      ) {
        // Show clear cart confirmation modal
        setPendingItem({ item, restaurant });
        setShowClearModal(true);
        return;
      }

      // Set restaurant if cart is empty
      if (!cartRestaurant || cartItems.length === 0) {
        setCartRestaurant(restaurant);
      }

      setCartItems((prev) => {
        const existing = prev.find((i) => i.itemId === item.itemId);

        if (existing) {
          // Increment quantity
          toast.success(`${item.name} quantity updated!`, {
            icon: "✅",
            duration: 1500,
          });
          return prev.map((i) =>
            i.itemId === item.itemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          // Add new item
          toast.success(`${item.name} added to cart!`, {
            icon: "🛒",
            duration: 1500,
          });
          return [
            ...prev,
            {
              itemId: item.itemId,
              name: item.name,
              price: item.discountedPrice || item.price,
              originalPrice: item.price,
              imageUrl: item.imageUrl,
              isVeg: item.isVeg,
              quantity: 1,
            },
          ];
        }
      });
    },
    [cartItems, cartRestaurant]
  );

  // -----------------------------------------------
  // REMOVE ITEM FROM CART
  // -----------------------------------------------
  const removeItem = useCallback((itemId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.itemId === itemId);
      if (item) {
        toast.success(`${item.name} removed from cart.`, {
          icon: "🗑️",
          duration: 1500,
        });
      }
      const updated = prev.filter((i) => i.itemId !== itemId);
      if (updated.length === 0) {
        setCartRestaurant(null);
      }
      return updated;
    });
  }, []);

  // -----------------------------------------------
  // UPDATE ITEM QUANTITY
  // -----------------------------------------------
  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  // -----------------------------------------------
  // INCREMENT QUANTITY
  // -----------------------------------------------
  const incrementItem = useCallback((itemId) => {
    setCartItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }, []);

  // -----------------------------------------------
  // DECREMENT QUANTITY
  // -----------------------------------------------
  const decrementItem = useCallback((itemId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.itemId === itemId);
      if (!item) return prev;

      if (item.quantity <= 1) {
        const updated = prev.filter((i) => i.itemId !== itemId);
        if (updated.length === 0) setCartRestaurant(null);
        return updated;
      }

      return prev.map((i) =>
        i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  // -----------------------------------------------
  // CLEAR CART
  // -----------------------------------------------
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartRestaurant(null);
    localStorage.removeItem("dishdrop_cart");
    localStorage.removeItem("dishdrop_cart_restaurant");
  }, []);

  // -----------------------------------------------
  // CONFIRM CLEAR CART + ADD PENDING ITEM
  // Called when user confirms switching restaurants
  // -----------------------------------------------
  const confirmClearAndAdd = useCallback(() => {
    if (pendingItem) {
      setCartItems([
        {
          itemId: pendingItem.item.itemId,
          name: pendingItem.item.name,
          price: pendingItem.item.discountedPrice || pendingItem.item.price,
          originalPrice: pendingItem.item.price,
          imageUrl: pendingItem.item.imageUrl,
          isVeg: pendingItem.item.isVeg,
          quantity: 1,
        },
      ]);
      setCartRestaurant(pendingItem.restaurant);
      setPendingItem(null);
      setShowClearModal(false);
      toast.success(`Cart cleared! ${pendingItem.item.name} added. 🛒`);
    }
  }, [pendingItem]);

  // -----------------------------------------------
  // CANCEL CLEAR CART
  // -----------------------------------------------
  const cancelClearCart = useCallback(() => {
    setPendingItem(null);
    setShowClearModal(false);
  }, []);

  // -----------------------------------------------
  // GET ITEM QUANTITY IN CART
  // -----------------------------------------------
  const getItemQuantity = useCallback(
    (itemId) => {
      const item = cartItems.find((i) => i.itemId === itemId);
      return item ? item.quantity : 0;
    },
    [cartItems]
  );

  // -----------------------------------------------
  // COMPUTED VALUES
  // -----------------------------------------------
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const subtotal = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const deliveryFee = cartRestaurant?.deliveryFee || 0;

  const totalAmount = subtotal + deliveryFee;

  const isEmpty = cartItems.length === 0;

  // -----------------------------------------------
  // OPEN / CLOSE CART DRAWER
  // -----------------------------------------------
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // -----------------------------------------------
  // CONTEXT VALUE
  // -----------------------------------------------
  const value = {
    // State
    cartItems,
    cartRestaurant,
    isCartOpen,
    showClearModal,
    pendingItem,

    // Computed
    totalItems,
    subtotal,
    deliveryFee,
    totalAmount,
    isEmpty,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    confirmClearAndAdd,
    cancelClearCart,
    getItemQuantity,

    // Cart drawer
    openCart,
    closeCart,
    toggleCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* Clear Cart Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelClearCart}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
            <div className="text-center">
              <div className="text-4xl mb-3">🛒</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Start a new cart?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Your cart has items from{" "}
                <span className="font-semibold text-orange-500">
                  {cartRestaurant?.name}
                </span>
                . Adding this item will clear your current cart.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelClearCart}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200
                    text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Keep Cart
                </button>
                <button
                  onClick={confirmClearAndAdd}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-500
                    text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

// ===================================================
// CUSTOM HOOK
// ===================================================

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export default CartContext;