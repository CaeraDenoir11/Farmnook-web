// === AcceptRequestModal.jsx ===
// Modal for assigning a hauler to a delivery request.
// After assigning, updates Firestore, sends notification, and updates UI.

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../configs/firebase";
import { Timestamp } from "firebase/firestore";
import defaultImg from "../../assets/images/default.png";

export default function AcceptRequestModal({ isOpen, onClose, onAssign, req, setRequests }) {
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
      where("businessAdminId", "==", currentUser.uid),
      where("userType", "==", "Hauler")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const haulerList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHaulers(haulerList);
    });
    return () => unsub();
  }, [currentUser]);

  const sendPushNotification = async (playerIds, title, message) => {
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic os_v2_app_jzlhh64njvhonitip6vz2oil46g64bdagwdumafaqquyisuuucapph6jnfwofmjcs3oaauutfhxzdq6sbyu72jgbiktprkewj5uty5y",
      },
      body: JSON.stringify({
        app_id: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        data: { openTarget: "NotificationActivity" },
      }),
    });
  };

  const sendAssignmentNotification = async (req, hauler) => {
    const businessId = currentUser.uid;
    const businessDoc = await getDoc(doc(db, "users", businessId));
    const businessData = businessDoc.exists() ? businessDoc.data() : {};
    const businessName = businessData.businessName || "Your Business";
    const notifRef = doc(collection(db, "notifications"));
    const message = `Your delivery request has been accepted. A hauler from ${businessName} is on the way!`;
    await setDoc(notifRef, {
      notificationId: notifRef.id,
      farmerId: req.farmerId,
      title: businessName,
      message,
      timestamp: Timestamp.now(),
      isRead: false,
    });
    const farmerDoc = await getDoc(doc(db, "users", req.farmerId));
    const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;
    if (farmerData?.playerIds?.length) {
      await sendPushNotification(farmerData.playerIds, businessName, message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
      <div className="relative bg-[#F5EFE6] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#1A4D2E] text-xl font-bold">×</button>
        <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">Assign a Hauler</h2>
        {successMessage && <div className="bg-green-100 text-green-700 text-sm px-4 py-2 mb-4 rounded-lg text-center">{successMessage}</div>}
        <div className="overflow-y-auto max-h-[65vh] pr-1 custom-scroll">
          {haulers.length === 0 ? (
            <p className="text-gray-400 text-center text-sm">No haulers found.</p>
          ) : (
            <div className="space-y-4">
              {haulers.map((hauler) => (
                <div key={hauler.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-white rounded-xl border border-[#1A4D2E] shadow">
                  <div className="flex items-center gap-4">
                    <img src={hauler.profileImageUrl || defaultImg} alt="Hauler" className="w-10 h-10 rounded-full border-2 border-[#1A4D2E]" />
                    <span className="text-[#1A4D2E] font-medium">{hauler.firstName} {hauler.lastName}</span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        setLoadingHaulerId(hauler.id);
                        await updateDoc(doc(db, "deliveryRequests", req.id), { isAccepted: true });
                        await addDoc(collection(db, "deliveries"), {
                          requestId: req.id,
                          haulerAssignedId: hauler.id,
                          createdAt: new Date(),
                        });
                        await sendAssignmentNotification(req, hauler);
                        setRequests((prev) => prev.filter((item) => item.id !== req.id));
                        onAssign?.(hauler);
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
                    }}
                    className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#145C38] transition-all disabled:opacity-60"
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


