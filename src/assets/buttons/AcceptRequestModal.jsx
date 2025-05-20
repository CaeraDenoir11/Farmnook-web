// === AcceptRequestModal.jsx ===
// Modal for assigning a hauler to a delivery request.
// Now handles Firestore update, delivery creation, and OneSignal push notification to the Android phone.

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../configs/firebase";
import defaultImg from "../../assets/images/default.png";
import { sendPushNotification } from "../../utils/SendPushNotification.jsx";

// Utility function to format date/time without seconds
function formatTimeNoSeconds(date) {
  if (!date) return "N/A";
  if (typeof date === "string") return date;
  if (date.toDate) date = date.toDate();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AcceptRequestModal({
  isOpen,
  onClose,
  onAssign,
  req,
  setRequests,
}) {
  const [haulers, setHaulers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingHaulerId, setLoadingHaulerId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedHauler, setSelectedHauler] = useState(null);
  const [haulerSchedule, setHaulerSchedule] = useState([]);
  const [haulerVehicles, setHaulerVehicles] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [haulerDetails, setHaulerDetails] = useState({});
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    conflicts: [],
    hauler: null,
    current: null,
  });

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
      where("businessId", "==", currentUser.uid),
      where("userType", "==", "Hauler")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const haulerList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Fetch the current admin's profile and add to list
      const adminDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const adminAsHauler = {
          id: currentUser.uid,
          ...adminData,
        };

        // Only add if not already in haulerList
        const combined = [
          adminAsHauler,
          ...haulerList.filter((h) => h.id !== currentUser.uid),
        ];
        setHaulers(combined);
      } else {
        setHaulers(haulerList);
      }
    });

    return () => unsub();
  }, [currentUser]);

  // Add new useEffect to fetch hauler's schedule and vehicles when selected
  useEffect(() => {
    if (!selectedHauler) return;

    const fetchHaulerData = async () => {
      setIsLoadingDetails(true);
      try {
        console.log("Fetching data for hauler:", selectedHauler.id);

        // Fetch hauler's active deliveries
        const deliveriesRef = collection(db, "deliveries");
        const q = query(
          deliveriesRef,
          where("haulerAssignedId", "==", selectedHauler.id),
          where("isDone", "==", false)
        );

        console.log("Query parameters:", {
          haulerId: selectedHauler.id,
          isDone: false,
        });

        const querySnapshot = await getDocs(q);
        console.log("Query results count:", querySnapshot.size);

        const schedule = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const deliveryData = docSnapshot.data();
            console.log("Delivery data:", {
              id: docSnapshot.id,
              haulerAssignedId: deliveryData.haulerAssignedId,
              vehicleId: deliveryData.vehicleId,
              isDone: deliveryData.isDone,
            });

            // Fetch vehicle details for each delivery
            let vehicleData = null;
            if (deliveryData.vehicleId) {
              const vehicleDoc = await getDoc(
                doc(db, "vehicles", deliveryData.vehicleId)
              );
              vehicleData = vehicleDoc.exists() ? vehicleDoc.data() : null;
              console.log("Vehicle data:", vehicleData);
            }

            return {
              id: docSnapshot.id,
              ...deliveryData,
              vehicleDetails: vehicleData,
            };
          })
        );

        console.log("Final schedule array:", schedule);
        setHaulerSchedule(schedule);
      } catch (error) {
        console.error("Error fetching hauler data:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchHaulerData();
  }, [selectedHauler]);

  const handleAssign = async (hauler) => {
    try {
      setLoadingHaulerId(hauler.id);

      // Get the request data
      const requestDoc = await getDoc(doc(db, "deliveryRequests", req.id));
      if (!requestDoc.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data();
      const farmerId = requestData.farmerId;

      // Check for time conflicts with existing deliveries
      const newDeliveryStart = req.scheduledTime.toDate();
      const newDeliveryEnd = requestData.estimatedEndTime.toDate();

      // Get all active deliveries for this hauler
      const deliveriesRef = collection(db, "deliveries");
      const q = query(
        deliveriesRef,
        where("haulerAssignedId", "==", hauler.id),
        where("isDone", "==", false)
      );

      const querySnapshot = await getDocs(q);
      const conflicts = [];

      console.log("Checking for conflicts...");
      console.log("New delivery time:", {
        start: newDeliveryStart,
        end: newDeliveryEnd,
      });

      // Fetch all vehicle details first
      const vehiclePromises = querySnapshot.docs.map(async (deliveryDoc) => {
        const delivery = deliveryDoc.data();
        const existingStart = delivery.scheduledTime.toDate();
        const existingEnd = delivery.estimatedEndTime.toDate();

        console.log("Checking existing delivery:", {
          id: deliveryDoc.id,
          start: existingStart,
          end: existingEnd,
          vehicleId: delivery.vehicleId,
        });

        // Check for overlap
        if (
          (newDeliveryStart < existingEnd && newDeliveryEnd > existingStart) ||
          (existingStart < newDeliveryEnd && existingEnd > newDeliveryStart)
        ) {
          console.log("Found overlap with delivery:", deliveryDoc.id);
          // Fetch vehicle details
          const vehicleDoc = await getDoc(
            doc(db, "vehicles", delivery.vehicleId)
          );
          const vehicleData = vehicleDoc.exists() ? vehicleDoc.data() : null;

          console.log("Vehicle data:", vehicleData);

          return {
            id: deliveryDoc.id,
            start: existingStart,
            end: existingEnd,
            vehicleType: vehicleData?.vehicleType || "Unknown Vehicle",
            plateNumber: vehicleData?.plateNumber || "No Plate",
            model: vehicleData?.model || "Unknown Model",
          };
        }
        return null;
      });

      const resolvedConflicts = (await Promise.all(vehiclePromises)).filter(
        Boolean
      );
      console.log("Resolved conflicts:", resolvedConflicts);

      if (resolvedConflicts.length > 0) {
        console.log("Setting conflict modal with:", {
          conflicts: resolvedConflicts,
          hauler: hauler,
          current: {
            start: newDeliveryStart,
            end: newDeliveryEnd,
            productType: requestData.productType,
            weight: requestData.weight,
          },
        });
        setConflictModal({
          isOpen: true,
          conflicts: resolvedConflicts,
          hauler: hauler,
          current: {
            start: newDeliveryStart,
            end: newDeliveryEnd,
            productType: requestData.productType,
            weight: requestData.weight,
          },
        });
        setLoadingHaulerId(null);
        return;
      }

      await proceedWithAssignment(hauler, requestData, farmerId);
    } catch (err) {
      console.error("Error assigning hauler:", err);
      setLoadingHaulerId(null);
    }
  };

  const proceedWithAssignment = async (hauler, requestData, farmerId) => {
    try {
      // 1. Mark request as accepted
      await updateDoc(doc(db, "deliveryRequests", req.id), {
        isAccepted: true,
      });

      // 2. Add to deliveries collection
      const docRef = await addDoc(collection(db, "deliveries"), {
        requestId: req.id,
        haulerAssignedId: hauler.id,
        vehicleId: req.vehicleId,
        createdAt: new Date(),
        isStarted: false,
        arrivedAtPickup: false,
        isOnDelivery: false,
        arrivedAtDestination: false,
        isDone: false,
        isValidated: false,
        farmerId: farmerId,
        businessId: currentUser?.uid,
        scheduledTime: req.scheduledTime,
        estimatedEndTime: requestData.estimatedEndTime,
      });
      await updateDoc(docRef, {
        deliveryId: docRef.id,
      });

      // 3. Update UI
      setRequests((prev) => prev.filter((item) => item.id !== req.id));
      onAssign?.(hauler);

      // 4. Create Firestore notification
      const businessId = currentUser.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const businessName = businessData?.businessName || "Your Business";
      const message = `Your delivery request has been accepted by ${businessName}`;

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: farmerId,
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send OneSignal push
      const farmerDoc = await getDoc(doc(db, "users", farmerId));
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;
      const validPlayerIds = (farmerData?.playerIds || []).filter(
        (id) => typeof id === "string" && id.length >= 10
      );
      if (validPlayerIds.length) {
        await sendPushNotification(validPlayerIds, businessName, message, {
          openTarget: "FarmerDashboardFragment", // ✅ match this string in ApplicationClass
          farmerId: farmerId,
        });
      } else {
        console.warn("No valid playerIds found for farmer:", farmerId);
      }

      // 6. ✅ Notify the assigned hauler
      const haulerDoc = await getDoc(doc(db, "users", hauler.id));
      const haulerData = haulerDoc.exists() ? haulerDoc.data() : null;

      const haulerMessage = "You have been assigned to a delivery.";

      if (haulerData) {
        // Firestore notification for hauler
        const haulerNotifRef = doc(collection(db, "notifications"));
        await setDoc(haulerNotifRef, {
          notificationId: haulerNotifRef.id,
          recipientId: hauler.id,
          title: "New Delivery Assignment",
          message: haulerMessage,
          timestamp: Timestamp.now(),
          isRead: false,
        });

        const haulerPlayerIds = (haulerData.playerIds || []).filter(
          (id) => typeof id === "string" && id.length >= 10
        );

        if (haulerPlayerIds.length) {
          await sendPushNotification(
            haulerPlayerIds,
            "New Delivery Assignment",
            haulerMessage,
            {
              openTarget: "HaulerDashboardFragment",
              haulerId: hauler.id,
            }
          );
        } else {
          console.warn("No valid playerIds found for hauler:", hauler.id);
        }
      }
      // 7. Show success
      setSuccessMessage("Successfully assigned hauler!");
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error in assignment:", err);
      setLoadingHaulerId(null);
    }
  };

  // Add console log when hauler is selected
  const handleHaulerSelect = (hauler) => {
    console.log("Selected hauler:", hauler);
    setSelectedHauler(selectedHauler?.id === hauler.id ? null : hauler);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
        <div className="relative bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-[#1A4D2E]">
              Assign a Hauler
            </h2>
            <button
              onClick={onClose}
              className="text-[#1A4D2E] text-2xl font-bold hover:opacity-80 transition-opacity"
            >
              ×
            </button>
          </div>

          {successMessage && (
            <div className="bg-green-100 text-green-700 text-sm px-4 py-3 mb-6 rounded-lg text-center">
              {successMessage}
            </div>
          )}

          {/* Main Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] pr-2 custom-scroll">
            {haulers.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-400 text-lg">No haulers found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {haulers.map((hauler) => (
                  <div
                    key={hauler.id}
                    className="bg-white rounded-xl border border-[#1A4D2E] shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Hauler Header - Always Visible */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={hauler.profileImageUrl || defaultImg}
                            alt="Hauler"
                            className="w-12 h-12 rounded-full border-2 border-[#1A4D2E]"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-[#1A4D2E]">
                              {hauler.firstName} {hauler.lastName}
                            </h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleHaulerSelect(hauler)}
                            className="text-[#1A4D2E] text-sm font-medium hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {selectedHauler?.id === hauler.id
                              ? "Hide Details"
                              : "Show Details"}
                          </button>
                          <button
                            onClick={() => handleAssign(hauler)}
                            className="bg-[#1A4D2E] text-white text-sm px-4 py-1.5 rounded-lg hover:bg-[#145C38] transition-all disabled:opacity-50 font-medium"
                            disabled={loadingHaulerId !== null}
                          >
                            {loadingHaulerId === hauler.id
                              ? "Assigning..."
                              : "Assign"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Section */}
                    {selectedHauler?.id === hauler.id && (
                      <div className="border-t border-gray-200">
                        <div className="p-4">
                          {isLoadingDetails ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A4D2E]"></div>
                              <p className="text-sm text-gray-600 ml-2">
                                Loading details...
                              </p>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-semibold text-[#1A4D2E] mb-3">
                                Current Deliveries
                              </h4>
                              {haulerSchedule.length > 0 ? (
                                <div className="space-y-2">
                                  {haulerSchedule.map((delivery) => (
                                    <div
                                      key={delivery.id}
                                      className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-800">
                                          {delivery.vehicleDetails
                                            ?.vehicleType || "No Vehicle Type"}
                                        </span>
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-[#1A4D2E]/10 text-[#1A4D2E]">
                                          {delivery.vehicleDetails
                                            ?.plateNumber || "No Plate"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {delivery.scheduledTime
                                          ?.toDate()
                                          .toLocaleString()}{" "}
                                        -
                                        {delivery.estimatedEndTime
                                          ?.toDate()
                                          .toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-500">
                                    No active deliveries
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conflict Modal */}
      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-8 border-red-500 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-red-600">
                  Schedule Conflict!
                </h3>
              </div>
              <button
                onClick={() => {
                  setConflictModal({
                    isOpen: false,
                    conflicts: [],
                    hauler: null,
                    current: null,
                  });
                }}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold px-2"
              >
                ×
              </button>
            </div>
            <div className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
              <div className="whitespace-pre-line text-sm text-red-700">
                {`Your delivery request:
` +
                  `⏰ Time: ${formatTimeNoSeconds(
                    conflictModal.current?.start
                  )} - ${formatTimeNoSeconds(conflictModal.current?.end)}

` +
                  `Conflicts with existing delivery:
` +
                  conflictModal.conflicts
                    .map(
                      (conflict, idx) =>
                        `⏰ Time: ${formatTimeNoSeconds(
                          conflict.start
                        )} - ${formatTimeNoSeconds(conflict.end)}

`
                    )
                    .join("") +
                  `Overlap detected: The time slots overlap, which means the hauler would be in two places at once.`}
              </div>
            </div>
            <button
              onClick={() => {
                setConflictModal({
                  isOpen: false,
                  conflicts: [],
                  hauler: null,
                  current: null,
                });
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150 shadow"
            >
              Choose Different Driver
            </button>
          </div>
        </div>
      )}
    </>
  );
}
