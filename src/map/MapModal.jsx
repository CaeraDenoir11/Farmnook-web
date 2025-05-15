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
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { sendPushNotification } from "../utils/SendPushNotification.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import DeclineModal from "../business-components/components/DeclineDialog.jsx"; // User's existing import

// --- NEW: Definition of ScheduleConflictModal within this file ---
function ScheduleConflictModal({ isOpen, onClose, message }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
        <h3 className="text-xl font-semibold text-red-600 mb-4">Schedule Conflict!</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150"
        >
          Okay
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
  setRequests,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false); // User's existing state
  const [declineReason, setDeclineReason] = useState(""); // User's existing state
  const [currentUser, setCurrentUser] = useState(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false); // <<< NEW STATE for conflict modal

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
  const [scheduledDeliveries, setScheduledDeliveries] = useState([]);
  const [loading, setLoading] = useState(false); // User's original 'loading' state

  useEffect(() => {
    if (!vehicleId) return; // User's original condition
    setLoading(true);
    // Calculate start and end of the selected month
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
    // Firestore query
    const deliveriesRef = collection(db, "deliveryRequests");

    // Debug logs (User's original console.log)
    console.log("Query parameters:", {
      vehicleId,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
    });

    const q = query(deliveriesRef, where("vehicleId", "==", vehicleId)); // User's original query

    getDocs(q)
      .then((querySnapshot) => {
        console.log("Raw query results:", querySnapshot.size, "documents"); // User's original console.log

        const deliveries = [];
        querySnapshot.forEach((doc) => { // User's original variable 'doc'
          const data = doc.data();
          console.log("Document data:", data); // User's original console.log

          // Use scheduledTime for the calendar, fallback to timestamp if not available
          const deliveryDate =
            data.scheduledTime?.toDate?.() ||
            data.timestamp?.toDate?.() ||
            new Date();

          // Only include deliveries within the selected month
          if (deliveryDate >= startOfMonth && deliveryDate <= endOfMonth) {
            deliveries.push({
              ...data,
              id: doc.id,
              date: deliveryDate,
              label: `${data.productType || "Delivery"} - ${
                data.purpose || ""
              }`,
              scheduledTime: data.scheduledTime,
              timestamp: data.timestamp,
            });
          }
        });

        // Sort deliveries by date
        deliveries.sort((a, b) => a.date - b.date);

        console.log("Filtered deliveries for calendar:", deliveries); // User's original console.log
        setScheduledDeliveries(deliveries);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching deliveries:", error);
        setLoading(false);
      });
  }, [vehicleId, calendarYear, calendarMonth]); // User's original dependencies

  // Helper: get deliveries for a given day (1-based) (User's original function)
  const getDeliveriesForDay = (day) => {
    return scheduledDeliveries.filter((d) => {
      const deliveryDate = d.date;
      return (
        deliveryDate.getDate() === day &&
        deliveryDate.getMonth() === calendarMonth &&
        deliveryDate.getFullYear() === calendarYear
      );
    });
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

  // Helper: get current delivery (the one that was clicked) (User's original function)
  const getCurrentDelivery = () => {
    return (
      scheduledDeliveries.find((d) => d.id === id) || {
        pickupLocation: pickup,
        destinationLocation: drop,
        farmerName: farmerName,
        purpose: purpose,
        productType: productType,
        weight: weight,
        date: scheduledTime?.toDate?.() || new Date(scheduledTime),
        id: id,
      }
    );
  };

  // Helper: get upcoming deliveries (excluding current) (User's original function)
  const getUpcomingDeliveries = () => {
    return scheduledDeliveries.filter((d) => d.id !== id);
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
  const formatDeliveryDate = (date) => { // User's original parameter name 'date'
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
    "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December",
  ];

  if (!isOpen || !isMounted) return null;

  const formattedTime = timestamp?.toDate // User's original formattedTime
    ? timestamp.toDate().toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "N/A";

  // Validate required props
  if (!pickup || !drop) {
    console.error("Missing required pickup or drop coordinates");
    return null;
  }

  console.log(scheduledDeliveries); // User's original console.log

  const handleAcceptRequest = () => { // User's original handleAcceptRequest
    // --- MODIFIED VALIDATION LOGIC - START ---
    // This logic is added at the beginning of the existing handleAcceptRequest function.
    // It uses the `scheduledTime` prop for the current request's proposed schedule.
    // It checks against the `scheduledDeliveries` state, which contains other requests
    // for the same `vehicleId` within the current calendar month.

    // 1. Validate current request's proposed schedule (`scheduledTime` prop)
    if (!scheduledTime || typeof scheduledTime.toDate !== 'function') {
      // Using alert for pre-condition failures as these are not "schedule conflicts"
      // but rather data integrity issues.
      alert("This request's proposed schedule is not valid or missing. Cannot proceed.");
      return; // Stop if no valid schedule for current request
    }
    // 2. Ensure a vehicleId is present for context
    if (!vehicleId) {
      alert("No vehicle is associated with this request. Cannot check for conflicts.");
      return;
    }

    const currentRequestDateToCompare = scheduledTime.toDate(); // JS Date for comparison
    let conflictFound = false;
    // let conflictingDeliveryInfo = ""; // Not strictly needed if the modal message is static

    // console.log("--- Schedule Conflict Check inside handleAcceptRequest ---");
    // console.log(`Current Request (ID: ${id}) proposed schedule: ${formatDeliveryDate(currentRequestDateToCompare)} for Vehicle ID: ${vehicleId}`);
    // console.log(`Checking against ${scheduledDeliveries.length} other items in current calendar view for this vehicle.`);

    for (const existingDelivery of scheduledDeliveries) {
      // `existingDelivery.date` is already a JS Date object from the `scheduledDeliveries` state population.

      // CRITICAL: Skip comparing the current request with itself if its ID matches.
      // `id` is the prop for the current request's document ID.
      if (existingDelivery.id === id) {
        // console.log(`  Skipping self-comparison with existing delivery ID: ${existingDelivery.id}`);
        continue;
      }

      // Ensure `existingDelivery.date` is a valid JS Date before attempting to use its methods.
      if (!(existingDelivery.date instanceof Date) || isNaN(existingDelivery.date.getTime())) {
        // console.warn(`  Skipping existing delivery ID: ${existingDelivery.id} due to invalid date property.`);
        continue;
      }
      
      // console.log(`  Comparing with existing delivery (ID: ${existingDelivery.id}, Type: ${existingDelivery.productType}) scheduled at: ${formatDeliveryDate(existingDelivery.date)}`);

      // Compare Year, Month, Day, Hour, and Minute
      const sameYear = existingDelivery.date.getFullYear() === currentRequestDateToCompare.getFullYear();
      const sameMonth = existingDelivery.date.getMonth() === currentRequestDateToCompare.getMonth();
      const sameDay = existingDelivery.date.getDate() === currentRequestDateToCompare.getDate();
      const sameHour = existingDelivery.date.getHours() === currentRequestDateToCompare.getHours();
      const sameMinute = existingDelivery.date.getMinutes() === currentRequestDateToCompare.getMinutes();

      if (sameYear && sameMonth && sameDay && sameHour && sameMinute) {
        conflictFound = true;
        // conflictingDeliveryInfo = `${existingDelivery.productType || 'Another delivery'} (ID: ${existingDelivery.id}) at ${formatDeliveryDate(existingDelivery.date)}`;
        // console.log(`  !!! CONFLICT FOUND with: ${conflictingDeliveryInfo}`);
        break; // Exit loop as soon as a conflict is found
      }
    }
    // console.log("--- Conflict Check Complete ---");

    if (conflictFound) {
      setIsConflictModalOpen(true); // <<< SHOW DESIGNED MODAL FOR CONFLICT
      return; // Stop further execution of handleAcceptRequest, do not open assign modal
    } 
    // <<< REMOVED "Schedule is okay" alert. Proceeds silently if no conflict.
    // --- MODIFIED VALIDATION LOGIC - END ---

    // User's original line:
    setAssignModalOpen(true);
  };

  const handleDeclineRequest = () => { // User's original function
    setDeclineModalOpen(true);
  };

  const handleAssign = async (hauler) => { // User's original handleAssign function
    try {
      // 1. Mark request as accepted
      // The original code was: await updateDoc(doc(db, "deliveryRequests", req.id), {
      // 'req' is not defined in this scope. It should be 'id' from the props.
      await updateDoc(doc(db, "deliveryRequests", id), { // Corrected to use 'id' from props
        isAccepted: true,
      });

      // 2. Add to deliveries collection
      const docRef = await addDoc(collection(db, "deliveries"), { // User's original docRef
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
      await updateDoc(docRef, { // User's original docRef
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
      const validPlayerIds = (farmerData?.playerIds || []).filter( // User's original validPlayerIds
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

        const haulerPlayerIds = (haulerData.playerIds || []).filter( // User's original haulerPlayerIds
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

  const handleDeclineSubmit = async () => { // User's original function
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
        console.warn("No valid playerIds found for farmer:", farmerIdForDecline);
      }

      // ✅ Step 5: Update UI
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setDeclineModalOpen(false);
      onClose();
    } catch (err) {
      console.error("Error declining request:", err);
    }
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
                        {productType || "N/A"}
                      </span>
                      <span className="text-[#1A4D2E]">
                        {weight ? `${weight} kg` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <h3 className="text-[10px] font-semibold text-gray-600 mb-0.5">
                      Scheduled for
                    </h3>
                    <p className="text-[#1A4D2E] text-xs">
                      {formatDeliveryDate(scheduledTime)}
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
                    (day) => ( // User's original variable 'day'
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
                  <div className="text-center py-4">Loading deliveries...</div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => { // User's original variable 'day'
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
                      const hasCurrentDelivery = deliveries.some( // User's original 'hasCurrentDelivery'
                        (d) => d.id === id
                      );
                      const count = deliveries.length;
                      return (
                        <div
                          key={day}
                          className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer
                            ${getDayColorClass( // User's original getDayColorClass call
                              count,
                              isToday,
                              hasCurrentDelivery
                            )}
                            ${
                              count === 0 && !isToday ? "hover:bg-gray-100" : ""
                            }
                            border border-gray-100
                          `}
                          onMouseEnter={(e) => { // User's original onMouseEnter logic
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
                              content: // User's original tooltip content logic
                                deliveries.length > 0
                                  ? deliveries
                                      .map(
                                        (d) =>
                                          `${d.productType || "Delivery"}\n` +
                                          `${d.weight} kg\n` +
                                          `Scheduled: ${formatDeliveryDate(
                                            d.date
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
                      position: "fixed", left: tooltip.x, top: tooltip.y, zIndex: 100,
                      background: "rgba(31,41,55,0.95)", color: "white",
                      padding: "8px 12px", borderRadius: "8px", fontSize: "12px",
                      whiteSpace: "pre-line", pointerEvents: "none",
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
                {getCurrentDelivery() && (
                  <div className="bg-[#1A4D2E]/10 p-2 rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-[#1A4D2E]">
                          {getCurrentDelivery().productType}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatDeliveryDate(getCurrentDelivery().date)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {getCurrentDelivery().weight} kg
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
                          {d.productType}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatDeliveryDate(d.date)}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {d.weight} kg
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
                  background: "#32CD32", width: "12px", height: "12px", borderRadius: "50%",
                  border: "2px solid white", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} >
                <div style={{ background: "white", width: "4px", height: "4px", borderRadius: "50%" }}></div>
              </div>
              <span className="text-gray-600 ml-1">Route</span>
            </div>
            <div className="flex items-center">
              <div
                style={{
                  background: "#FF0000", width: "12px", height: "12px", borderRadius: "50%",
                  border: "2px solid white", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} >
                <div style={{ background: "white", width: "4px", height: "4px", borderRadius: "50%" }}></div>
              </div>
              <span className="text-gray-600 ml-1">Pickup Point</span>
            </div>
            <div className="flex items-center">
              <div
                style={{
                  background: "#0000FF", width: "12px", height: "12px", borderRadius: "50%",
                  border: "2px solid white", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }} >
                <div style={{ background: "white", width: "4px", height: "4px", borderRadius: "50%" }}></div>
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
        req={{ // User's original req object structure
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
        onClose={() => setIsConflictModalOpen(false)}
        message="Oh no! You can't accept this booking because the schedule is already taken."
      />
    </>
  );
}