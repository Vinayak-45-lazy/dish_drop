// ===================================================
// DISHDROP — Razorpay Payment Service
// client/src/services/razorpay.js
// ===================================================

import { paymentAPI } from "./api";
import toast from "react-hot-toast";

// ===================================================
// LOAD RAZORPAY SCRIPT DYNAMICALLY
// ===================================================

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ===================================================
// CONFETTI ANIMATION
// Triggered on successful payment
// ===================================================

const triggerConfetti = () => {
  const colors = ["#FF4500", "#FFC300", "#00A651", "#ffffff", "#1A1A1A"];
  const confettiCount = 80;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti-piece");

    // Random properties
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = 2 + Math.random() * 2;
    const delay = Math.random() * 0.5;
    const size = 6 + Math.random() * 8;
    const shapes = ["50%", "0%", "50% 0%"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    confetti.style.cssText = `
      left: ${left}vw;
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: ${shape};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    document.body.appendChild(confetti);

    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, (duration + delay) * 1000 + 500);
  }
};

// ===================================================
// INITIATE RAZORPAY PAYMENT
// Main payment function called from Checkout page
// ===================================================

const initiatePayment = async ({
  orderData,
  userInfo,
  onSuccess,
  onFailure,
}) => {
  try {
    // Step 1: Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      toast.error("Payment gateway failed to load. Please refresh.");
      onFailure?.("Script load failed");
      return;
    }

    // Step 2: Create Razorpay order on server
    const toastId = toast.loading("Initializing payment...");

    const createResponse = await paymentAPI.createOrder({
      restaurantId: orderData.restaurantId,
      items: orderData.items,
      deliveryAddress: orderData.deliveryAddress,
      specialInstructions: orderData.specialInstructions,
      couponCode: orderData.couponCode,
      discount: orderData.discount,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      totalAmount: orderData.totalAmount,
    });

    toast.dismiss(toastId);

    const {
      razorpayOrderId,
      orderId,
      amount,
      currency,
    } = createResponse.data.data;

    // Step 3: Configure Razorpay options
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount,
      currency,
      name: "DishDrop",
      description: `Order from ${orderData.restaurantName}`,
      image: "https://i.imgur.com/n5tjHFD.png",
      order_id: razorpayOrderId,

      // Pre-fill customer details
      prefill: {
        name: userInfo.name,
        email: userInfo.email,
        contact: userInfo.phone,
      },

      // Theme matching DishDrop branding
      theme: {
        color: "#FF4500",
        backdrop_color: "rgba(0,0,0,0.5)",
      },

      // Custom notes
      notes: {
        orderId,
        restaurantName: orderData.restaurantName,
      },

      // Modal options
      modal: {
        confirm_close: true,
        animation: true,
        ondismiss: () => {
          toast.error("Payment cancelled.");
          onFailure?.("Payment dismissed");
        },
      },

      // -----------------------------------------------
      // PAYMENT SUCCESS HANDLER
      // -----------------------------------------------
      handler: async (response) => {
        try {
          const verifyToastId = toast.loading("Verifying payment...");

          // Step 4: Verify payment signature on server
          const verifyResponse = await paymentAPI.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });

          toast.dismiss(verifyToastId);

          if (verifyResponse.data.success) {
            // Trigger confetti animation
            triggerConfetti();

            toast.success("Payment successful! 🎉", {
              duration: 4000,
              icon: "🎊",
            });

            // Call success callback with order data
            onSuccess?.({
              orderId,
              paymentId: response.razorpay_payment_id,
              orderData: verifyResponse.data.data,
            });
          } else {
            toast.error("Payment verification failed.");
            onFailure?.("Verification failed");
          }
        } catch (err) {
          toast.error("Payment verification error. Contact support.");
          console.error("❌ Payment verify error:", err.message);
          onFailure?.(err.message);
        }
      },
    };

    // Step 5: Open Razorpay modal
    const rzp = new window.Razorpay(options);

    // Handle payment failure inside modal
    rzp.on("payment.failed", (response) => {
      const errorMsg =
        response.error?.description || "Payment failed. Please try again.";
      toast.error(errorMsg);
      console.error("❌ Razorpay payment failed:", response.error);
      onFailure?.(errorMsg);
    });

    rzp.open();
  } catch (err) {
    console.error("❌ Initiate payment error:", err.message);
    const message =
      err.response?.data?.message ||
      "Failed to initiate payment. Please try again.";
    toast.error(message);
    onFailure?.(message);
  }
};

// ===================================================
// FORMAT AMOUNT FOR DISPLAY
// ===================================================

const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ===================================================
// TEST CARD DETAILS
// Shown on checkout page for easy testing
// ===================================================

const TEST_CARD = {
  number: "4111 1111 1111 1111",
  expiry: "Any future date",
  cvv: "Any 3 digits",
  otp: "1234 (for test mode)",
  upi: "success@razorpay",
};

export { initiatePayment, loadRazorpayScript, triggerConfetti, formatAmount, TEST_CARD };
export default initiatePayment;
