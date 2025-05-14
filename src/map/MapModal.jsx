// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
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
import DeclineModal from "../business-components/components/DeclineDialog.jsx";

export default function MapModal({
  isOpen,
  onClose,
  pickup,
  drop,
  farmerName,
  purpose,
  productType,
  weight,
  timestamp,
  vehicleId,
  id,
  scheduledTime,
  setRequests,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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

  console.log(vehicleId);

  // Dynamic calendar state
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

  // --- Firestore fetching for scheduled deliveries ---
  const [scheduledDeliveries, setScheduledDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vehicleId) return;
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

    // Debug logs
    console.log("Query parameters:", {
      vehicleId,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
    });

    const q = query(deliveriesRef, where("vehicleId", "==", vehicleId));

    getDocs(q)
      .then((querySnapshot) => {
        console.log("Raw query results:", querySnapshot.size, "documents");

        const deliveries = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Document data:", data);

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

        console.log("Filtered deliveries for calendar:", deliveries);
        setScheduledDeliveries(deliveries);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching deliveries:", error);
        setLoading(false);
      });
  }, [vehicleId, calendarYear, calendarMonth]);

  // Helper: get deliveries for a given day (1-based)
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

  // Helper: get deliveries for the current month
  const getDeliveriesForMonth = () => {
    return scheduledDeliveries.filter((d) => {
      const deliveryDate = d.date;
      return (
        deliveryDate.getMonth() === calendarMonth &&
        deliveryDate.getFullYear() === calendarYear
      );
    });
  };

  // Helper: get current delivery (the one that was clicked)
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

  // Helper: get upcoming deliveries (excluding current)
  const getUpcomingDeliveries = () => {
    return scheduledDeliveries.filter((d) => d.id !== id);
  };

  // Helper: get color class for a day based on delivery count and current delivery
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

  // Format date for display
  const formatDeliveryDate = (date) => {
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

  const formattedTime = timestamp?.toDate
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

  console.log(scheduledDeliveries);

  const handleAcceptRequest = () => {
    setAssignModalOpen(true);
  };

  const handleDeclineRequest = () => {
    setDeclineModalOpen(true);
  };

  const handleAssign = async (hauler) => {
    try {
      // 1. Mark request as accepted
      await updateDoc(doc(db, "deliveryRequests", id), {
        isAccepted: true,
      });

      // 2. Add to deliveries collection
      const docRef = await addDoc(collection(db, "deliveries"), {
        requestId: id,
        haulerAssignedId: hauler.id,
        vehicleId: vehicleId,
        createdAt: new Date(),
        isStarted: false,
        arrivedAtPickup: false,
        arrivedAtDestination: false,
        isDone: false,
        isValidated: false,
        farmerId: hauler.farmerId,
        scheduledTime: scheduledTime,
      });
      await updateDoc(docRef, {
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

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: hauler.farmerId,
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // 5. Send OneSignal push
      const farmerDoc = await getDoc(doc(db, "users", hauler.farmerId));
      const farmerData = farmerDoc.exists() ? farmerDoc.data() : null;
      const validPlayerIds = (farmerData?.playerIds || []).filter(
        (id) => typeof id === "string" && id.length >= 10
      );
      if (validPlayerIds.length) {
        await sendPushNotification(validPlayerIds, businessName, message, {
          openTarget: "FarmerDashboardFragment",
          farmerId: hauler.farmerId,
        });
      }

      // 6. Notify the assigned hauler
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
        }
      }
    } catch (err) {
      console.error("Error assigning hauler:", err);
    }
  };

  const handleDeclineSubmit = async () => {
    try {
      // Update the request status in Firestore
      await updateDoc(doc(db, "deliveryRequests", id), {
        isDeclined: true,
        declineReason: declineReason,
        declinedAt: Timestamp.now(),
        declinedBy: currentUser.uid,
      });

      // Create notification for the farmer
      const businessId = currentUser.uid;
      const businessDoc = await getDoc(doc(db, "users", businessId));
      const businessData = businessDoc.exists() ? businessDoc.data() : {};
      const businessName = businessData?.businessName || "Your Business";
      const message = `Your delivery request has been declined by ${businessName}`;

      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        notificationId: notifRef.id,
        recipientId: farmerId,
        title: businessName,
        message,
        timestamp: Timestamp.now(),
        isRead: false,
      });

      // Update UI
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
                    (day) => (
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
                    {calendarDays.map((day, i) => {
                      if (day === null) {
                        return (
                          <div key={"empty-" + i} className="aspect-square" />
                        );
                      }
                      const isToday =
                        day === today.getDate() &&
                        calendarMonth === today.getMonth() &&
                        calendarYear === today.getFullYear();
                      const deliveries = getDeliveriesForDay(day);
                      const hasCurrentDelivery = deliveries.some(
                        (d) => d.id === id
                      );
                      const count = deliveries.length;
                      return (
                        <div
                          key={day}
                          className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer
                            ${getDayColorClass(
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
                              content:
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

              {/* Upcoming Deliveries Section */}
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
              {/* Accept and Cancel Buttons (smaller) */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleAcceptRequest}
                  className="w-full bg-[#1A4D2E] text-white py-1.5 rounded font-semibold text-sm hover:bg-[#163c22] transition"
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineRequest}
                  className="w-full bg-red-500 text-white py-1.5 rounded font-semibold text-sm hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Legend (always visible) */}
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

      {/* Accept Request Modal - Moved outside the main modal */}
      <AcceptRequestModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssign}
        req={{
          id,
          vehicleId,
          farmerId: currentUser?.uid,
          scheduledTime,
        }}
        setRequests={setRequests}
      />

      {/* Decline Modal */}
      <DeclineModal
        isOpen={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        onSubmit={handleDeclineSubmit}
        reason={declineReason}
        setReason={setDeclineReason}
      />
    </>
  );
}
