import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../configs/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import defaultImg from "../../assets/images/default.png";
import Modal from "react-modal";

export default function AcceptRequestButton({ isOpen, onClose }) {
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

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scroll">
        {haulers.length === 0 ? (
          <p className="text-gray-400 text-sm">No haulers found.</p>
        ) : (
          haulers.map((hauler) => (
            <div
              key={hauler.id}
              className="flex items-center justify-between p-3 bg-[#F5EFE6] rounded-lg shadow"
            >
              <div className="flex items-center gap-4">
                <img
                  src={hauler.profileImageUrl || defaultImg}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-[#1A4D2E]"
                />
                <span className="text-[#1A4D2E] font-medium">
                  {hauler.firstName} {hauler.lastName}
                </span>
              </div>
              <button
                className="bg-[#1A4D2E] text-white text-sm px-4 py-1 rounded-lg hover:bg-[#163b22] transition"
                onClick={() => {
                  // assign logic here later
                  console.log("Assign", hauler.id);
                }}
              >
                Assign
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="text-sm text-[#1A4D2E] hover:underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AcceptRequestModal;
