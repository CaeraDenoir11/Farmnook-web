// === AcceptRequestModal.jsx ===
// Modal for assigning a hauler to a delivery request.
// Now handles Firestore update, delivery creation, and OneSignal push notification to the Android phone.

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../configs/firebase";
import defaultImg from "../../assets/images/default.png";
import { sendPushNotification } from "../../utils/SendPushNotification.jsx";

export default function AcceptRequestModal({
  isOpen,
  onClose,
  onAssign,
  req,
  setRequests,
}) {
  const [haulers, setHaulers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingHaulerId, setLoadingHaulerId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users"),
      where("businessId", "==", currentUser.uid),
      where("userType", "==", "Hauler")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const haulerList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Fetch the current admin's profile and add to list
      const adminDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const adminAsHauler = {
          id: currentUser.uid,
          ...adminData,
        };

        // Only add if not already in haulerList
        const combined = [
          adminAsHauler,
          ...haulerList.filter((h) => h.id !== currentUser.uid),
        ];
        setHaulers(combined);
      } else {
        setHaulers(haulerList);
      }
    });

    return () => unsub();
  }, [currentUser]);

  const handleAssign = async (hauler) => {
    try {
      setLoadingHaulerId(hauler.id);

      // 1. Mark request as accepted
      await updateDoc(doc(db, "deliveryRequests", req.id), {
        isAccepted: true,
      });

      // 2. Add to deliveries collection
      const docRef = await addDoc(collection(db, "deliveries"), {
        requestId: req.id,
        haulerAssignedId: hauler.id,
        vehicleId: req.vehicleId,
        createdAt: new Date(),
        isStarted: false,
        arrivedAtPickup: false,
        isOnDelivery: false,
        arrivedAtDestination: false,
        isDone: false,
        isValidated: false,
        farmerId: req.farmerId,
        scheduledTime: req.scheduledTime,
      });
      await updateDoc(docRef, {
        deliveryId: docRef.id,
      });

      // 3. Update UI
      setRequests((prev) => prev.filter((item) => item.id !== req.id));
      onAssign?.(hauler);

      // 4. Create Firestore notification
      const businessId = currentUser.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const businessName = businessData?.businessName || "Your Business";
      const message = `Your delivery request has been accepted by ${businessName}`;

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: req.farmerId,
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send OneSignal push
      const farmerDoc = await getDoc(doc(db, "users", req.farmerId));
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;
      const validPlayerIds = (farmerData?.playerIds || []).filter(
        (id) => typeof id === "string" && id.length >= 10
      );
      if (validPlayerIds.length) {
        await sendPushNotification(validPlayerIds, businessName, message, {
          openTarget: "FarmerDashboardFragment", // ✅ match this string in ApplicationClass
          farmerId: req.farmerId,
        });
      } else {
        console.warn("No valid playerIds found for farmer:", req.farmerId);
      }

      // 6. ✅ Notify the assigned hauler
      const haulerDoc = await getDoc(doc(db, "users", hauler.id));
      const haulerData = haulerDoc.exists() ? haulerDoc.data() : null;

      const haulerMessage = "You have been assigned to a delivery.";

      if (haulerData) {
        // Firestore notification for hauler
        const haulerNotifRef = doc(collection(db, "notifications"));
        await setDoc(haulerNotifRef, {
          notificationId: haulerNotifRef.id,
          recipientId: hauler.id,
          title: "New Delivery Assignment",
          message: haulerMessage,
          timestamp: Timestamp.now(),
          isRead: false,
        });

        const haulerPlayerIds = (haulerData.playerIds || []).filter(
          (id) => typeof id === "string" && id.length >= 10
        );

        if (haulerPlayerIds.length) {
          await sendPushNotification(
            haulerPlayerIds,
            "New Delivery Assignment",
            haulerMessage,
            {
              openTarget: "HaulerDashboardFragment",
              haulerId: hauler.id,
            }
          );
        } else {
          console.warn("No valid playerIds found for hauler:", hauler.id);
        }
      }
      // 7. Show success
      setSuccessMessage("Successfully assigned hauler!");
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error assigning hauler:", err);
    } finally {
      setLoadingHaulerId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
      <div className="relative bg-[#F5EFE6] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#1A4D2E] text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
          Assign a Hauler
        </h2>
        {successMessage && (
          <div className="bg-green-100 text-green-700 text-sm px-4 py-2 mb-4 rounded-lg text-center">
            {successMessage}
          </div>
        )}
        <div className="overflow-y-auto max-h-[65vh] pr-1 custom-scroll">
          {haulers.length === 0 ? (
            <p className="text-gray-400 text-center text-sm">
              No haulers found.
            </p>
          ) : (
            <div className="space-y-4">
              {haulers.map((hauler) => (
                <div
                  key={hauler.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-white rounded-xl border border-[#1A4D2E] shadow"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={hauler.profileImageUrl || defaultImg}
                      alt="Hauler"
                      className="w-10 h-10 rounded-full border-2 border-[#1A4D2E]"
                    />
                    <span className="text-[#1A4D2E] font-medium">
                      {hauler.firstName} {hauler.lastName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssign(hauler)}
                    className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#145C38] transition-all disabled:opacity-50"
                    disabled={loadingHaulerId !== null}
                  >
                    {loadingHaulerId === hauler.id ? "Assigning..." : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
