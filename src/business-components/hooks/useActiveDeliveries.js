import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebase";

// This hook keeps track of all the deliveries that are currently happening
// It's like having a live feed of all active deliveries
export const useActiveDeliveries = () => {
  // Store all the active deliveries we find
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  // Keep track of our listeners so we can clean them up
  const [listeners, setListeners] = useState([]);
  // Track if we're still loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get the current business user's ID
    const businessId = auth.currentUser?.uid;
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    console.log("Setting up real-time listeners for business:", businessId);
    setIsLoading(true);

    // Look for all delivery requests that this business has accepted
    const requestsRef = collection(db, "deliveryRequests");
    const requestsQuery = query(
      requestsRef,
      where("businessId", "==", businessId),
      where("isAccepted", "==", true)
    );

    // First, get the initial data
    const getInitialData = async () => {
      try {
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map((doc) => ({
          requestId: doc.id,
          ...doc.data(),
        }));

        const activeDeliveriesPromises = requests.map(async (request) => {
          const deliveriesRef = collection(db, "deliveries");
          const deliveryQuery = query(
            deliveriesRef,
            where("requestId", "==", request.requestId),
            where("isStarted", "==", true),
            where("isDone", "==", false)
          );

          const deliverySnapshot = await getDocs(deliveryQuery);
          if (!deliverySnapshot.empty) {
            const delivery = deliverySnapshot.docs[0].data();
            let haulerInfo = null;
            let farmerInfo = null;

            // Get hauler info if assigned
            if (delivery.haulerAssignedId) {
              const haulerDoc = await getDoc(
                doc(db, "users", delivery.haulerAssignedId)
              );
              if (haulerDoc.exists()) {
                const haulerData = haulerDoc.data();
                haulerInfo = {
                  name: `${haulerData.firstName} ${haulerData.lastName}`,
                  licenseNo: haulerData.licenseNo,
                  phoneNum: haulerData.phoneNum || "Not provided",
                  profileImg: haulerData.profileImg || null,
                };
              }
            }

            // Get farmer info
            try {
              const farmerDoc = await getDoc(
                doc(db, "users", request.farmerId)
              );
              if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                farmerInfo = {
                  name: `${farmerData.firstName} ${farmerData.lastName}`,
                  phoneNum: farmerData.phoneNum || "Not provided",
                  profileImg: farmerData.profileImg || null,
                };
              }
            } catch (e) {
              console.error("Error getting farmer:", e);
            }

            // Get vehicle info
            let vehicleName = "Unknown";
            try {
              const vehicleDoc = await getDoc(
                doc(db, "vehicles", request.vehicleId)
              );
              if (vehicleDoc.exists()) {
                vehicleName = vehicleDoc.data().model || "Unknown";
              }
            } catch (e) {
              console.error("Error getting vehicle:", e);
            }

            // Get the full delivery request details
            const requestDoc = await getDoc(
              doc(db, "deliveryRequests", request.requestId)
            );
            const requestData = requestDoc.exists() ? requestDoc.data() : {};

            return {
              ...delivery,
              deliveryId: deliverySnapshot.docs[0].id,
              pickupLocation:
                requestData.pickupLocation || request.pickupLocation,
              destinationLocation:
                requestData.destinationLocation || request.destinationLocation,
              pickupName: requestData.pickupName || request.pickupName,
              destinationName:
                requestData.destinationName || request.destinationName,
              productType: requestData.productType || request.productType,
              weight: requestData.weight || request.weight,
              purpose: requestData.purpose || request.purpose,
              estimatedCost: requestData.estimatedCost || request.estimatedCost,
              estimatedTime: requestData.estimatedTime || request.estimatedTime,
              farmerName:
                farmerInfo?.name ||
                requestData.farmerName ||
                request.farmerName ||
                "N/A",
              vehicleName:
                vehicleName ||
                requestData.vehicleName ||
                request.vehicleName ||
                "N/A",
              haulerName: haulerInfo?.name || "N/A",
              haulerLicense: haulerInfo?.licenseNo || "N/A",
              haulerPhone: haulerInfo?.phoneNum || "Not provided",
            };
          }
          return null;
        });

        const initialDeliveries = (
          await Promise.all(activeDeliveriesPromises)
        ).filter(Boolean);
        setActiveDeliveries(initialDeliveries);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting initial data:", error);
        setIsLoading(false);
      }
    };

    // Get the initial data
    getInitialData();

    // Then set up real-time listeners
    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      async (requestsSnapshot) => {
        console.log("Found accepted requests:", requestsSnapshot.size);

        const requests = requestsSnapshot.docs.map((doc) => ({
          requestId: doc.id,
          ...doc.data(),
        }));

        // Clean up any existing delivery listeners
        listeners.forEach((unsubscribe) => unsubscribe());
        const newListeners = [];

        // For each request, set up a real-time listener for its delivery
        const activeDeliveriesPromises = requests.map(async (request) => {
          const deliveriesRef = collection(db, "deliveries");
          const deliveryQuery = query(
            deliveriesRef,
            where("requestId", "==", request.requestId),
            where("isStarted", "==", true),
            where("isDone", "==", false)
          );

          return new Promise((resolve) => {
            const unsubscribeDelivery = onSnapshot(
              deliveryQuery,
              async (deliverySnapshot) => {
                if (!deliverySnapshot.empty) {
                  const delivery = deliverySnapshot.docs[0].data();
                  let haulerInfo = null;
                  let farmerInfo = null;

                  // Get hauler info if assigned
                  if (delivery.haulerAssignedId) {
                    const haulerDoc = await getDoc(
                      doc(db, "users", delivery.haulerAssignedId)
                    );
                    if (haulerDoc.exists()) {
                      const haulerData = haulerDoc.data();
                      haulerInfo = {
                        name: `${haulerData.firstName} ${haulerData.lastName}`,
                        licenseNo: haulerData.licenseNo,
                        phoneNum: haulerData.phoneNum || "Not provided",
                        profileImg: haulerData.profileImg || null,
                      };
                    }
                  }

                  // Get farmer info
                  try {
                    const farmerDoc = await getDoc(
                      doc(db, "users", request.farmerId)
                    );
                    if (farmerDoc.exists()) {
                      const farmerData = farmerDoc.data();
                      farmerInfo = {
                        name: `${farmerData.firstName} ${farmerData.lastName}`,
                        phoneNum: farmerData.phoneNum || "Not provided",
                        profileImg: farmerData.profileImg || null,
                      };
                    }
                  } catch (e) {
                    console.error("Error getting farmer:", e);
                  }

                  // Get vehicle info
                  let vehicleName = "Unknown";
                  try {
                    const vehicleDoc = await getDoc(
                      doc(db, "vehicles", request.vehicleId)
                    );
                    if (vehicleDoc.exists()) {
                      vehicleName = vehicleDoc.data().model || "Unknown";
                    }
                  } catch (e) {
                    console.error("Error getting vehicle:", e);
                  }

                  // Get the full delivery request details
                  const requestDoc = await getDoc(
                    doc(db, "deliveryRequests", request.requestId)
                  );
                  const requestData = requestDoc.exists()
                    ? requestDoc.data()
                    : {};

                  resolve({
                    ...delivery,
                    deliveryId: deliverySnapshot.docs[0].id,
                    pickupLocation:
                      requestData.pickupLocation || request.pickupLocation,
                    destinationLocation:
                      requestData.destinationLocation ||
                      request.destinationLocation,
                    pickupName: requestData.pickupName || request.pickupName,
                    destinationName:
                      requestData.destinationName || request.destinationName,
                    productType: requestData.productType || request.productType,
                    weight: requestData.weight || request.weight,
                    purpose: requestData.purpose || request.purpose,
                    estimatedCost:
                      requestData.estimatedCost || request.estimatedCost,
                    estimatedTime:
                      requestData.estimatedTime || request.estimatedTime,
                    farmerName:
                      farmerInfo?.name ||
                      requestData.farmerName ||
                      request.farmerName ||
                      "N/A",
                    vehicleName:
                      vehicleName ||
                      requestData.vehicleName ||
                      request.vehicleName ||
                      "N/A",
                    haulerName: haulerInfo?.name || "N/A",
                    haulerLicense: haulerInfo?.licenseNo || "N/A",
                    haulerPhone: haulerInfo?.phoneNum || "Not provided",
                  });
                } else {
                  resolve(null);
                }
              },
              (error) => {
                console.error("Error listening to delivery:", error);
                resolve(null);
              }
            );

            newListeners.push(unsubscribeDelivery);
          });
        });

        const activeDeliveries = (
          await Promise.all(activeDeliveriesPromises)
        ).filter(Boolean);
        setListeners(newListeners);
        setActiveDeliveries(activeDeliveries);
      },
      (error) => {
        console.error("Error fetching accepted requests:", error);
        setIsLoading(false);
      }
    );

    // Clean up all listeners when we're done
    return () => {
      unsubscribeRequests();
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Give back the list of active deliveries and loading state
  return { activeDeliveries, isLoading };
};
