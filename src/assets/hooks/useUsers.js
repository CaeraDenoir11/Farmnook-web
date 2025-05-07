import { useState, useEffect } from "react";
import { db } from "/configs/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
} from "firebase/firestore";

// Hook to fetch Hauler Business Admins
export function useBusinessAdmins() {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        setLoadingUsers(true);
        const q = query(
            collection(db, "users"),
            where("userType", "==", "Hauler Business Admin")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const userData = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    profileImageUrl: data.profileImageUrl || "",
                    businessName: data.businessName || "N/A",
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "N/A",
                };
            });
            setUsers(userData);
            setLoadingUsers(false);
        }, (error) => {
            console.error("Error fetching business admins:", error);
            setLoadingUsers(false);
        });

        return () => unsubscribe();
    }, []);

    return { users, loadingUsers };
}

// Hook to fetch Subscriptions
export function useSubscriptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

    useEffect(() => {
        setLoadingSubscriptions(true);
        const fetchSubs = async () => {
            try {
                const snapshot = await getDocs(collection(db, "subscriptions"));
                const data = snapshot.docs.map((doc) => doc.data().businessId);
                setSubscriptions(data);
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            } finally {
                setLoadingSubscriptions(false);
            }
        };
        fetchSubs();
    }, []);

    return { subscriptions, loadingSubscriptions };
}

// Hook to fetch Haulers and Vehicles for a specific business (using onSnapshot)
export function useBusinessDetails(businessId) {
    const [haulers, setHaulers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!businessId) {
            setHaulers([]);
            setVehicles([]);
            setLoadingDetails(false);
            return;
        }

        setLoadingDetails(true);
        let unsubHaulers = () => {};
        let unsubVehicles = () => {};

        let initialHaulersLoaded = false;
        let initialVehiclesLoaded = false;

        const checkInitialLoadComplete = () => {
            if (initialHaulersLoaded && initialVehiclesLoaded) {
                setLoadingDetails(false);
            }
        };

        // Fetch Haulers
        const haulerQuery = query(
            collection(db, "users"),
            where("businessId", "==", businessId),
            where("userType", "==", "Hauler")
        );
        unsubHaulers = onSnapshot(haulerQuery, (snapshot) => {
            const haulerData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
                    licenseNo: data.licenseNo || "N/A",
                    email: data.email || "N/A",
                };
            });
            setHaulers(haulerData);
            if (!initialHaulersLoaded) {
                initialHaulersLoaded = true;
                checkInitialLoadComplete();
            }
        }, (error) => {
            console.error(`Error fetching haulers for business ${businessId}:`, error);
            setHaulers([]);
             if (!initialHaulersLoaded) {
                initialHaulersLoaded = true;
                checkInitialLoadComplete();
            }
        });

        // Fetch Vehicles
        const vehicleQuery = query(
            collection(db, "vehicles"),
            where("businessId", "==", businessId)
        );
        unsubVehicles = onSnapshot(vehicleQuery, (snapshot) => {
            const vehicleData = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    vehicleType: data.vehicleType || "N/A",
                    plateNumber: data.plateNumber || "N/A",
                    model: data.model || "N/A",
                };
            });
            setVehicles(vehicleData);
            if (!initialVehiclesLoaded) {
                initialVehiclesLoaded = true;
                checkInitialLoadComplete();
            }
        }, (error) => {
            console.error(`Error fetching vehicles for business ${businessId}:`, error);
            setVehicles([]);
            if (!initialVehiclesLoaded) {
                initialVehiclesLoaded = true;
                checkInitialLoadComplete();
            }
        });

        return () => {
            unsubHaulers();
            unsubVehicles();
        };
    }, [businessId]);

    return { haulers, vehicles, loadingDetails };
}