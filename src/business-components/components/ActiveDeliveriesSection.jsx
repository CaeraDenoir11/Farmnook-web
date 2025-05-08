import { motion, AnimatePresence } from "framer-motion";

// This component shows all the deliveries that are currently in progress
// It's like a live status board for the business user
export default function ActiveDeliveriesSection({
  activeDeliveries, // List of all active deliveries
  isLoading, // Indicates whether the data is being loaded
  onTrackDelivery, // What to do when user clicks "Track Delivery"
}) {
  return (
    // The main container with a nice white background and shadow
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Header showing the title and number of active deliveries */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1A4D2E]">Active Deliveries</h2>
        <div className="text-sm text-gray-500">
          {activeDeliveries.length} Active Deliveries
        </div>
      </div>

      {/* The list of deliveries with a scrollbar if there are too many */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {isLoading ? (
          // Show loading state
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : activeDeliveries.length === 0 ? (
          // Show message when no deliveries
          <div className="text-center py-8 text-gray-500">
            No active deliveries at the moment
          </div>
        ) : (
          // Use AnimatePresence to smoothly animate deliveries in and out
          <AnimatePresence>
            {activeDeliveries.map((delivery) => (
              // Each delivery card with a smooth animation
              <motion.div
                key={delivery.deliveryId}
                initial={{ opacity: 0, y: 20 }} // Start slightly below and invisible
                animate={{ opacity: 1, y: 0 }} // Fade in and move up
                exit={{ opacity: 0, y: -20 }} // Fade out and move up when removed
                className="p-4 rounded-xl shadow-sm border border-gray-100 bg-white hover:bg-gray-50 transition-all duration-200"
              >
                {/* The main content of each delivery card */}
                <div className="flex justify-between items-start">
                  {/* Left side: Delivery details */}
                  <div className="space-y-2">
                    {/* Farmer and vehicle info */}
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#1A4D2E]">
                        {delivery.farmerName || "N/A"}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[#1A4D2E]/10 text-[#1A4D2E] rounded-full">
                        {delivery.vehicleName || "N/A"}
                      </span>
                    </div>

                    {/* Timestamp with a clock icon */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {delivery.createdAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Destination with a location icon */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate max-w-[200px]">
                          {delivery.destinationName}
                        </span>
                      </div>
                    </div>

                    {/* Hauler info with a person icon */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>Hauler: {delivery.haulerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Status and action button */}
                  <div className="flex flex-col items-end space-y-2">
                    {/* Status badge with different colors based on status */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === "On the Way"
                          ? "bg-green-100 text-green-800"
                          : delivery.status === "Going to Pickup"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {delivery.status}
                    </span>
                    {/* Track Delivery button */}
                    <button
                      onClick={() => onTrackDelivery(delivery)}
                      className="px-4 py-2 bg-[#1A4D2E] text-white text-sm rounded-lg hover:bg-[#1A4D2E]/90 transition-colors"
                    >
                      Track Delivery
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
