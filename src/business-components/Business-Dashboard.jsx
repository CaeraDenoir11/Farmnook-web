import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapModal from "../map/MapModal.jsx";
import Maps from "./Maps";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import MonthlyTransactionsCard from "../business-components/components/MonthlyTransactionsCard.jsx";
import useDeliveryRequests from "../assets/hooks/useDeliveryRequests.js";
import useNotifications from "../assets/hooks/useNotifications";

const monthlyData = {
  January: [
    { week: "Week 1", transactions: 10 },
    { week: "Week 2", transactions: 15 },
    { week: "Week 3", transactions: 20 },
    { week: "Week 4", transactions: 25 },
  ],
  February: [
    { week: "Week 1", transactions: 12 },
    { week: "Week 2", transactions: 18 },
    { week: "Week 3", transactions: 24 },
    { week: "Week 4", transactions: 30 },
  ],
  March: [
    { week: "Week 1", transactions: 20 },
    { week: "Week 2", transactions: 25 },
    { week: "Week 3", transactions: 30 },
    { week: "Week 4", transactions: 35 },
  ],
};

export default function BusinessDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [readRequests, setReadRequests] = useState(() => {
    const saved = localStorage.getItem("readRequests");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ Ad modal state
  const [showAd, setShowAd] = useState(false);
  const [adClosable, setAdClosable] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5); // Track remaining time for ad

  // ✅ Check subscription status and show ad
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const subRef = query(
          collection(db, "subscriptions"),
          where("businessId", "==", user.uid)
        );
        const unsubscribeSnapshot = onSnapshot(subRef, (snapshot) => {
          if (snapshot.empty) {
            // User is not subscribed
            setShowAd(true);
            setTimeout(() => setAdClosable(true), 5000); // Make it closable after 5s
          } else {
            // User is subscribed, hide the ad
            setShowAd(false);
          }
        });
        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ Countdown timer for ad
  useEffect(() => {
    if (showAd && secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer); // Clean up timer on unmount or when secondsLeft changes
    } else if (secondsLeft === 0) {
      setAdClosable(true); // Make ad closable after 5 seconds
    }
  }, [showAd, secondsLeft]);

  const {
    requests,
    loading: loadingRequests,
    setRequests,
  } = useDeliveryRequests(); //Fetching delivery requests
  // Realtime Notifications (NEW WAY)
  const {
    notifications,
    loading: loadingNotifications,
    error,
  } = useNotifications();

  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth]);

  const openMapModal = (
    pickup,
    drop,
    farmerName,
    purpose,
    productType,
    weight,
    timestamp,
    id
  ) => {
    setMapPoints({
      pickup,
      drop,
      farmerName,
      purpose,
      productType,
      weight,
      timestamp,
    });

    setReadRequests((prev) => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem("readRequests", JSON.stringify(updated));
      return updated;
    });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1A4D2E] w-full py-6 px-8 shadow-lg">
        <div className="max-w-8xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Business Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NotificationButton
              notifications={notifications}
              loading={loadingNotifications}
              error={error}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Requests Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#1A4D2E]">
                  Delivery Requests
                </h2>
                <div className="text-sm text-gray-500">
                  {requests.length} Active Requests
                </div>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {loadingRequests ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No pending delivery requests.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {requests.map((req) => {
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
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`p-4 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 ${
                            readRequests.includes(req.id)
                              ? "bg-[#F5EFE6] hover:bg-[#F0E9D8]"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-[#1A4D2E]">
                                  {req.farmerName}
                                </span>
                                <span className="text-xs px-2 py-1 bg-[#1A4D2E]/10 text-[#1A4D2E] rounded-full">
                                  {req.vehicleName}
                                </span>
                              </div>
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
                            <div className="flex flex-col items-end space-y-2">
                              <button
                                className="text-[#1A4D2E] hover:text-[#1A4D2E]/80 text-sm font-medium transition-colors"
                                onClick={() =>
                                  openMapModal(
                                    req.pickupLocation,
                                    req.destinationLocation,
                                    req.farmerName,
                                    req.purpose,
                                    req.productType,
                                    req.weight,
                                    req.timestamp,
                                    req.id
                                  )
                                }
                              >
                                View Details
                              </button>
                              <button
                                className="px-4 py-2 bg-[#1A4D2E] text-white text-sm rounded-lg hover:bg-[#1A4D2E]/90 transition-colors"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setAssignModalOpen(true);
                                }}
                              >
                                Accept Request
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="lg:col-span-1">
            <MonthlyTransactionsCard
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              monthlyData={monthlyData}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AcceptRequestModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={(hauler) => setAssignModalOpen(false)}
        req={selectedRequest}
        setRequests={setRequests}
      />

      <MapModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pickup={mapPoints.pickup}
        drop={mapPoints.drop}
        farmerName={mapPoints.farmerName}
        purpose={mapPoints.purpose}
        productType={mapPoints.productType}
        weight={mapPoints.weight}
        timestamp={mapPoints.timestamp}
      />

      {/* Ad Modal */}
      <Modal
        isOpen={showAd}
        onRequestClose={() => {
          if (adClosable) setShowAd(false);
        }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        overlayClassName="Overlay"
        shouldCloseOnOverlayClick={adClosable}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-md mx-auto"
        >
          <h2 className="text-2xl font-bold mb-4 text-[#1A4D2E]">
            🚀 Upgrade Your Experience
          </h2>
          <p className="mb-6 text-gray-600">
            Unlock premium features and remove ads by subscribing to our
            service.
          </p>
          {adClosable ? (
            <button
              onClick={() => setShowAd(false)}
              className="bg-[#1A4D2E] text-white px-6 py-2 rounded-lg hover:bg-[#1A4D2E]/90 transition-colors"
            >
              Close Ad
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              You can close this ad in {secondsLeft} seconds...
            </p>
          )}
        </motion.div>
      </Modal>
    </div>
  );
}
