import React from "react";
import { db, auth } from "../../../configs/firebase";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

export default function SendPushNotifications({ req, setRequests }) {
  const acceptRequest = async () => {
    console.log("Accept button clicked for request:", req.id);
    try {
      // 1. Mark the request as accepted in Firestore
      await setDoc(doc(db, "deliveryRequests", req.id), {
        ...req,
        isAccepted: true,
      });

      // 2. Remove accepted request from UI
      setRequests((prev) => prev.filter((r) => r.id !== req.id));

      // 3. Get business admin ID (current user)
      const businessId = auth.currentUser?.uid;

      // 4. Fetch business admin data to get the businessName
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : null;
      const businessName = businessData?.businessName || "Your Business";

      console.log("Creating Firestore notification for farmer:", req.farmerId);
      // 4. Create a notification document in Firestore
      // Create a new doc reference to get the generated ID
      const notifRef = doc(collection(db, "notifications")); // creates a new unique doc reference
      const notificationId = notifRef.id;

      const message = `Your delivery request has been accepted, the hauler is on your way ${businessData.businessName}`;
      // Write to Firestore with setDoc, including notificationId in the data
      await setDoc(notifRef, {
        notificationId, // ✅ include the same ID inside the document
        farmerId: req.farmerId,
        title: businessName,
        message: message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send optional push notification
      const farmerRef = doc(db, "users", req.farmerId);
      const farmerDoc = await getDoc(farmerRef);
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;

      if (farmerData?.playerIds?.length) {
        await sendPushNotification(farmerData.playerIds, businessName, message);
      } else {
        console.warn("No playerIds found for farmer:", req.farmerId);
      }
    } catch (err) {
      console.error("Failed to accept request or send notification:", err);
    }
  };

  const sendPushNotification = async (playerIds, title, message) => {
    try {
      const response = await fetch(
        "https://onesignal.com/api/v1/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "os_v2_app_jzlhh64njvhonitip6vz2oil46g64bdagwdumafaqquyisuuucapph6jnfwofmjcs3oaauutfhxzdq6sbyu72jgbiktprkewj5uty5y", // Replace with your real key
          },
          body: JSON.stringify({
            app_id: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
            include_player_ids: playerIds,
            headings: { en: title },
            contents: {
              en: message,
            },
            data: {
              openTarget: "NotificationActivity",
            },
          }),
        }
      );

      const result = await response.json();
      console.log("Notification sent:", result);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  };

  return (
    <button
      className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#163b22] transition"
      onClick={acceptRequest}
    >
      Assign
    </button>
  );
}
