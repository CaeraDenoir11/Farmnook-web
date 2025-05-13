// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

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

  // Placeholder: scheduled deliveries (use provided scheduledTime and a few more for demo)
  const scheduledDeliveries = [
    {
      id: 1,
      date: new Date("2025-05-13T12:00:22+08:00"),
      label: "Delivery #1",
      productType: "Wheat",
      purpose: "crops",
      pickupName: "Ayala Center Cebu, Cebu City",
      destinationName: "Colon Street, Colon Street, Cebu City",
      receiverName: "Janelle Kikyam",
      weight: "150",
    },
    {
      id: 2,
      date: new Date("2025-05-13T15:30:00+08:00"),
      label: "Delivery #2",
      productType: "Corn",
      purpose: "crops",
      pickupName: "SM City Cebu",
      destinationName: "IT Park, Cebu City",
      receiverName: "Juan Dela Cruz",
      weight: "200",
    },
    {
      id: 3,
      date: new Date("2025-06-02T09:00:00+08:00"),
      label: "Delivery #3",
      productType: "Rice",
      purpose: "crops",
      pickupName: "Tabunok Market",
      destinationName: "Mandaue City",
      receiverName: "Maria Santos",
      weight: "100",
    },
  ];

  // Helper: get deliveries for a given day (1-based)
  const getDeliveriesForDay = (day) =>
    scheduledDeliveries.filter(
      (d) =>
        d.date.getDate() === day &&
        d.date.getMonth() === calendarMonth &&
        d.date.getFullYear() === calendarYear
    );

  // Helper: get deliveries for the current month
  const getDeliveriesForMonth = () =>
    scheduledDeliveries.filter(
      (d) =>
        d.date.getMonth() === calendarMonth &&
        d.date.getFullYear() === calendarYear
    );

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

  // Helper: get color class for a day based on delivery count
  const getDayColorClass = (count, isToday) => {
    if (count === 1) return "bg-orange-100 text-orange-800";
    if (count === 2) return "bg-orange-300 text-orange-800";
    if (count === 3) return "bg-orange-500 text-black";
    if (count === 4) return "bg-red-400 text-black";
    if (count >= 5) return "bg-red-800 text-black";
    if (isToday) return "bg-[#1A4D2E] text-white";
    return "";
  };

  return (
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
                    Schedule
                  </h3>
                  <p className="text-[#1A4D2E] text-xs">{formattedTime}</p>
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
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <div key={"empty-" + i} className="aspect-square" />;
                  }
                  const isToday =
                    day === today.getDate() &&
                    calendarMonth === today.getMonth() &&
                    calendarYear === today.getFullYear();
                  const deliveries = getDeliveriesForDay(day);
                  const count = deliveries.length;
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer
                        ${getDayColorClass(count, isToday)}
                        ${count === 0 && !isToday ? "hover:bg-gray-100" : ""}
                        border border-gray-100
                      `}
                      title=""
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
                                      `${d.label}: ${d.date.toLocaleTimeString(
                                        [],
                                        {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        }
                                      )}`
                                  )
                                  .join("\n")
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

            {/* Upcoming Deliveries (show time) */}
            <div className="flex-1 overflow-y-auto mt-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Upcoming Deliveries
              </h4>
              <div className="space-y-2">
                {getDeliveriesForMonth().map((d, index) => (
                  <div key={d.id} className="bg-gray-50 p-2 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {d.label}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {d.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {" • "}
                          {d.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#1A4D2E]/10 text-[#1A4D2E]">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Accept and Cancel Buttons (smaller) */}
            <div className="flex flex-col gap-2 mt-4">
              <button className="w-full bg-[#1A4D2E] text-white py-1.5 rounded font-semibold text-sm hover:bg-[#163c22] transition">
                Accept
              </button>
              <button className="w-full bg-red-500 text-white py-1.5 rounded font-semibold text-sm hover:bg-red-600 transition">
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
  );
}
