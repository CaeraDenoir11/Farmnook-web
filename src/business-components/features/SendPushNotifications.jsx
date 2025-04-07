import { db, auth } from "../../../configs/firebase";
import { doc, setDoc, getDoc, collection, Timestamp } from "firebase/firestore";

/**
 * Sends a Firestore and OneSignal push notification to a farmer when a request is accepted.
 * @param {Object} req - The delivery request object.
 * @param {string} haulerId - The assigned hauler's ID.
 */
export const notifyFarmerOnAcceptedRequest = async (req, haulerId) => {
  try {
    const businessId = auth.currentUser?.uid;

    // Get business name
    const businessDoc = await getDoc(doc(db, "users", businessId));
    const businessData = businessDoc.exists() ? businessDoc.data() : {};
    const businessName = businessData.businessName || "Your Business";

    // Compose notification
    const message = `Your delivery request has been accepted. A hauler from ${businessName} is on the way!`;
    const notifRef = doc(collection(db, "notifications"));

    await setDoc(notifRef, {
      notificationId: notifRef.id,
      farmerId: req.farmerId,
      title: businessName,
      message,
      timestamp: Timestamp.now(),
      isRead: false,
    });

    // Send push notification via OneSignal
    const farmerDoc = await getDoc(doc(db, "users", req.farmerId));
    const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;

    if (farmerData?.playerIds?.length) {
      await sendPushNotification(farmerData.playerIds, businessName, message);
    } else {
      console.warn("No playerIds found for farmer:", req.farmerId);
    }
  } catch (err) {
    console.error("Failed to send assignment notification:", err);
  }
};

/**
 * Sends a push notification using OneSignal.
 * @param {Array<string>} playerIds - The target OneSignal player IDs.
 * @param {string} title - Notification title.
 * @param {string} message - Notification message.
 */
const sendPushNotification = async (playerIds, title, message) => {
  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic os_v2_app_jzlhh64njvhonitip6vz2oil46g64bdagwdumafaqquyisuuucapph6jnfwofmjcs3oaauutfhxzdq6sbyu72jgbiktprkewj5uty5y",
      },
      body: JSON.stringify({
        app_id: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        data: {
          openTarget: "NotificationActivity",
        },
      }),
    });

    const result = await response.json();
    console.log("Push notification sent:", result);
  } catch (error) {
    console.error("OneSignal push error:", error);
  }
};
