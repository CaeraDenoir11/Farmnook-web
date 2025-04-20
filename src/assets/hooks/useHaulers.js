import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "/configs/firebase";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
} from "firebase/firestore";

export default function useHaulers() {
    const [haulers, setHaulers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setHaulers([]);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "users"),
            where("businessId", "==", currentUser.uid),
            where("userType", "==", "Hauler")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const haulers = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            let adminAsHauler = null;
            try {
                const adminDocRef = doc(db, "users", currentUser.uid);
                const adminSnap = await getDoc(adminDocRef);

                if (adminSnap.exists()) {
                    const adminData = adminSnap.data();
                    adminAsHauler = {
                        id: currentUser.uid,
                        ...adminData,
                        isAdmin: true,
                    };
                }
            } catch (e) {
                console.warn("Failed to fetch admin doc:", e);
            }

            const finalList = adminAsHauler ? [adminAsHauler, ...haulers] : haulers;
            setHaulers(finalList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return { haulers, setHaulers, currentUser, loading };
}
