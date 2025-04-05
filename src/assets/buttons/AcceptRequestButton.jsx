import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../configs/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import defaultImg from "../../assets/images/default.png";
import Modal from "react-modal";

export default function AcceptRequestButton({ isOpen, onClose }) {
  const [haulers, setHaulers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

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
      const haulerList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHaulers(haulerList);
    });

    return () => unsub();
  }, [currentUser]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Select Hauler"
      className="bg-white rounded-2xl shadow-lg max-w-lg mx-auto mt-20 p-6 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50"
    >
      <h2 className="text-xl font-bold text-[#1A4D2E] mb-4">Select a Hauler</h2>

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
    </Modal>
  );
}
