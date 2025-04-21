import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "/configs/firebase";

export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            const q = query(
                collection(db, "notifications"),
                where("businessId", "==", user.uid)
            );

            const unsubscribeSnapshot = onSnapshot(
                q,
                (snapshot) => {
                    const loaded = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        const dateObj = data.timestamp?.toDate();

                        const formattedDate = dateObj
                            ? dateObj.toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "2-digit",
                            })
                            : "N/A";

                        const formattedTime = dateObj
                            ? dateObj.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            })
                            : "N/A";

                        return {
                            id: doc.id,
                            ...data,
                            date: formattedDate,
                            time: formattedTime,
                        };
                    });

                    setNotifications(loaded);
                    setLoading(false);
                },
                (err) => {
                    console.error("Error fetching notifications:", err);
                    setError("Failed to load notifications");
                    setLoading(false);
                }
            );

            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, []);

    return { notifications, loading, error };
}
