import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LiveTrackingMap from "../../map/LiveTrackingMap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../configs/firebase";

// Define delivery statuses and their colors
const DELIVERY_STATUSES = {
  GOING_TO_PICKUP: {
    label: "Going to Pickup",
    color: "#1A4D2E",
    icon: "🚚",
  },
  ARRIVED_AT_PICKUP: {
    label: "Arrived at Pickup",
    color: "#1A4D2E",
    icon: "📍",
  },
  ON_DELIVERY: {
    label: "On Delivery",
    color: "#1A4D2E",
    icon: "📦",
  },
  ARRIVED_AT_DESTINATION: {
    label: "Arrived at Destination",
    color: "#1A4D2E",
    icon: "✅",
  },
};

export default function LiveTrackingModal({ isOpen, onClose, deliveryData }) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("GOING_TO_PICKUP");
  const [eta, setEta] = useState(null);
  const [haulerSpeed, setHaulerSpeed] = useState(0);
  const [haulerInfo, setHaulerInfo] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);

  // Function to determine status based on boolean flags
  const determineStatus = (data) => {
    if (!data) return "GOING_TO_PICKUP";

    console.log("Checking delivery status:", {
      isStarted: data.isStarted,
      arrivedAtPickup: data.arrivedAtPickup,
      isOnDelivery: data.isOnDelivery,
      arrivedAtDestination: data.arrivedAtDestination,
    });

    if (data.arrivedAtDestination) {
      return "ARRIVED_AT_DESTINATION";
    } else if (data.isOnDelivery) {
      return "ON_DELIVERY";
    } else if (data.arrivedAtPickup) {
      return "ARRIVED_AT_PICKUP";
    } else if (data.isStarted) {
      return "GOING_TO_PICKUP";
    }
    return "GOING_TO_PICKUP";
  };

  // Update status when deliveryData changes
  useEffect(() => {
    if (deliveryData) {
      const newStatus = determineStatus(deliveryData);
      console.log("Status updated to:", newStatus);
      setCurrentStatus(newStatus);
    }
  }, [
    deliveryData?.isStarted,
    deliveryData?.arrivedAtPickup,
    deliveryData?.isOnDelivery,
    deliveryData?.arrivedAtDestination,
  ]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch hauler information
  useEffect(() => {
    const fetchHaulerInfo = async () => {
      if (!deliveryData?.haulerId) return;

      try {
        const haulerDoc = await getDoc(doc(db, "users", deliveryData.haulerId));
        if (haulerDoc.exists()) {
          const data = haulerDoc.data();
          setHaulerInfo({
            name: `${data.firstName} ${data.lastName}`,
            vehicleName: deliveryData.vehicleName || "N/A",
          });
        }
      } catch (error) {
        console.error("Error fetching hauler info:", error);
      }
    };

    fetchHaulerInfo();
  }, [deliveryData?.haulerId, deliveryData?.vehicleName]);

  // Fetch vehicle information
  useEffect(() => {
    const fetchVehicleInfo = async () => {
      if (!deliveryData?.vehicleId) return;

      try {
        const vehicleDoc = await getDoc(
          doc(db, "vehicles", deliveryData.vehicleId)
        );
        if (vehicleDoc.exists()) {
          const data = vehicleDoc.data();
          setVehicleInfo({
            model: data.model,
            vehicleType: data.vehicleType,
          });
        }
      } catch (error) {
        console.error("Error fetching vehicle info:", error);
      }
    };

    fetchVehicleInfo();
  }, [deliveryData?.vehicleId]);

  // Function to calculate ETA
  const calculateETA = (currentPos, destinationPos, speed) => {
    if (!currentPos || !destinationPos || !speed) return null;

    const R = 6371;
    const lat1 = (currentPos[0] * Math.PI) / 180;
    const lat2 = (destinationPos[0] * Math.PI) / 180;
    const dLat = ((destinationPos[0] - currentPos[0]) * Math.PI) / 180;
    const dLon = ((destinationPos[1] - currentPos[1]) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    return timeInMinutes;
  };

  // Function to format ETA
  const formatETA = (minutes) => {
    if (minutes === null) return "Calculating...";
    if (minutes < 1) return "Arriving now";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes} minutes`;
  };

  // Listen for hauler location updates
  useEffect(() => {
    if (!deliveryData?.haulerId) return;

    const handleHaulerUpdate = (event) => {
      const { latitude, longitude, speed } = event.detail;
      setHaulerSpeed(speed || 0);

      // Only calculate ETA if we're going to pickup or on delivery
      if (currentStatus === "GOING_TO_PICKUP") {
        const pickupCoords = deliveryData.pickupLocation.split(",").map(Number);
        const haulerPos = [latitude, longitude];
        const eta = calculateETA(haulerPos, pickupCoords, speed);
        setEta(eta);
      } else if (currentStatus === "ON_DELIVERY") {
        const destinationCoords = deliveryData.destinationLocation
          .split(",")
          .map(Number);
        const haulerPos = [latitude, longitude];
        const eta = calculateETA(haulerPos, destinationCoords, speed);
        setEta(eta);
      }
    };

    window.addEventListener("haulerLocationUpdate", handleHaulerUpdate);
    return () =>
      window.removeEventListener("haulerLocationUpdate", handleHaulerUpdate);
  }, [deliveryData, currentStatus]);

  // Add function to calculate distance between two points
  const calculateDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const lat1 = (point1[0] * Math.PI) / 180;
    const lat2 = (point2[0] * Math.PI) / 180;
    const dLat = ((point2[0] - point1[0]) * Math.PI) / 180;
    const dLon = ((point2[1] - point1[1]) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  if (!isOpen || !isMounted) return null;

  if (!deliveryData?.pickupLocation || !deliveryData?.destinationLocation) {
    console.error("Missing required pickup or destination coordinates");
    return null;
  }

  const currentStatusInfo =
    DELIVERY_STATUSES[currentStatus] || DELIVERY_STATUSES.GOING_TO_PICKUP;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] relative flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="bg-[#1A4D2E] px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Live Delivery Tracking
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors duration-200 text-2xl"
            >
              ⓧ
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 mb-1">
                Hauler Information
              </h3>
              <p className="text-[#1A4D2E] text-sm">
                {haulerInfo?.name || "Loading..."}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 mb-1">
                Vehicle Information
              </h3>
              <p className="text-[#1A4D2E] text-sm">
                {vehicleInfo
                  ? `${vehicleInfo.model} (${vehicleInfo.vehicleType})`
                  : deliveryData?.vehicleName &&
                    deliveryData.vehicleName !== "N/A"
                  ? deliveryData.vehicleName
                  : "Loading..."}
              </p>
            </div>
          </div>

          {/* Status Progress Bar */}
          <div className="mt-4 bg-white p-4 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Delivery Status
            </h3>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-1/4 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[#1A4D2E] transition-all duration-500 ease-in-out ${
                    currentStatus === "GOING_TO_PICKUP"
                      ? "w-1/4"
                      : currentStatus === "ARRIVED_AT_PICKUP"
                      ? "w-2/4"
                      : currentStatus === "ON_DELIVERY"
                      ? "w-3/4"
                      : "w-full"
                  }`}
                ></div>
              </div>

              {/* Status Points */}
              <div className="relative flex justify-between">
                {Object.entries(DELIVERY_STATUSES).map(([status, info]) => (
                  <div key={status} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStatus === status
                          ? "bg-[#1A4D2E] ring-4 ring-[#1A4D2E]/20"
                          : "bg-gray-100"
                      }`}
                    >
                      <span className="text-sm">{info.icon}</span>
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        currentStatus === status
                          ? "text-[#1A4D2E]"
                          : "text-gray-400"
                      }`}
                    >
                      {info.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <LiveTrackingMap
              pickup={deliveryData?.pickupLocation}
              drop={deliveryData?.destinationLocation}
              haulerId={deliveryData?.haulerId}
              height="100%"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white p-3 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#FF6B00] border-2 border-white shadow-sm"></div>
              <span className="text-gray-600 ml-2">Hauler Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#FF0000] border-2 border-white shadow-sm"></div>
              <span className="text-gray-600 ml-2">Pickup Point</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#0000FF] border-2 border-white shadow-sm"></div>
              <span className="text-gray-600 ml-2">Destination</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
