import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    doc,
    getDoc,
    onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "/configs/firebase";

export default function useDeliveryRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setRequests([]);
                setLoading(false);
                return;
            }

            const q = query(
                collection(db, "deliveryRequests"),
                where("businessId", "==", user.uid),
                where("isAccepted", "==", false)
            );

            const unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
                const enrichedRequests = await Promise.all(
                    snapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data();

                        let vehicleName = "Unknown";
                        try {
                            const vehicleDoc = await getDoc(doc(db, "vehicles", data.vehicleId));
                            if (vehicleDoc.exists()) {
                                vehicleName = vehicleDoc.data().model || "Unknown";
                            }
                        } catch (e) {
                            console.error("Error getting vehicle:", e);
                        }

                        let farmerName = "Unknown Farmer";
                        try {
                            const farmerDoc = await getDoc(doc(db, "users", data.farmerId));
                            if (farmerDoc.exists()) {
                                const farmerData = farmerDoc.data();
                                farmerName = `${farmerData.firstName} ${farmerData.lastName}`;
                            }
                        } catch (e) {
                            console.error("Error getting farmer:", e);
                        }

                        return {
                            ...data,
                            id: docSnap.id,
                            vehicleName,
                            farmerName,
                        };
                    })
                );

                enrichedRequests.sort((a, b) => {
                    const aTime = a.timestamp?.toDate?.() || 0;
                    const bTime = b.timestamp?.toDate?.() || 0;
                    return bTime - aTime;
                });

                setRequests(enrichedRequests);
                setLoading(false);
            });

            return () => unsubscribeSnapshot();
        });

        return () => unsubscribeAuth();
    }, []);

    return { requests, loading, setRequests };
}