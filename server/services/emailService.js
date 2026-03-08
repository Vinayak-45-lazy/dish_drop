// ===================================================
// DISHDROP — Email Service (Nodemailer + Gmail SMTP)
// server/services/emailService.js
// ===================================================

const nodemailer = require("nodemailer");
require("dotenv").config();

// ===================================================
// TRANSPORTER CONFIGURATION
// Gmail SMTP with App Password
// ===================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter error:", err.message);
  } else {
    console.log("✅ Email service ready");
  }
});

// ===================================================
// BASE EMAIL TEMPLATE
// Shared HTML wrapper for all emails
// ===================================================

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DishDrop</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif;
           background: #F8F8F8; color: #1A1A1A; }
    .wrapper { max-width: 600px; margin: 30px auto; background: #ffffff;
               border-radius: 16px; overflow: hidden;
               box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #FF4500; padding: 24px 32px;
              text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px;
                 letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.85);
                font-size: 14px; }
    .body { padding: 32px; }
    .footer { background: #F8F8F8; padding: 20px 32px;
              text-align: center; font-size: 12px; color: #888; }
    .btn { display: inline-block; background: #FF4500; color: #ffffff;
           padding: 12px 28px; border-radius: 8px; text-decoration: none;
           font-weight: 600; margin: 16px 0; }
    .badge { display: inline-block; background: #FFC300; color: #1A1A1A;
             padding: 4px 12px; border-radius: 20px; font-size: 13px;
             font-weight: 600; }
    .badge-green { background: #00A651; color: #ffffff; }
    .badge-red { background: #FF4500; color: #ffffff; }
    .divider { border: none; border-top: 1px solid #F0F0F0; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between;
                  padding: 8px 0; border-bottom: 1px solid #F8F8F8; }
    .total-row { display: flex; justify-content: space-between;
                 padding: 12px 0; font-weight: 700; font-size: 16px; }
    h2 { color: #FF4500; margin-top: 0; }
    .info-box { background: #F8F8F8; border-radius: 10px;
                padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🍽️ DishDrop</h1>
      <p>Fresh. Fast. Delivered.</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} DishDrop. All rights reserved.</p>
      <p>You received this email because you have an account on DishDrop.</p>
    </div>
  </div>
</body>
</html>
`;

// ===================================================
// 1. ORDER CONFIRMATION EMAIL (to customer)
// ===================================================

const sendOrderConfirmation = async (order) => {
  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <div class="order-item">
          <span>${item.name} × ${item.quantity}</span>
          <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
      )
      .join("");

    const content = `
      <h2>Order Confirmed! 🎉</h2>
      <p>Hi <strong>${order.customerName}</strong>, your order has been placed successfully!</p>

      <div class="info-box">
        <p><strong>Order ID:</strong> #${order.orderId.slice(-8).toUpperCase()}</p>
        <p><strong>Restaurant:</strong> ${order.restaurantName}</p>
        <p><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryMinutes} minutes</p>
        <p><strong>Payment ID:</strong> ${order.paymentId}</p>
      </div>

      <h3>Order Summary</h3>
      ${itemsHtml}
      <hr class="divider"/>
      <div class="order-item">
        <span>Subtotal</span><span>₹${order.subtotal.toFixed(2)}</span>
      </div>
      <div class="order-item">
        <span>Delivery Fee</span><span>₹${order.deliveryFee.toFixed(2)}</span>
      </div>
      ${
        order.discount > 0
          ? `<div class="order-item">
              <span>Discount (${order.couponCode})</span>
              <span style="color:#00A651">-₹${order.discount.toFixed(2)}</span>
             </div>`
          : ""
      }
      <div class="total-row">
        <span>Total Paid</span><span style="color:#FF4500">₹${order.totalAmount.toFixed(2)}</span>
      </div>

      <div class="info-box">
        <p><strong>Delivery Address:</strong><br/>${order.deliveryAddress.fullAddress}</p>
        ${order.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.specialInstructions}</p>` : ""}
      </div>

      <p>You can track your order live in the DishDrop app! 🗺️</p>
    `;

    await transporter.sendMail({
      from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmed! #${order.orderId.slice(-8).toUpperCase()} — DishDrop`,
      html: baseTemplate(content),
    });

    console.log(`✅ Order confirmation email sent to ${order.customerEmail}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Order confirmation email error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// 2. NEW ORDER ALERT EMAIL (to restaurant owner)
// ===================================================

const sendNewOrderAlert = async (order, ownerEmail) => {
  try {
    const itemsHtml = order.items
      .map(
        (item) => `
        <div class="order-item">
          <span>${item.name} × ${item.quantity}</span>
          <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>`
      )
      .join("");

    const content = `
      <h2>New Order Received! 🔔</h2>
      <p>You have a new order on <strong>DishDrop</strong>. Please confirm it as soon as possible!</p>

      <div class="info-box">
        <p><strong>Order ID:</strong> #${order.orderId.slice(-8).toUpperCase()}</p>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Placed At:</strong> ${new Date(order.placedAt).toLocaleString("en-IN")}</p>
      </div>

      <h3>Items Ordered</h3>
      ${itemsHtml}
      <hr class="divider"/>
      <div class="total-row">
        <span>Order Total</span>
        <span style="color:#FF4500">₹${order.totalAmount.toFixed(2)}</span>
      </div>

      ${order.specialInstructions
        ? `<div class="info-box">
            <p><strong>⚠️ Special Instructions:</strong> ${order.specialInstructions}</p>
           </div>`
        : ""}

      <p>Login to your DishDrop Restaurant Dashboard to confirm and manage this order.</p>
    `;

    await transporter.sendMail({
      from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Order #${order.orderId.slice(-8).toUpperCase()} — DishDrop`,
      html: baseTemplate(content),
    });

    console.log(`✅ New order alert sent to restaurant: ${ownerEmail}`);
    return { success: true };
  } catch (err) {
    console.error("❌ New order alert email error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// 3. ORDER STATUS UPDATE EMAIL (to customer)
// ===================================================

const sendOrderStatusUpdate = async (order, customerEmail, newStatus) => {
  try {
    const statusMessages = {
      confirmed: { emoji: "✅", text: "Your order has been confirmed by the restaurant!" },
      preparing: { emoji: "👨‍🍳", text: "The restaurant is now preparing your food!" },
      readyForPickup: { emoji: "📦", text: "Your order is packed and ready for pickup!" },
      pickedUp: { emoji: "🛵", text: "Your order is on the way!" },
      delivered: { emoji: "🎉", text: "Your order has been delivered. Enjoy your meal!" },
      cancelled: { emoji: "❌", text: "Your order has been cancelled." },
    };

    const statusInfo = statusMessages[newStatus] || {
      emoji: "📋",
      text: "Your order status has been updated.",
    };

    const content = `
      <h2>${statusInfo.emoji} Order Update</h2>
      <p>Hi <strong>${order.customerName}</strong>,</p>
      <p style="font-size:16px">${statusInfo.text}</p>

      <div class="info-box">
        <p><strong>Order ID:</strong> #${order.orderId.slice(-8).toUpperCase()}</p>
        <p><strong>Restaurant:</strong> ${order.restaurantName}</p>
        <p><strong>Status:</strong> <span class="badge ${
          newStatus === "delivered" ? "badge-green" : newStatus === "cancelled" ? "badge-red" : ""
        }">${newStatus.toUpperCase()}</span></p>
      </div>

      ${
        newStatus === "delivered"
          ? `<p>We hope you enjoyed your meal! 🍕 Don't forget to rate your experience in the app.</p>`
          : newStatus === "pickedUp"
          ? `<p>Track your delivery agent live on the map in the DishDrop app! 🗺️</p>`
          : ""
      }
    `;

    await transporter.sendMail({
      from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: `${statusInfo.emoji} Order ${newStatus} — DishDrop`,
      html: baseTemplate(content),
    });

    console.log(`✅ Status update email sent: ${newStatus} → ${customerEmail}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Status update email error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// 4. FLAG ALERT EMAIL (to admin)
// ===================================================

const sendFlagAlert = async (entityType, entityName, entityId, flagScore, reasons) => {
  try {
    const content = `
      <h2>⚠️ Flag Alert — ${entityType}</h2>
      <p>A ${entityType.toLowerCase()} has been automatically flagged by DishDrop's monitoring system.</p>

      <div class="info-box">
        <p><strong>Name:</strong> ${entityName}</p>
        <p><strong>ID:</strong> ${entityId}</p>
        <p><strong>Flag Score:</strong> <span class="badge badge-red">${flagScore}/100</span></p>
      </div>

      <h3>Reasons Flagged:</h3>
      <ul>
        ${reasons.map((r) => `<li>${r}</li>`).join("")}
      </ul>

      <p>Please review this ${entityType.toLowerCase()} in the Admin Dashboard and take appropriate action.</p>
    `;

    await transporter.sendMail({
      from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Flag Alert: ${entityType} — ${entityName} | DishDrop`,
      html: baseTemplate(content),
    });

    console.log(`✅ Flag alert sent to admin for ${entityType}: ${entityName}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Flag alert email error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// 5. BROADCAST EMAIL (admin to all users)
// ===================================================

const sendBroadcastEmail = async (recipientEmails, subject, message) => {
  try {
    const content = `
      <h2>📢 Message from DishDrop</h2>
      <p>${message.replace(/\n/g, "<br/>")}</p>
      <hr class="divider"/>
      <p style="color:#888; font-size:13px">
        This is a broadcast message from DishDrop Admin.
      </p>
    `;

    // Send in batches of 50 to avoid Gmail limits
    const batchSize = 50;
    let successCount = 0;

    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const batch = recipientEmails.slice(i, i + batchSize);

      await transporter.sendMail({
        from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
        bcc: batch.join(","),
        subject: `📢 ${subject} — DishDrop`,
        html: baseTemplate(content),
      });

      successCount += batch.length;

      // Small delay between batches
      if (i + batchSize < recipientEmails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Broadcast email sent to ${successCount} recipients`);
    return { success: true, sent: successCount };
  } catch (err) {
    console.error("❌ Broadcast email error:", err.message);
    return { success: false, message: err.message };
  }
};

// ===================================================
// 6. WELCOME EMAIL (to new user)
// ===================================================

const sendWelcomeEmail = async (user) => {
  try {
    const content = `
      <h2>Welcome to DishDrop! 🎉</h2>
      <p>Hi <strong>${user.name}</strong>, we're thrilled to have you on board!</p>
      <p>With DishDrop, you can:</p>
      <ul>
        <li>🍕 Browse hundreds of restaurants near you</li>
        <li>⚡ Get food delivered in 30 minutes or less</li>
        <li>🤖 Use AI-powered smart search to find exactly what you crave</li>
        <li>💳 Pay securely with Razorpay</li>
        <li>🗺️ Track your delivery live on the map</li>
      </ul>

      <div class="info-box">
        <p><strong>Your Account:</strong></p>
        <p>Email: ${user.email}</p>
        <p>Role: ${user.role.replace("_", " ").toUpperCase()}</p>
      </div>

      <p style="text-align:center">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}" class="btn">
          Start Ordering 🍽️
        </a>
      </p>

      <p>Fresh. Fast. Delivered. — That's the DishDrop promise. 🚀</p>
    `;

    await transporter.sendMail({
      from: `"DishDrop 🍽️" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: `Welcome to DishDrop, ${user.name}! 🍽️`,
      html: baseTemplate(content),
    });

    console.log(`✅ Welcome email sent to ${user.email}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Welcome email error:", err.message);
    return { success: false, message: err.message };
  }
};

module.exports = {
  sendOrderConfirmation,
  sendNewOrderAlert,
  sendOrderStatusUpdate,
  sendFlagAlert,
  sendBroadcastEmail,
  sendWelcomeEmail,
};