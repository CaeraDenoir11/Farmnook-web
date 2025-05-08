import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// This component shows all the delivery requests that need attention
// It's like a to-do list for the business user
export default function DeliveryRequestsSection({
  requests, // List of all delivery requests
  loadingRequests, // Whether we're still loading the requests
  readRequests, // Which requests the user has already seen
  setReadRequests, // Function to mark requests as read
  onViewDetails, // What to do when user clicks "View Details"
  onAcceptRequest, // What to do when user clicks "Accept Request"
}) {
  return (
    // The main container with a nice white background and shadow
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
      {/* Header showing the title and number of active requests */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1A4D2E]">Delivery Requests</h2>
        <div className="text-sm text-gray-500">
          {requests.length} Active Requests
        </div>
      </div>

      {/* The list of requests with a scrollbar if there are too many */}
      <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
        {/* Show a loading spinner while we're getting the requests */}
        {loadingRequests ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
          </div>
        ) : requests.length === 0 ? (
          // Show a message if there are no requests
          <div className="text-center py-8">
            <p className="text-gray-500">No pending delivery requests.</p>
          </div>
        ) : (
          // Use AnimatePresence to smoothly animate requests in and out
          <AnimatePresence>
            {requests.map((req) => {
              // Format the timestamp into a nice readable date
              const formattedTime = req.timestamp?.toDate
                ? req.timestamp.toDate().toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "N/A";

              return (
                // Each request card with a smooth animation
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }} // Start slightly below and invisible
                  animate={{ opacity: 1, y: 0 }} // Fade in and move up
                  exit={{ opacity: 0, y: -20 }} // Fade out and move up when removed
                  className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 ${
                    readRequests.includes(req.id)
                      ? "bg-[#F5EFE6] hover:bg-[#F0E9D8]" // Different background for read requests
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {/* The main content of each request card */}
                  <div className="flex justify-between items-start">
                    {/* Left side: Farmer and vehicle info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#1A4D2E]">
                          {req.farmerName}
                        </span>
                        <span className="text-xs px-2 py-1 bg-[#1A4D2E]/10 text-[#1A4D2E] rounded-full">
                          {req.vehicleName}
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
                          <span>{formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Action buttons */}
                    <div className="flex flex-col items-end space-y-2">
                      {/* View Details button */}
                      <button
                        className="text-[#1A4D2E] hover:text-[#1A4D2E]/80 text-sm font-medium transition-colors"
                        onClick={() => onViewDetails(req)}
                      >
                        View Details
                      </button>
                      {/* Accept button - disabled if request is cancelled */}
                      {req.status === "Cancelled" ? (
                        <button
                          className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg cursor-not-allowed"
                          disabled
                        >
                          Cancelled
                        </button>
                      ) : (
                        <button
                          className="px-4 py-2 bg-[#1A4D2E] text-white text-sm rounded-lg hover:bg-[#1A4D2E]/90 transition-colors"
                          onClick={() => onAcceptRequest(req)}
                        >
                          Accept Request
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
