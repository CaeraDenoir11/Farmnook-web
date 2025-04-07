import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../configs/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import defaultImg from "../../assets/images/default.png";

/**
 * AcceptRequestModal Component
 * - Displays a modal that allows assigning a hauler to a request.
 * - Fetches haulers tied to current authenticated business admin.
 *
 * Props:
 * @param {boolean} isOpen - Determines if modal is visible.
 * @param {Function} onClose - Callback to close the modal.
 * @param {Function} onAssign - Callback triggered when a hauler is assigned.
 * @param {Object} req - The selected delivery request.
 * @param {Function} setRequests - Function to update the delivery requests list.
 */
function AcceptRequestModal({ isOpen, onClose, onAssign, req, setRequests }) {
  const [haulers, setHaulers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingHaulerId, setLoadingHaulerId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // === Monitor auth state to track logged-in user ===
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // === Fetch haulers for the authenticated admin ===
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users"),
      where("businessAdminId", "==", currentUser.uid),
      where("userType", "==", "Hauler")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const haulerList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHaulers(haulerList);
    });

    return () => unsub();
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
      <div className="relative bg-[#F5EFE6] p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#1A4D2E] hover:text-[#145C38] text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
          Assign a Hauler
        </h2>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-green-100 text-green-700 text-sm px-4 py-2 mb-4 rounded-lg text-center">
            {successMessage}
          </div>
        )}

        {/* Hauler List */}
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
                    onClick={async () => {
                      try {
                        setLoadingHaulerId(hauler.id);

                        // 1. Update deliveryRequest
                        const requestRef = doc(db, "deliveryRequests", req.id);
                        await updateDoc(requestRef, { isAccepted: true });

                        // 2. Create new delivery entry
                        await addDoc(collection(db, "deliveries"), {
                          requestId: req.id,
                          haulerAssignedId: hauler.id,
                          createdAt: new Date(),
                        });

                        // 3. Update parent requests list
                        setRequests((prev) =>
                          prev.filter((item) => item.id !== req.id)
                        );

                        // 4. Optional external callback
                        onAssign?.(hauler);

                        // 5. Show alert
                        setSuccessMessage("Successfully assigned hauler!");

                        setTimeout(() => {
                          setSuccessMessage("");
                          setLoadingHaulerId(null);
                          onClose();
                        }, 2000); // enough time to view alert
                      } catch (error) {
                        console.error("Assignment failed:", error);
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

export default AcceptRequestModal;
