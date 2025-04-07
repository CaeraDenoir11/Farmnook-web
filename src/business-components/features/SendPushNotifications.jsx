import React, { useState } from "react";
import { db, auth } from "../../../configs/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";

export default function SendPushNotifications({
  req,
  hauler,
  setRequests,
  onAssign,
  onClose,
}) {
  const [loading, setLoading] = useState(false);

  const acceptRequest = async () => {
    setLoading(true);
    try {
      // 1. Mark the delivery request as accepted
      await setDoc(doc(db, "deliveryRequests", req.id), {
        ...req,
        isAccepted: true,
      });

      // 2. Add to 'deliveries' collection
      await addDoc(collection(db, "deliveries"), {
        requestId: req.id,
        haulerAssignedId: hauler.id,
        createdAt: new Date(),
      });

      // 3. Update UI
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      onAssign?.(hauler);

      // 4. Prepare notification
      const businessId = auth.currentUser?.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const businessName = businessData.businessName || "Your Business";
      const message = `Your delivery request has been accepted. A hauler from ${businessName} is on the way!`;

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        farmerId: req.farmerId,
        recipientId: req.farmerId,
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send push via OneSignal
      const farmerRef = doc(db, "users", req.farmerId);
      const farmerDoc = await getDoc(farmerRef);
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;

      if (farmerData?.playerIds?.length) {
        await sendPushNotification(farmerData.playerIds, businessName, message);
      } else {
        console.warn("No playerIds found for farmer:", req.farmerId);
      }

      // 6. Close modal after short delay
      setTimeout(() => {
        onClose?.();
      }, 1000);
    } catch (err) {
      console.error("Failed to assign or send notification:", err);
    } finally {
      setLoading(false);
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
        }
      );

      const result = await response.json();
      console.log("Push notification sent:", result);
      console.log("Sending to playerIds:", playerIds);
    } catch (error) {
      console.error("Push notification error:", error);
    }
  };

  return (
    <button
      className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#163b22] transition disabled:opacity-50"
      onClick={acceptRequest}
      disabled={loading}
    >
      {loading ? "Assigning..." : "Assign"}
    </button>
  );
}
