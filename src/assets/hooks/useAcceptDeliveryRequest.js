import { db } from "../../../configs/firebase";
import { doc, setDoc, addDoc, getDoc, collection, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function useAcceptDeliveryRequest() {
    const acceptDeliveryRequest = async (req, haulerId, setRequests, onAssign) => {
        try {
            const auth = getAuth();
            const businessId = auth.currentUser.uid;

            // 1. Mark delivery request as accepted
            await setDoc(doc(db, "deliveryRequests", req.id), { ...req, isAccepted: true });

            // 2. Add to deliveries collection
            await addDoc(collection(db, "deliveries"), {
                requestId: req.id,
                haulerAssignedId: haulerId,
                createdAt: Timestamp.now(),
            });

            // 3. Update UI
            setRequests?.((prev) => prev.filter((item) => item.id !== req.id));
            onAssign?.();

            // 4. Firestore Notification
            const businessDoc = await getDoc(doc(db, "users", businessId));
            const businessName = businessDoc.data()?.businessName || "Your Business";
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

            // 5. Send OneSignal push notification
            const farmerDoc = await getDoc(doc(db, "users", req.farmerId));
            const playerIds = farmerDoc.data()?.playerIds || [];
            if (playerIds.length > 0) {
                await fetch("https://onesignal.com/api/v1/notifications", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Basic YOUR_ONESIGNAL_REST_API_KEY",
                    },
                    body: JSON.stringify({
                        app_id: "YOUR_APP_ID",
                        include_player_ids: playerIds,
                        headings: { en: businessName },
                        contents: { en: message },
                        data: { openTarget: "NotificationActivity" },
                    }),
                });
            }
        } catch (error) {
            console.error("Error accepting delivery request:", error);
            throw error;
        }
    };

    return { acceptDeliveryRequest };
}