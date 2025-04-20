import { useEffect, useState } from "react";
import { db } from "/configs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function useVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                setLoading(true);
                const userId = localStorage.getItem("userId");
                if (!userId) {
                    console.error("No user ID found.");
                    return;
                }

                const vehicleQuery = query(
                    collection(db, "vehicles"),
                    where("businessId", "==", userId)
                );

                const snapshot = await getDocs(vehicleQuery);
                const vehicleList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setVehicles(vehicleList);
            } catch (err) {
                console.error("Error fetching vehicles:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    return { vehicles, setVehicles, loading };
}
