// ===================================================
// DISHDROP — Cron Jobs
// server/jobs/cronJobs.js
// ===================================================

const cron = require("node-cron");
const { db } = require("../firebase");
const { runRestaurantFlagCheck, runAgentFlagCheck } = require("../services/flagEngine");
const { sendBroadcastEmail } = require("../services/emailService");

// ===================================================
// JOB 1: RESTAURANT FLAG CHECK
// Runs every hour: '0 * * * *'
// Checks all restaurants and updates flag status
// ===================================================

const startRestaurantFlagJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ [CRON] Restaurant flag check started:", new Date().toISOString());
    try {
      await runRestaurantFlagCheck();
      console.log("✅ [CRON] Restaurant flag check completed.");
    } catch (err) {
      console.error("❌ [CRON] Restaurant flag check failed:", err.message);
    }
  });

  console.log("📋 Restaurant flag check cron scheduled (every hour)");
};

// ===================================================
// JOB 2: AGENT FLAG CHECK
// Runs every 30 minutes: '*/30 * * * *'
// Checks all delivery agents and updates flag status
// ===================================================

const startAgentFlagJob = () => {
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ [CRON] Agent flag check started:", new Date().toISOString());
    try {
      await runAgentFlagCheck();
      console.log("✅ [CRON] Agent flag check completed.");
    } catch (err) {
      console.error("❌ [CRON] Agent flag check failed:", err.message);
    }
  });

  console.log("📋 Agent flag check cron scheduled (every 30 minutes)");
};

// ===================================================
// JOB 3: EXPIRE COUPONS
// Runs every day at midnight: '0 0 * * *'
// Deactivates expired coupons in Firestore
// ===================================================

const startCouponExpiryJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [CRON] Coupon expiry check started:", new Date().toISOString());
    try {
      const now = new Date();

      // Find all active coupons that have expired
      const expiredCouponsSnap = await db
        .collection("Coupons")
        .where("isActive", "==", true)
        .where("expiresAt", "<=", now)
        .get();

      if (expiredCouponsSnap.empty) {
        console.log("ℹ️ [CRON] No expired coupons found.");
        return;
      }

      // Batch update for efficiency
      const batch = db.batch();
      expiredCouponsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();

      console.log(
        `✅ [CRON] Deactivated ${expiredCouponsSnap.size} expired coupons.`
      );
    } catch (err) {
      console.error("❌ [CRON] Coupon expiry check failed:", err.message);
    }
  });

  console.log("📋 Coupon expiry cron scheduled (daily at midnight)");
};

// ===================================================
// JOB 4: AUTO-CLOSE STALE ORDERS
// Runs every 2 hours: '0 */2 * * *'
// Cancels orders stuck in 'placed' for over 30 mins
// (restaurant likely offline or missed the order)
// ===================================================

const startStaleOrderJob = () => {
  cron.schedule("0 */2 * * *", async () => {
    console.log("⏰ [CRON] Stale order check started:", new Date().toISOString());
    try {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

      const staleOrdersSnap = await db
        .collection("Orders")
        .where("status", "==", "placed")
        .where("placedAt", "<=", thirtyMinsAgo)
        .get();

      if (staleOrdersSnap.empty) {
        console.log("ℹ️ [CRON] No stale orders found.");
        return;
      }

      const batch = db.batch();
      staleOrdersSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "cancelled",
          cancelledReason: "Auto-cancelled: Restaurant did not confirm in time.",
          cancelledAt: new Date(),
        });
      });

      await batch.commit();

      console.log(
        `✅ [CRON] Auto-cancelled ${staleOrdersSnap.size} stale orders.`
      );
    } catch (err) {
      console.error("❌ [CRON] Stale order check failed:", err.message);
    }
  });

  console.log("📋 Stale order check cron scheduled (every 2 hours)");
};

// ===================================================
// JOB 5: RESTAURANT OPEN/CLOSE STATUS
// Runs every 15 minutes: '*/15 * * * *'
// Auto-opens/closes restaurants based on their
// opening and closing times
// ===================================================

const startRestaurantStatusJob = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      const restaurantsSnap = await db
        .collection("Restaurants")
        .where("isApproved", "==", true)
        .get();

      if (restaurantsSnap.empty) return;

      const batch = db.batch();
      let updateCount = 0;

      restaurantsSnap.docs.forEach((doc) => {
        const restaurant = doc.data();
        const { openingTime, closingTime } = restaurant;

        if (!openingTime || !closingTime) return;

        // Determine if restaurant should be open
        let shouldBeOpen;

        // Handle overnight hours (e.g. 22:00 - 02:00)
        if (openingTime > closingTime) {
          shouldBeOpen =
            currentTime >= openingTime || currentTime < closingTime;
        } else {
          shouldBeOpen =
            currentTime >= openingTime && currentTime < closingTime;
        }

        // Only update if status needs to change
        if (restaurant.isOpen !== shouldBeOpen) {
          batch.update(doc.ref, { isOpen: shouldBeOpen });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(
          `✅ [CRON] Updated open/close status for ${updateCount} restaurants.`
        );
      }
    } catch (err) {
      console.error("❌ [CRON] Restaurant status job failed:", err.message);
    }
  });

  console.log("📋 Restaurant status cron scheduled (every 15 minutes)");
};

// ===================================================
// JOB 6: DAILY STATS SNAPSHOT
// Runs every day at 11:59 PM: '59 23 * * *'
// Saves daily platform stats to Firestore for
// admin analytics and revenue tracking
// ===================================================

const startDailyStatsJob = () => {
  cron.schedule("59 23 * * *", async () => {
    console.log("⏰ [CRON] Daily stats snapshot started:", new Date().toISOString());
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Fetch today's delivered orders
      const ordersSnap = await db
        .collection("Orders")
        .where("status", "==", "delivered")
        .where("placedAt", ">=", startOfDay)
        .where("placedAt", "<=", endOfDay)
        .get();

      const orders = ordersSnap.docs.map((doc) => doc.data());

      const totalRevenue = orders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );
      const totalOrders = orders.length;
      const avgOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Platform commission (10% of revenue)
      const platformCommission = totalRevenue * 0.1;

      // Save daily snapshot
      const dateKey = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      await db
        .collection("DailyStats")
        .doc(dateKey)
        .set({
          date: dateKey,
          totalOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          platformCommission: Math.round(platformCommission * 100) / 100,
          createdAt: new Date(),
        });

      console.log(
        `✅ [CRON] Daily stats saved: ${totalOrders} orders, ₹${totalRevenue.toFixed(2)} revenue`
      );
    } catch (err) {
      console.error("❌ [CRON] Daily stats snapshot failed:", err.message);
    }
  });

  console.log("📋 Daily stats cron scheduled (daily at 11:59 PM)");
};

// ===================================================
// JOB 7: CLEANUP OLD NOTIFICATIONS
// Runs every Sunday at 3 AM: '0 3 * * 0'
// Deletes read notifications older than 30 days
// ===================================================

const startNotificationCleanupJob = () => {
  cron.schedule("0 3 * * 0", async () => {
    console.log("⏰ [CRON] Notification cleanup started:", new Date().toISOString());
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      );

      const oldNotificationsSnap = await db
        .collection("Notifications")
        .where("isRead", "==", true)
        .where("createdAt", "<=", thirtyDaysAgo)
        .get();

      if (oldNotificationsSnap.empty) {
        console.log("ℹ️ [CRON] No old notifications to clean up.");
        return;
      }

      // Delete in batches of 500 (Firestore batch limit)
      const batchSize = 500;
      const docs = oldNotificationsSnap.docs;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        docs.slice(i, i + batchSize).forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      console.log(
        `✅ [CRON] Deleted ${oldNotificationsSnap.size} old notifications.`
      );
    } catch (err) {
      console.error("❌ [CRON] Notification cleanup failed:", err.message);
    }
  });

  console.log("📋 Notification cleanup cron scheduled (every Sunday at 3 AM)");
};

// ===================================================
// INIT ALL CRON JOBS
// Called once from server/index.js on startup
// ===================================================

const initCronJobs = () => {
  console.log("⏰ Initializing DishDrop cron jobs...");

  startRestaurantFlagJob();
  startAgentFlagJob();
  startCouponExpiryJob();
  startStaleOrderJob();
  startRestaurantStatusJob();
  startDailyStatsJob();
  startNotificationCleanupJob();

  console.log("✅ All cron jobs initialized successfully!");
};

module.exports = { initCronJobs };