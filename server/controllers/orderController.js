// ===================================================
// DISHDROP — Order Controller
// server/controllers/orderController.js
// ===================================================
const { randomUUID: uuidv4 } = require("crypto"); 
const { db } = require("../firebase");
const { calculateOrderETA, recordLateDelivery } = require("../services/etaService");
const { sendOrderStatusUpdate } = require("../services/emailService");


// ===================================================
// CREATE ORDER
// POST /api/orders
// Customer only — creates order after payment
// ===================================================

const createOrder = async (req, res) => {
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
      deliveryFee,
      totalAmount,
      paymentId,
    } = req.body;

    // Validate required fields
    if (
      !restaurantId ||
      !items ||
      !deliveryAddress ||
      !subtotal ||
      totalAmount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Restaurant, items, delivery address, and amounts are required.",
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item.",
      });
    }

    // Fetch restaurant details
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

    if (!restaurant.isOpen) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is currently closed.",
      });
    }

    if (!restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant is not approved for orders.",
      });
    }

    // Check minimum order amount
    if (subtotal < restaurant.minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${restaurant.minimumOrderAmount}.`,
      });
    }

    // Fetch customer details
    const customerDoc = await db.collection("Users").doc(uid).get();
    const customer = customerDoc.data();

    // Calculate ETA
    const etaResult = await calculateOrderETA(
      restaurantId,
      deliveryAddress.lat,
      deliveryAddress.lng
    );

    const orderId = uuidv4();
    const now = new Date();

    const order = {
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
      deliveryFee: parseFloat(deliveryFee || restaurant.deliveryFee || 0),
      discount: parseFloat(discount),
      totalAmount: parseFloat(totalAmount),
      couponCode: couponCode || "",
      paymentId: paymentId || "",
      paymentStatus: paymentId ? "paid" : "pending",
      status: "placed",
      deliveryAddress: {
        fullAddress: deliveryAddress.fullAddress,
        lat: parseFloat(deliveryAddress.lat),
        lng: parseFloat(deliveryAddress.lng),
      },
      specialInstructions: specialInstructions || "",
      estimatedDeliveryMinutes: etaResult.etaMinutes,
      distanceKm: etaResult.distanceKm,
      placedAt: now,
      confirmedAt: null,
      preparedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancelledReason: "",
    };

    await db.collection("Orders").doc(orderId).set(order);

    // Update restaurant total orders count
    await db
      .collection("Restaurants")
      .doc(restaurantId)
      .update({
        totalOrders: (restaurant.totalOrders || 0) + 1,
      });

    // Update menu item order counts
    const batch = db.batch();
    for (const item of items) {
      const itemRef = db.collection("MenuItems").doc(item.itemId);
      const itemDoc = await itemRef.get();
      if (itemDoc.exists) {
        batch.update(itemRef, {
          totalOrders: (itemDoc.data().totalOrders || 0) + item.quantity,
        });
      }
    }
    await batch.commit();

    // Create notification for customer
    await createNotification(uid, "Order Placed! 🎉", `Your order from ${restaurant.name} has been placed successfully.`, "order_update");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: order,
    });
  } catch (err) {
    console.error("❌ Create order error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to place order.",
    });
  }
};

// ===================================================
// GET ORDERS
// GET /api/orders
// Role-based: customer sees own, owner sees restaurant's,
// agent sees assigned, admin sees all
// ===================================================

const getOrders = async (req, res) => {
  try {
    const { uid, role } = req.user;
    const { status, limit = 20, page = 1 } = req.query;

    let query;

    if (role === "customer") {
      query = db
        .collection("Orders")
        .where("customerId", "==", uid)
        .orderBy("placedAt", "desc");
    } else if (role === "restaurant_owner") {
      // Get owner's restaurant first
      const restaurantSnap = await db
        .collection("Restaurants")
        .where("ownerId", "==", uid)
        .limit(1)
        .get();

      if (restaurantSnap.empty) {
        return res.status(200).json({
          success: true,
          data: [],
          total: 0,
        });
      }

      const restaurantId = restaurantSnap.docs[0].id;
      query = db
        .collection("Orders")
        .where("restaurantId", "==", restaurantId)
        .orderBy("placedAt", "desc");
    } else if (role === "delivery_agent") {
      const agentSnap = await db
        .collection("DeliveryAgentProfiles")
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (agentSnap.empty) {
        return res.status(200).json({
          success: true,
          data: [],
          total: 0,
        });
      }

      const agentId = agentSnap.docs[0].data().agentId;
      query = db
        .collection("Orders")
        .where("deliveryAgentId", "==", agentId)
        .orderBy("placedAt", "desc");
    } else if (role === "admin") {
      query = db
        .collection("Orders")
        .orderBy("placedAt", "desc");
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role.",
      });
    }

    const snapshot = await query.get();

    let orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by status if provided
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = orders.length;
    const paginated = orders.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return res.status(200).json({
      success: true,
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("❌ Get orders error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
};

// ===================================================
// GET ORDER BY ID
// GET /api/orders/:id
// ===================================================

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

    const orderDoc = await db.collection("Orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Authorization check
    if (role === "customer" && order.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this order.",
      });
    }

    if (role === "restaurant_owner") {
      const restaurantSnap = await db
        .collection("Restaurants")
        .where("ownerId", "==", uid)
        .limit(1)
        .get();

      if (
        restaurantSnap.empty ||
        order.restaurantId !== restaurantSnap.docs[0].id
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this order.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: { id: orderDoc.id, ...order },
    });
  } catch (err) {
    console.error("❌ Get order by ID error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};

// ===================================================
// UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// Restaurant owner and delivery agent update status
// ===================================================

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { uid, role } = req.user;

    const validStatuses = [
      "confirmed",
      "preparing",
      "readyForPickup",
      "pickedUp",
      "delivered",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const orderDoc = await db.collection("Orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Role-based status update permissions
    const restaurantStatuses = ["confirmed", "preparing", "readyForPickup"];
    const agentStatuses = ["pickedUp", "delivered"];

    if (role === "restaurant_owner") {
      const restaurantSnap = await db
        .collection("Restaurants")
        .where("ownerId", "==", uid)
        .limit(1)
        .get();

      if (
        restaurantSnap.empty ||
        order.restaurantId !== restaurantSnap.docs[0].id
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this order.",
        });
      }

      if (!restaurantStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Restaurants can only set: confirmed, preparing, readyForPickup.",
        });
      }
    }

    if (role === "delivery_agent") {
      const agentSnap = await db
        .collection("DeliveryAgentProfiles")
        .where("userId", "==", uid)
        .limit(1)
        .get();

      if (agentSnap.empty) {
        return res.status(403).json({
          success: false,
          message: "Agent profile not found.",
        });
      }

      const agentData = agentSnap.docs[0].data();

      if (order.deliveryAgentId !== agentData.agentId) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order.",
        });
      }

      if (!agentStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Agents can only set: pickedUp, delivered.",
        });
      }
    }

    // Build update object with timestamps
    const updates = {
      status,
      updatedAt: new Date(),
    };

    const now = new Date();

    if (status === "confirmed") updates.confirmedAt = now;
    if (status === "preparing") updates.preparedAt = now;
    if (status === "pickedUp") updates.pickedUpAt = now;
    if (status === "delivered") {
      updates.deliveredAt = now;

      // Check if delivery was late
      if (order.placedAt && order.estimatedDeliveryMinutes) {
        const placedAt = order.placedAt.toDate?.() || new Date(order.placedAt);
        const expectedDelivery = new Date(
          placedAt.getTime() + order.estimatedDeliveryMinutes * 60 * 1000
        );
        const isLate = now > expectedDelivery;

        if (isLate && order.deliveryAgentId) {
          await recordLateDelivery(order.deliveryAgentId, id);
        }
      }

      // Update agent stats
      if (order.deliveryAgentId) {
        const agentSnap = await db
          .collection("DeliveryAgentProfiles")
          .where("agentId", "==", order.deliveryAgentId)
          .limit(1)
          .get();

        if (!agentSnap.empty) {
          const agentData = agentSnap.docs[0].data();
          const agentEarnings = (order.deliveryFee || 0) * 0.8; // 80% commission

          await agentSnap.docs[0].ref.update({
            totalDeliveries: (agentData.totalDeliveries || 0) + 1,
            totalEarnings: (agentData.totalEarnings || 0) + agentEarnings,
            isAvailable: true,
          });
        }
      }
    }

    await db.collection("Orders").doc(id).update(updates);

    // Send status update email to customer (non-blocking)
    sendOrderStatusUpdate(order, order.customerEmail, status).catch((err) =>
      console.error("Status email failed:", err.message)
    );

    // Create notification for customer
    const statusMessages = {
      confirmed: "Your order has been confirmed! 👍",
      preparing: "Your food is being prepared! 👨‍🍳",
      readyForPickup: "Your order is ready for pickup! 📦",
      pickedUp: "Your order is on the way! 🛵",
      delivered: "Your order has been delivered! Enjoy! 🎉",
    };

    await createNotification(
      order.customerId,
      "Order Update",
      statusMessages[status] || "Your order status has been updated.",
      "order_update"
    );

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { orderId: id, status },
    });
  } catch (err) {
    console.error("❌ Update order status error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};

// ===================================================
// CANCEL ORDER
// PATCH /api/orders/:id/cancel
// Customer can cancel if order not yet picked up
// ===================================================

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;
    const { reason = "Cancelled by customer" } = req.body;

    const orderDoc = await db.collection("Orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    // Authorization
    if (role === "customer" && order.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this order.",
      });
    }

    // Can only cancel before pickup
    const cancellableStatuses = ["placed", "confirmed", "preparing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.status}' status. Order is already picked up.`,
      });
    }

    await db.collection("Orders").doc(id).update({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledReason: reason,
      updatedAt: new Date(),
    });

    // Notify customer
    await createNotification(
      order.customerId,
      "Order Cancelled ❌",
      `Your order from ${order.restaurantName} has been cancelled.`,
      "order_update"
    );

    // Send cancellation email
    sendOrderStatusUpdate(order, order.customerEmail, "cancelled").catch(
      (err) => console.error("Cancel email failed:", err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: { orderId: id, status: "cancelled" },
    });
  } catch (err) {
    console.error("❌ Cancel order error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order.",
    });
  }
};

// ===================================================
// ASSIGN DELIVERY AGENT
// PATCH /api/orders/:id/assign-agent
// Agent self-assigns to a readyForPickup order
// ===================================================

const assignDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (agentSnap.empty) {
      return res.status(404).json({
        success: false,
        message: "Agent profile not found.",
      });
    }

    const agentData = agentSnap.docs[0].data();

    if (!agentData.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "You are not available. Complete your current delivery first.",
      });
    }

    const orderDoc = await db.collection("Orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    if (order.status !== "readyForPickup") {
      return res.status(400).json({
        success: false,
        message: "Order is not ready for pickup yet.",
      });
    }

    if (order.deliveryAgentId) {
      return res.status(400).json({
        success: false,
        message: "Order already has a delivery agent assigned.",
      });
    }

    // Assign agent to order
    await db.collection("Orders").doc(id).update({
      deliveryAgentId: agentData.agentId,
      deliveryAgentName: agentData.name,
      updatedAt: new Date(),
    });

    // Mark agent as unavailable
    await agentSnap.docs[0].ref.update({
      isAvailable: false,
      lastActiveAt: new Date(),
    });

    // Notify customer
    await createNotification(
      order.customerId,
      "Agent Assigned! 🛵",
      `${agentData.name} will deliver your order from ${order.restaurantName}.`,
      "order_update"
    );

    return res.status(200).json({
      success: true,
      message: "Order assigned successfully!",
      data: {
        orderId: id,
        agentId: agentData.agentId,
        agentName: agentData.name,
      },
    });
  } catch (err) {
    console.error("❌ Assign agent error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to assign delivery agent.",
    });
  }
};

// ===================================================
// GET AGENT LOCATION FOR ORDER TRACKING
// GET /api/orders/:id/agent-location
// Customer only
// ===================================================

const getAgentLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const orderDoc = await db.collection("Orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const order = orderDoc.data();

    if (order.customerId !== uid) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!order.deliveryAgentId) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No agent assigned yet.",
      });
    }

    // Get agent's current location
    const agentSnap = await db
      .collection("DeliveryAgentProfiles")
      .where("agentId", "==", order.deliveryAgentId)
      .limit(1)
      .get();

    if (agentSnap.empty) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    const agent = agentSnap.docs[0].data();

    return res.status(200).json({
      success: true,
      data: {
        agentId: agent.agentId,
        agentName: agent.name,
        lat: agent.currentLat,
        lng: agent.currentLng,
        vehicleType: agent.vehicleType,
        lastActiveAt: agent.lastActiveAt,
      },
    });
  } catch (err) {
    console.error("❌ Get agent location error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get agent location.",
    });
  }
};

// ===================================================
// HELPER — CREATE NOTIFICATION
// Internal helper used by order controller
// ===================================================

const createNotification = async (userId, title, message, type) => {
  try {
    const notificationId = uuidv4();
    await db.collection("Notifications").doc(notificationId).set({
      notificationId,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("❌ Create notification error:", err.message);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  assignDeliveryAgent,
  getAgentLocation,
};
