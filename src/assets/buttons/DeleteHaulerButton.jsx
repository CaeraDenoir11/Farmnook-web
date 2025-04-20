import { useState } from "react";
import { db } from "../../../configs/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export default function DeleteHaulerButton({ haulerId, onDelete }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            // Deleting the hauler document from Firestore
            const haulerDocRef = doc(db, "users", haulerId);
            await deleteDoc(haulerDocRef);

            onDelete(haulerId); // Call the onDelete function passed as prop to update the parent state
        } catch (error) {
            console.error("Error deleting hauler:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="text-red-500 bg-transparent border border-red-500 rounded-lg py-1 px-3 text-xs font-semibold hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
            {loading ? "Deleting..." : "Delete"}
        </button>
    );
}
