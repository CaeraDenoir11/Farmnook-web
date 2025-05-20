// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react"; // <<< ADDED React for JSX in embedded modal
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { sendPushNotification } from "../utils/SendPushNotification.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import DeclineModal from "../business-components/components/DeclineDialog.jsx"; // User's existing import

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

// --- NEW: Definition of ScheduleConflictModal within this file ---
function ScheduleConflictModal({ isOpen, onClose, current, conflict }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-red-600">
            Schedule Conflict!
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="whitespace-pre-line text-sm text-red-700">
            {`Your delivery request:
` +
              `📦 ${current?.productType || "Delivery"} - ${
                current?.weight
              } kg\n` +
              `⏰ Time: ${formatTimeNoSeconds(
                current?.start
              )} - ${formatTimeNoSeconds(current?.end)}\n\n` +
              `Conflicts with existing delivery:\n` +
              `📦 ${conflict?.productType || "Delivery"} - ${
                conflict?.weight
              } kg\n` +
              `⏰ Time: ${formatTimeNoSeconds(
                conflict?.start
              )} - ${formatTimeNoSeconds(conflict?.end)}\n` +
              (conflict?.plateNumber
                ? `🚗 Plate: ${conflict.plateNumber}\n`
                : "") +
              `\nOverlap detected: The time slots overlap, which means the vehicle would be in two places at once.`}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
// --- END: Definition of ScheduleConflictModal ---

export default function MapModal({
  isOpen,
  onClose,
  pickup,
  drop,
  farmerName,
  purpose,
  productType,
  weight,
  timestamp, // Original timestamp of the request
  vehicleId, // Vehicle this request is being considered for
  id, // Document ID of the current deliveryRequest
  scheduledTime, // The specific proposed schedule (Firebase Timestamp) for THIS request
  estimatedEndTime, // The estimated end time for the delivery
  setRequests,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false); // User's existing state
  const [declineReason, setDeclineReason] = useState(""); // User's existing state
  const [currentUser, setCurrentUser] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [scheduledDeliveries, setScheduledDeliveries] = useState([]);
  const [loading, setLoading] = useState(true); // Change initial state to true
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Add this for initial load state
  const [conflictMessage, setConflictMessage] = useState("");
  const [conflictDetails, setConflictDetails] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  console.log(vehicleId); // User's original console.log

  // Dynamic calendar state (as per user's original code)
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(2025);
  const [calendarMonth, setCalendarMonth] = useState(4); // 0-based (4 = May)

  // Calculate first weekday and number of days in month
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // Build calendar days array (with empty slots for days before the 1st)
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // empty cell
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // --- Firestore fetching for scheduled deliveries --- (as per user's original code)
  useEffect(() => {
    if (!vehicleId) return;

    const startOfMonth = new Date(calendarYear, calendarMonth, 1);
    const endOfMonth = new Date(
      calendarYear,
      calendarMonth + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Change to deliveries collection
    const deliveriesRef = collection(db, "deliveries");

    console.log("Query parameters:", {
      vehicleId,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
    });

    const q = query(
      deliveriesRef,
      where("vehicleId", "==", vehicleId),
      where("isDone", "==", false)
    );

    // Set loading state
    setLoading(true);

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        console.log("Raw query results:", querySnapshot.size, "documents");

        const deliveries = [];
        // Use Promise.all to fetch request details for each delivery
        await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            console.log("Document data:", data);

            // Fetch the corresponding request details
            const requestRef = doc(db, "deliveryRequests", data.requestId);
            const requestDoc = await getDoc(requestRef);
            const requestData = requestDoc.exists() ? requestDoc.data() : {};

            const deliveryDate =
              data.scheduledTime?.toDate?.() ||
              data.timestamp?.toDate?.() ||
              new Date();

            if (deliveryDate >= startOfMonth && deliveryDate <= endOfMonth) {
              deliveries.push({
                ...data,
                id: docSnapshot.id,
                date: deliveryDate,
                label: `${requestData.productType || "Delivery"} - ${
                  requestData.purpose || ""
                }`,
                scheduledTime: data.scheduledTime,
                timestamp: data.timestamp,
                isAccepted: true, // Since it's in deliveries, it's accepted
                estimatedEndTime: data.estimatedEndTime,
                productType: requestData.productType,
                purpose: requestData.purpose,
                weight: requestData.weight,
                farmerName: requestData.farmerName,
                pickup: requestData.pickupLocation,
                drop: requestData.destinationLocation,
              });
            }
          })
        );

        deliveries.sort((a, b) => a.date - b.date);
        console.log("Filtered deliveries for calendar:", deliveries);
        setScheduledDeliveries(deliveries);
        setLoading(false);
        setIsInitialLoad(false);
      },
      (error) => {
        console.error("Error fetching deliveries:", error);
        setLoading(false);
        setIsInitialLoad(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [vehicleId, calendarYear, calendarMonth]);

  // Update getDeliveriesForDay to handle the new data structure
  const getDeliveriesForDay = (day) => {
    console.log("Getting deliveries for day:", day);
    const deliveries = scheduledDeliveries.filter((d) => {
      const deliveryDate = d.date;
      const matches =
        deliveryDate.getDate() === day &&
        deliveryDate.getMonth() === calendarMonth &&
        deliveryDate.getFullYear() === calendarYear;

      if (matches) {
        console.log("Found matching delivery:", d);
      }
      return matches;
    });
    console.log("Found deliveries for day:", deliveries.length);
    return deliveries;
  };

  // Helper: get deliveries for the current month (User's original function)
  const getDeliveriesForMonth = () => {
    return scheduledDeliveries.filter((d) => {
      const deliveryDate = d.date;
      return (
        deliveryDate.getMonth() === calendarMonth &&
        deliveryDate.getFullYear() === calendarYear
      );
    });
  };

  // Add new effect to check delivery status
  useEffect(() => {
    const checkDeliveryStatus = async () => {
      if (!id) return; // No request ID to check

      try {
        const deliveriesRef = collection(db, "deliveries");
        const q = query(deliveriesRef, where("requestId", "==", id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const deliveryDoc = querySnapshot.docs[0];
          const deliveryData = deliveryDoc.data();
          setDeliveryStatus({
            exists: true,
            data: deliveryData,
            id: deliveryDoc.id,
          });
        } else {
          setDeliveryStatus({
            exists: false,
            data: null,
            id: null,
          });
        }
      } catch (error) {
        console.error("Error checking delivery status:", error);
        setDeliveryStatus(null);
      }
    };

    checkDeliveryStatus();
  }, [id]);

  // Update getCurrentDelivery to use delivery status
  const getCurrentDelivery = () => {
    const currentDelivery = scheduledDeliveries.find((d) => d.id === id);
    if (!currentDelivery) {
      return {
        pickupLocation: pickup,
        destinationLocation: drop,
        farmerName: farmerName,
        purpose: purpose,
        productType: productType,
        weight: weight,
        date: scheduledTime?.toDate?.() || new Date(scheduledTime),
        estimatedEndTime: estimatedEndTime,
        id: id,
        isAccepted: false,
        deliveryStatus: deliveryStatus,
      };
    }
    return {
      ...currentDelivery,
      deliveryStatus: deliveryStatus,
    };
  };

  // Revert getUpcomingDeliveries to use isAccepted check
  const getUpcomingDeliveries = () => {
    return scheduledDeliveries
      .filter((d) => d.id !== id && d.isAccepted === true)
      .sort((a, b) => a.date - b.date);
  };

  // Helper: get color class for a day based on delivery count and current delivery (User's original function and logic)
  const getDayColorClass = (count, isToday, hasCurrentDelivery) => {
    if (hasCurrentDelivery) return "bg-[#1A4D2E] text-white";
    if (count === 1) return "bg-orange-100 text-orange-800";
    if (count === 2) return "bg-orange-300 text-orange-800";
    if (count === 3) return "bg-orange-500 text-black";
    if (count === 4) return "bg-red-400 text-black";
    if (count >= 5) return "bg-red-800 text-black";
    if (isToday) return "bg-gray-100 text-gray-800";
    return "";
  };

  // Format date for display (User's original function)
  const formatDeliveryDate = (date) => {
    // User's original parameter name 'date'
    if (!date) return "N/A";
    if (typeof date === "string") return date;
    if (date.toDate)
      return date.toDate().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format time range for display
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = formatDeliveryDate(startTime);
    const end = formatDeliveryDate(endTime);
    return `${start} - ${end}`;
  };

  // Tooltip state
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 0) {
        setCalendarYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };
  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev === 11) {
        setCalendarYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };
  const handleToday = () => {
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth());
  };

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (!isOpen || !isMounted) return null;

  const formattedTime = timestamp?.toDate // User's original formattedTime
    ? timestamp.toDate().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "N/A";

  // Validate required props
  if (!pickup || !drop) {
    console.error("Missing required pickup or drop coordinates");
    return null;
  }

  console.log(scheduledDeliveries); // User's original console.log

  // Update handleAcceptRequest to use delivery status
  const handleAcceptRequest = async () => {
    // Check if delivery already exists
    if (deliveryStatus?.exists) {
      alert(
        "This request has already been accepted and is in the deliveries collection."
      );
      return;
    }

    // Validate scheduled time
    if (!scheduledTime || typeof scheduledTime.toDate !== "function") {
      alert(
        "This request's proposed schedule is not valid or missing. Cannot proceed."
      );
      return;
    }

    if (!estimatedEndTime || typeof estimatedEndTime.toDate !== "function") {
      alert(
        "This request's estimated end time is not valid or missing. Cannot proceed."
      );
      return;
    }

    if (!vehicleId) {
      alert(
        "No vehicle is associated with this request. Cannot check for conflicts."
      );
      return;
    }

    const currentRequestStart = scheduledTime.toDate();
    const currentRequestEnd = estimatedEndTime.toDate();

    // Check for time conflicts with existing deliveries
    let conflictFound = false;
    let conflictDetails = null;

    // First check scheduled deliveries in the calendar
    for (const existingDelivery of scheduledDeliveries) {
      if (existingDelivery.id === id) continue;

      const existingStart = existingDelivery.scheduledTime?.toDate?.();
      const existingEnd = existingDelivery.estimatedEndTime?.toDate?.();

      if (!existingStart || !existingEnd) continue;

      // Check if there's any overlap in the time ranges
      // Modified to allow deliveries to start exactly when another ends
      const hasConflict =
        // Current request starts during an existing delivery (but not at the end)
        (currentRequestStart > existingStart &&
          currentRequestStart < existingEnd) ||
        // Current request ends during an existing delivery (but not at the start)
        (currentRequestEnd > existingStart &&
          currentRequestEnd < existingEnd) ||
        // Current request completely encompasses an existing delivery
        (currentRequestStart < existingStart &&
          currentRequestEnd > existingEnd);

      if (hasConflict) {
        conflictFound = true;
        conflictDetails = {
          existingStart: formatDeliveryDate(existingStart),
          existingEnd: formatDeliveryDate(existingEnd),
          currentStart: formatDeliveryDate(currentRequestStart),
          currentEnd: formatDeliveryDate(currentRequestEnd),
          productType: existingDelivery.productType,
          weight: existingDelivery.weight,
        };
        break;
      }
    }

    // If no conflicts in calendar, check active deliveries
    if (!conflictFound) {
      try {
        const deliveriesRef = collection(db, "deliveries");
        const q = query(
          deliveriesRef,
          where("vehicleId", "==", vehicleId),
          where("isDone", "==", false)
        );

        const existingDeliveries = await getDocs(q);

        for (const doc of existingDeliveries.docs) {
          const delivery = doc.data();
          const existingStart = delivery.scheduledTime?.toDate?.();
          const existingEnd = delivery.estimatedEndTime?.toDate?.();

          if (!existingStart || !existingEnd) continue;

          // Use the same modified conflict check
          const hasConflict =
            (currentRequestStart > existingStart &&
              currentRequestStart < existingEnd) ||
            (currentRequestEnd > existingStart &&
              currentRequestEnd < existingEnd) ||
            (currentRequestStart < existingStart &&
              currentRequestEnd > existingEnd);

          if (hasConflict) {
            conflictFound = true;
            conflictDetails = {
              existingStart: formatDeliveryDate(existingStart),
              existingEnd: formatDeliveryDate(existingEnd),
              currentStart: formatDeliveryDate(currentRequestStart),
              currentEnd: formatDeliveryDate(currentRequestEnd),
              productType: delivery.productType,
              weight: delivery.weight,
            };
            break;
          }
        }
      } catch (error) {
        console.error("Error checking delivery conflicts:", error);
        alert("Error checking for schedule conflicts. Please try again.");
        return;
      }
    }

    if (conflictFound) {
      setIsConflictModalOpen(true);
      setConflictDetails({
        current: {
          productType,
          weight,
          start: currentRequestStart,
          end: currentRequestEnd,
        },
        conflict: {
          productType: conflictDetails.productType,
          weight: conflictDetails.weight,
          start: new Date(conflictDetails.existingStart),
          end: new Date(conflictDetails.existingEnd),
          plateNumber: conflictDetails.plateNumber,
        },
      });
      return;
    }

    // If no conflicts found, proceed to assign modal
    setAssignModalOpen(true);
  };

  const handleDeclineRequest = () => {
    // User's original function
    setDeclineModalOpen(true);
  };

  const handleAssign = async (hauler) => {
    // User's original handleAssign function
    try {
      // 1. Mark request as accepted
      // The original code was: await updateDoc(doc(db, "deliveryRequests", req.id), {
      // 'req' is not defined in this scope. It should be 'id' from the props.
      await updateDoc(doc(db, "deliveryRequests", id), {
        // Corrected to use 'id' from props
        isAccepted: true,
      });

      // 2. Add to deliveries collection
      const docRef = await addDoc(collection(db, "deliveries"), {
        // User's original docRef
        requestId: id,
        haulerAssignedId: hauler.id,
        vehicleId: vehicleId,
        createdAt: new Date(), // User's original used new Date()
        isStarted: false,
        arrivedAtPickup: false,
        arrivedAtDestination: false,
        isDone: false,
        isValidated: false,
        farmerId: hauler.farmerId, // User's original used hauler.farmerId
        scheduledTime: scheduledTime,
      });
      await updateDoc(docRef, {
        // User's original docRef
        deliveryId: docRef.id,
      });

      // 3. Update UI
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setAssignModalOpen(false);
      onClose();

      // 4. Create Firestore notification
      const businessId = currentUser.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const businessName = businessData?.businessName || "Your Business";
      const message = `Your delivery request has been accepted by ${businessName}`;

      const notifRef = doc(collection(db, "notifications")); // User's original notifRef
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: hauler.farmerId, // User's original used hauler.farmerId
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send OneSignal push
      const farmerDoc = await getDoc(doc(db, "users", hauler.farmerId)); // User's original farmerDoc
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null; // User's original farmerData
      const validPlayerIds = (farmerData?.playerIds || []).filter(
        // User's original validPlayerIds
        (playerId) => typeof playerId === "string" && playerId.length >= 10 // Renamed id to playerId for clarity
      );
      if (validPlayerIds.length) {
        await sendPushNotification(validPlayerIds, businessName, message, {
          openTarget: "FarmerDashboardFragment",
          farmerId: hauler.farmerId,
        });
      }

      // 6. Notify the assigned hauler
      const haulerDoc = await getDoc(doc(db, "users", hauler.id)); // User's original haulerDoc
      const haulerData = haulerDoc.exists() ? haulerDoc.data() : null; // User's original haulerData

      const haulerMessage = "You have been assigned to a delivery.";

      if (haulerData) {
        // Firestore notification for hauler
        const haulerNotifRef = doc(collection(db, "notifications")); // User's original haulerNotifRef
        await setDoc(haulerNotifRef, {
          notificationId: haulerNotifRef.id,
          recipientId: hauler.id,
          title: "New Delivery Assignment",
          message: haulerMessage,
          timestamp: Timestamp.now(),
          isRead: false,
        });

        const haulerPlayerIds = (haulerData.playerIds || []).filter(
          // User's original haulerPlayerIds
          (playerId) => typeof playerId === "string" && playerId.length >= 10 // Renamed id to playerId for clarity
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
        }
      }
    } catch (err) {
      console.error("Error assigning hauler:", err);
    }
  };

  const handleDeclineSubmit = async () => {
    // User's original function
    try {
      // 🔍 Step 1: Fetch the delivery request to get farmerId
      const requestDoc = await getDoc(doc(db, "deliveryRequests", id));
      if (!requestDoc.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data();
      const farmerIdForDecline = requestData.farmerId; // Renamed farmerId to avoid conflict if one exists in outer scope

      // ✅ Step 2: Update the request status
      await updateDoc(doc(db, "deliveryRequests", id), {
        isDeclined: true,
        declineReason: declineReason,
        declinedAt: Timestamp.now(),
        declinedBy: currentUser.uid,
      });

      // ✅ Step 3: Create Firestore notification for farmer
      const businessId = currentUser.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const title =
        `Declined by  ${businessData?.businessName}` || "Your Business"; // Original title
      const message = declineReason; // Original message

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: farmerIdForDecline, // Use the fetched farmerId
        title: title,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // ✅ Step 4: Send OneSignal push to farmer
      const farmerDoc = await getDoc(doc(db, "users", farmerIdForDecline)); // Use fetched farmerId
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;

      const validPlayerIds = (farmerData?.playerIds || []).filter(
        (playerId) => typeof playerId === "string" && playerId.length >= 10 // Renamed id to playerId
      );

      if (validPlayerIds.length) {
        await sendPushNotification(validPlayerIds, title, message, {
          openTarget: "FarmerDashboardFragment",
          farmerId: farmerIdForDecline, // Use fetched farmerId
        });
      } else {
        console.warn(
          "No valid playerIds found for farmer:",
          farmerIdForDecline
        );
      }

      // ✅ Step 5: Update UI
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setDeclineModalOpen(false);
      onClose();
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  // Update the UI to show delivery status
  const renderDeliveryStatus = () => {
    if (!deliveryStatus) return null;

    if (deliveryStatus.exists) {
      return (
        <div className="bg-green-50 p-2 rounded-lg mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-green-800">
                Delivery Status: Active
              </p>
              <p className="text-[11px] text-green-600">
                Delivery ID: {deliveryStatus.id}
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-800">
              Scheduled
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Update the Maps component to handle routing errors
  const handleMapError = (error) => {
    console.warn("Map routing error:", error);
    // You can add additional error handling here if needed
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] relative flex flex-col overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#1A4D2E] px-4 py-2 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                Delivery Route & Request Details
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-red-200 transition-colors duration-200 text-xl"
              >
                ⓧ
              </button>
            </div>
          </div>

          {/* Map and Calendar Section */}
          <div className="flex-1 flex min-h-0">
            {/* Map Section with Details above */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Details Section (above map, only map width) */}
              <div className="p-2 bg-gray-50 w-full">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <h3 className="text-[10px] font-semibold text-gray-600 mb-0.5">
                      Farmer
                    </h3>
                    <p className="text-[#1A4D2E] text-xs">
                      {farmerName || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <h3 className="text-[10px] font-semibold text-gray-600 mb-0.5">
                      Purpose
                    </h3>
                    <p className="text-[#1A4D2E] text-xs">{purpose || "N/A"}</p>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <h3 className="text-[10px] font-semibold text-gray-600 mb-0.5">
                      Product
                    </h3>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#1A4D2E]">
                        {productType ? `${productType} - ${weight} kg` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <h3 className="text-[10px] font-semibold text-gray-600 mb-0.5">
                      Scheduled Time
                    </h3>
                    <p className="text-[#1A4D2E] text-xs">
                      {formatTimeRange(scheduledTime, estimatedEndTime)}
                    </p>
                  </div>
                </div>
              </div>
              {/* Map Section */}
              <div className="flex-1 relative min-h-0">
                <div className="absolute inset-0">
                  <Maps
                    pickupLocation={pickup}
                    destinationLocation={drop}
                    disablePicker={true}
                    routeColor="#32CD32"
                    showTooltips={true}
                    height="100%"
                    onError={handleMapError}
                    fitBoundsOptions={{
                      padding: [50, 50],
                      maxZoom: 15,
                      animate: true,
                      duration: 1.5,
                      easeLinearity: 0.25,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col overflow-y-auto min-h-0 relative">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Delivery Schedule
                </h3>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <button
                    className="p-1 hover:bg-gray-100 rounded-full"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="font-medium text-gray-700">
                    {monthNames[calendarMonth]} {calendarYear}
                  </span>
                  <button
                    className="p-1 hover:bg-gray-100 rounded-full"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 border"
                    onClick={handleToday}
                  >
                    Today
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (
                      day // User's original variable 'day'
                    ) => (
                      <div
                        key={day}
                        className="text-center text-[11px] font-medium text-gray-500"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : isInitialLoad ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E] mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">
                      Loading deliveries...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => {
                      // User's original variable 'day'
                      if (day === null) {
                        return (
                          <div key={"empty-" + i} className="aspect-square" />
                        );
                      }
                      const isToday =
                        day === today.getDate() &&
                        calendarMonth === today.getMonth() &&
                        calendarYear === today.getFullYear();
                      const deliveries = getDeliveriesForDay(day); // User's original 'deliveries'
                      const hasCurrentDelivery = deliveries.some(
                        // User's original 'hasCurrentDelivery'
                        (d) => d.id === id
                      );
                      const count = deliveries.length;
                      return (
                        <div
                          key={day}
                          className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer
                            ${getDayColorClass(
                              // User's original getDayColorClass call
                              count,
                              isToday,
                              hasCurrentDelivery
                            )}
                            ${
                              count === 0 && !isToday ? "hover:bg-gray-100" : ""
                            }
                            border border-gray-100
                          `}
                          onMouseEnter={(e) => {
                            // User's original onMouseEnter logic
                            setTooltip({
                              show: true,
                              x:
                                e.currentTarget.getBoundingClientRect().left +
                                window.scrollX +
                                20,
                              y:
                                e.currentTarget.getBoundingClientRect().top +
                                window.scrollY +
                                30,
                              // User's original tooltip content logic
                              content:
                                deliveries.length > 0
                                  ? deliveries
                                      .map(
                                        (d) =>
                                          `${d.productType || "Delivery"} - ${
                                            d.weight
                                          } kg\n` +
                                          `Start: ${formatDeliveryDate(
                                            d.date
                                          )}\n` +
                                          `End: ${formatDeliveryDate(
                                            d.estimatedEndTime
                                          )}`
                                      )
                                      .join("\n\n")
                                  : "No deliveries",
                            });
                          }}
                          onMouseLeave={() =>
                            setTooltip({ ...tooltip, show: false })
                          }
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Tooltip for calendar days */}
                {tooltip.show && (
                  <div
                    style={{
                      position: "fixed",
                      left: tooltip.x,
                      top: tooltip.y,
                      zIndex: 100,
                      background: "rgba(31,41,55,0.95)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      whiteSpace: "pre-line",
                      pointerEvents: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    {tooltip.content}
                  </div>
                )}
              </div>

              {/* Upcoming Deliveries Section (User's original JSX structure) */}
              <div className="flex-1 overflow-y-auto mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Current Delivery
                </h4>
                {renderDeliveryStatus()}
                {getCurrentDelivery() && !deliveryStatus?.exists && (
                  <div className="bg-[#1A4D2E]/10 p-2 rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-[#1A4D2E]">
                          {getCurrentDelivery().productType} -{" "}
                          {getCurrentDelivery().weight} kg
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Start: {formatDeliveryDate(getCurrentDelivery().date)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          End:{" "}
                          {formatDeliveryDate(
                            getCurrentDelivery().estimatedEndTime
                          )}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#1A4D2E] text-white">
                        Current
                      </span>
                    </div>
                  </div>
                )}

                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Upcoming Deliveries
                </h4>
                {getUpcomingDeliveries().map((d) => (
                  <div key={d.id} className="bg-gray-50 p-2 rounded-lg mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {d.productType} - {d.weight} kg
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Start: {formatDeliveryDate(d.date)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          End: {formatDeliveryDate(d.estimatedEndTime)}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#1A4D2E]/10 text-[#1A4D2E]">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Accept and Cancel Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleAcceptRequest} // This now includes the schedule check
                  className="w-full bg-[#1A4D2E] text-white py-1.5 rounded font-semibold text-sm hover:bg-[#163c22] transition"
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineRequest} // User's original
                  className="w-full bg-red-500 text-white py-1.5 rounded font-semibold text-sm hover:bg-red-600 transition"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>

          {/* Legend (always visible) (User's original JSX structure) */}
          <div className="bg-white p-2 border-t border-gray-200 flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <div
                style={{
                  background: "#32CD32",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "white",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                  }}
                ></div>
              </div>
              <span className="text-gray-600 ml-1">Route</span>
            </div>
            <div className="flex items-center">
              <div
                style={{
                  background: "#FF0000",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "white",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                  }}
                ></div>
              </div>
              <span className="text-gray-600 ml-1">Pickup Point</span>
            </div>
            <div className="flex items-center">
              <div
                style={{
                  background: "#0000FF",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "white",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                  }}
                ></div>
              </div>
              <span className="text-gray-600 ml-1">Destination</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-100 border border-gray-200 mr-1"></div>
              <span className="text-gray-600">1 Delivery</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-300 border border-gray-200 mr-1"></div>
              <span className="text-gray-600">2 Deliveries</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 border border-gray-200 mr-1"></div>
              <span className="text-gray-600">3 Deliveries</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-gray-200 mr-1"></div>
              <span className="text-gray-600">4 Deliveries</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-800 border border-gray-200 mr-1"></div>
              <span className="text-gray-600">5+ Deliveries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accept Request Modal - User's original */}
      <AcceptRequestModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssign}
        req={{
          // User's original req object structure
          id,
          vehicleId,
          // In your original, this was currentUser.uid. For `AcceptRequestModal`, this might intend to be the business user.
          // If 'farmerId' in `req` is meant to be the ID of the farmer who made the request, that needs to be passed explicitly.
          // For now, sticking to original structure.
          businessId: currentUser?.uid, // Changed from farmerId to businessId for clarity if this is the business user
          scheduledTime,
        }}
        setRequests={setRequests}
      />

      {/* Decline Modal - User's original */}
      <DeclineModal
        isOpen={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        onSubmit={handleDeclineSubmit}
        reason={declineReason}
        setReason={setDeclineReason}
        requestId={id} // User's original added requestId here
      />

      {/* <<< NEWLY ADDED JSX for the conflict modal >>> */}
      <ScheduleConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => {
          setIsConflictModalOpen(false);
          setConflictDetails(null);
        }}
        current={conflictDetails?.current}
        conflict={conflictDetails?.conflict}
      />
    </>
  );
}
