import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../configs/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
 */
function AcceptRequestModal({ isOpen, onClose, onAssign }) {
  const [haulers, setHaulers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * Effect: Monitor auth state to track logged-in user
   */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  /**
   * Effect: Fetch haulers for the authenticated admin
   */
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#1A4D2E] hover:text-[#145C38] text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
          Assign a Hauler
        </h2>

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
                    onClick={() => onAssign?.(hauler)}
                    className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#145C38] transition-all"
                  >
                    Assign
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
