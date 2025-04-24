// MapModal.jsx
import Maps from "../business-components/Maps";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

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

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] relative flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="bg-[#1A4D2E] px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Delivery Route & Request Details
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
                Farmer Information
              </h3>
              <p className="text-[#1A4D2E] text-sm">{farmerName || "N/A"}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 mb-1">
                Delivery Purpose
              </h3>
              <p className="text-[#1A4D2E] text-sm">{purpose || "N/A"}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 mb-1">
                Product Details
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-[#1A4D2E]">{productType || "N/A"}</span>
                <span className="text-[#1A4D2E]">
                  {weight ? `${weight} kg` : "N/A"}
                </span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <h3 className="text-xs font-semibold text-gray-600 mb-1">
                Schedule
              </h3>
              <p className="text-[#1A4D2E] text-sm">{formattedTime}</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 relative">
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

        {/* Legend */}
        <div className="bg-white p-3 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-xs">
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
              <span className="text-gray-600 ml-2">Route</span>
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
              <span className="text-gray-600 ml-2">Pickup Point</span>
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
              <span className="text-gray-600 ml-2">Destination</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
