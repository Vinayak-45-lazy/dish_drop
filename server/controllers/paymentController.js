// ===================================================
// DISHDROP — Payment Controller (Razorpay)
// server/controllers/paymentController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { db } = require("../firebase");
const { sendOrderConfirmation, sendNewOrderAlert } = require("../services/emailService");
const { aiGenerateETAMessage } = require("../services/groqService");


// ===================================================
// RAZORPAY INSTANCE
// ===================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===================================================
// CREATE RAZORPAY ORDER
// POST /api/payments/create-order
// Customer only
// ===================================================

const createPaymentOrder = async (req, res) => {
  try {
    const uid = req.user.uid;

    const {
      restaurantId,
      items,
      deliveryAddress,
      specialInstructions,
      couponCode,
      discount = 0,
      subtotal,
      deliveryFee = 0,
      totalAmount,
    } = req.body;

    // Validate required fields
    if (!restaurantId || !items || !totalAmount || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Restaurant, items, delivery address, and total amount are required.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item.",
      });
    }

    // Validate total amount
    const parsedTotal = parseFloat(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid total amount.",
      });
    }

    // Fetch restaurant
    const restaurantDoc = await db
      .collection("Restaurants")
      .doc(restaurantId)
      .get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurant = restaurantDoc.data();

    if (!restaurant.isOpen || !restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is currently unavailable.",
      });
    }

    // Fetch customer
    const customerDoc = await db.collection("Users").doc(uid).get();
    const customer = customerDoc.data();

    // Create Razorpay order
    // Amount must be in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(parsedTotal * 100);

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `dishdrop_${uuidv4().slice(0, 8)}`,
        notes: {
          customerId: uid,
          customerName: customer.name,
          restaurantId,
          restaurantName: restaurant.name,
          itemCount: items.length,
        },
      });
    } catch (rzpErr) {
      razorpayOrder = { id: `mock_order_${uuidv4().slice(0, 8)}` };
    }

    // Save pending order to Firestore
    const orderId = uuidv4();
    const now = new Date();

    const pendingOrder = {
      orderId,
      customerId: uid,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      restaurantId,
      restaurantName: restaurant.name,
      deliveryAgentId: "",
      deliveryAgentName: "",
      items: items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        imageUrl: item.imageUrl || "",
      })),
      subtotal: parseFloat(subtotal),
      deliveryFee: parseFloat(deliveryFee),
      discount: parseFloat(discount),
      totalAmount: parsedTotal,
      couponCode: couponCode || "",
      razorpayOrderId: razorpayOrder.id,
      paymentId: "",
      paymentStatus: "pending",
      status: "placed",
      deliveryAddress: {
        fullAddress: deliveryAddress.fullAddress,
        lat: parseFloat(deliveryAddress.lat),
        lng: parseFloat(deliveryAddress.lng),
      },
      specialInstructions: specialInstructions || "",
      estimatedDeliveryMinutes: 35,
      distanceKm: 0,
      placedAt: now,
      confirmedAt: null,
      preparedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancelledReason: "",
    };

    await db.collection("Orders").doc(orderId).set(pendingOrder);

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully.",
      data: {
        razorpayOrderId: razorpayOrder.id,
        orderId,
        amount: amountInPaise,
        currency: "INR",
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        restaurantName: restaurant.name,
      },
    });
  } catch (err) {
    console.error("❌ Create payment order error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order.",
    });
  }
};

// ===================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payments/verify
// Called after successful Razorpay payment on client
// ===================================================

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Validate all Razorpay fields present
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields.",
      });
    }

    // -----------------------------------------------
    // VERIFY SIGNATURE
    // Razorpay signature = HMAC SHA256 of
    // razorpay_order_id + "|" + razorpay_payment_id
    // signed with key_secret
    // -----------------------------------------------

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      // Mark order as failed
      await db.collection("Orders").doc(orderId).update({
        paymentStatus: "failed",
        updatedAt: new Date(),
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // -----------------------------------------------
    // PAYMENT VERIFIED — Update order in Firestore
    // -----------------------------------------------

    const orderDoc = await db.collection("Orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Calculate ETA
    const { calculateOrderETA } = require("../services/etaService");
    const etaResult = await calculateOrderETA(
      order.restaurantId,
      order.deliveryAddress.lat,
      order.deliveryAddress.lng
    );

    // Update order with payment details
    await db.collection("Orders").doc(orderId).update({
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentStatus: "paid",
      estimatedDeliveryMinutes: etaResult.etaMinutes,
      distanceKm: etaResult.distanceKm,
      updatedAt: new Date(),
    });

    // Update restaurant total orders
    await db
      .collection("Restaurants")
      .doc(order.restaurantId)
      .update({
        totalOrders:
          (
            await db
              .collection("Restaurants")
              .doc(order.restaurantId)
              .get()
          ).data().totalOrders + 1,
      });

    // Update menu item order counts
    const batch = db.batch();
    for (const item of order.items) {
      const itemRef = db.collection("MenuItems").doc(item.itemId);
      const itemDoc = await itemRef.get();
      if (itemDoc.exists) {
        batch.update(itemRef, {
          totalOrders: (itemDoc.data().totalOrders || 0) + item.quantity,
        });
      }
    }
    await batch.commit();

    // Increment coupon usage if applied
    if (order.couponCode) {
      const couponSnap = await db
        .collection("Coupons")
        .where("code", "==", order.couponCode)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const couponDoc = couponSnap.docs[0];
        await couponDoc.ref.update({
          usedCount: (couponDoc.data().usedCount || 0) + 1,
        });
      }
    }

    // Generate AI ETA message
    const etaMessage = await aiGenerateETAMessage(
      etaResult.etaMinutes,
      order.restaurantName,
      order.items
    );

    // Fetch updated order
    const updatedOrder = {
      ...order,
      paymentId: razorpay_payment_id,
      paymentStatus: "paid",
      estimatedDeliveryMinutes: etaResult.etaMinutes,
    };

    // Send confirmation email to customer (non-blocking)
    sendOrderConfirmation(updatedOrder).catch((err) =>
      console.error("Order confirmation email failed:", err.message)
    );

    // Send alert to restaurant owner (non-blocking)
    const ownerDoc = await db
      .collection("Users")
      .doc(
        (
          await db
            .collection("Restaurants")
            .doc(order.restaurantId)
            .get()
        ).data().ownerId
      )
      .get();

    if (ownerDoc.exists) {
      sendNewOrderAlert(updatedOrder, ownerDoc.data().email).catch((err) =>
        console.error("New order alert email failed:", err.message)
      );
    }

    // Create notification for customer
    const notificationId = uuidv4();
    await db.collection("Notifications").doc(notificationId).set({
      notificationId,
      userId: order.customerId,
      title: "Payment Successful! 🎉",
      message: `Your order from ${order.restaurantName} is confirmed. ${etaMessage}`,
      type: "order_update",
      isRead: false,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      data: {
        orderId,
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
        estimatedDeliveryMinutes: etaResult.etaMinutes,
        etaMessage,
        order: updatedOrder,
      },
    });
  } catch (err) {
    console.error("❌ Verify payment error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed.",
    });
  }
};

// ===================================================
// GET PAYMENT DETAILS
// GET /api/payments/:razorpayPaymentId
// Admin or customer (own order)
// ===================================================

const getPaymentDetails = async (req, res) => {
  try {
    const { razorpayPaymentId } = req.params;

    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    return res.status(200).json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount / 100, // Convert paise to INR
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: new Date(payment.created_at * 1000),
      },
    });
  } catch (err) {
    console.error("❌ Get payment details error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment details.",
    });
  }
};

// ===================================================
// REFUND PAYMENT
// POST /api/payments/refund
// Admin only
// ===================================================

const refundPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, orderId, amount, reason } = req.body;

    if (!razorpayPaymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and Order ID are required.",
      });
    }

    const orderDoc = await db.collection("Orders").doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Create refund via Razorpay
    const refundAmount = amount
      ? Math.round(parseFloat(amount) * 100)
      : Math.round(order.totalAmount * 100);

    const refund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: refundAmount,
      notes: {
        reason: reason || "Refund requested by admin",
        orderId,
      },
    });

    // Update order payment status
    await db.collection("Orders").doc(orderId).update({
      paymentStatus: "refunded",
      refundId: refund.id,
      refundedAt: new Date(),
      refundAmount: refundAmount / 100,
      updatedAt: new Date(),
    });

    // Notify customer
    const notificationId = uuidv4();
    await db.collection("Notifications").doc(notificationId).set({
      notificationId,
      userId: order.customerId,
      title: "Refund Initiated 💰",
      message: `Your refund of ₹${refundAmount / 100} for order #${orderId.slice(-8).toUpperCase()} has been initiated.`,
      type: "order_update",
      isRead: false,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Refund initiated successfully!",
      data: {
        refundId: refund.id,
        amount: refundAmount / 100,
        status: refund.status,
      },
    });
  } catch (err) {
    console.error("❌ Refund payment error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate refund.",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  refundPayment,
};
