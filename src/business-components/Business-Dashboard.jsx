import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../configs/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import MapModal from "../map/MapModal.jsx";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";
import MonthlyTransactionsCard from "../business-components/components/MonthlyTransactionsCard.jsx";
import useDeliveryRequests from "../assets/hooks/useDeliveryRequests.js";
import useNotifications from "../assets/hooks/useNotifications";
import LiveTrackingModal from "./components/LiveTrackingModal";
import DeliveryRequestsSection from "./components/DeliveryRequestsSection";
import ActiveDeliveriesSection from "./components/ActiveDeliveriesSection";
import { useTransactionData } from "./hooks/useTransactionData";
import { useActiveDeliveries } from "./hooks/useActiveDeliveries";
import { getMonthName } from "./utils/dateUtils.js";

/**
 * BusinessDashboard Component
 * Main dashboard component for business users that displays:
 * - Delivery requests
 * - Monthly transactions
 * - Active deliveries
 * - Various modals for tracking and accepting deliveries
 */
export default function BusinessDashboard() {
  // --- State Variables ---
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthName(new Date().getMonth()) + " " + new Date().getFullYear()
  );
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });
  const [readRequests, setReadRequests] = useState(() => {
    const saved = localStorage.getItem("readRequests");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAd, setShowAd] = useState(false);
  const [adClosable, setAdClosable] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);

  // --- Custom Hooks ---
  const {
    requests,
    loading: loadingRequests,
    setRequests,
  } = useDeliveryRequests();

  const {
    deliveryRequests,
    loadingRequests: loadingRequestsDelivery,
    readRequests: readRequestsDelivery,
    setReadRequests: setReadRequestsDelivery,
  } = useDeliveryRequests();
  const { activeDeliveries, isLoading: loadingDeliveries } =
    useActiveDeliveries();
  const { transactionData, loadingTransactions, overallTotalEarnings } =
    useTransactionData(currentBusinessId);

  // --- Effects ---
  // Check if someone is logged in and remember who they are
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentBusinessId(user.uid);
        const subRef = query(
          collection(db, "subscriptions"),
          where("businessId", "==", user.uid)
        );
        const unsubscribeSnapshot = onSnapshot(subRef, (snapshot) => {
          if (snapshot.empty) {
            setShowAd(true);
            setSecondsLeft(5);
            setAdClosable(false);
            const timerId = setTimeout(() => setAdClosable(true), 5000);
            return () => clearTimeout(timerId);
          } else {
            setShowAd(false);
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        setCurrentBusinessId(null);
        setTransactionData({});
        setOverallTotalEarnings(0);
        setLoadingTransactions(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Count down the timer for the ad before they can close it
  useEffect(() => {
    if (showAd && secondsLeft > 0) {
      const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (showAd && secondsLeft === 0 && !adClosable) {
      setAdClosable(true);
    }
  }, [showAd, secondsLeft, adClosable]);

  // --- Event Handlers ---
  /**
   * Opens the map modal with delivery request details
   * @param {string} pickup - Pickup location coordinates
   * @param {string} drop - Drop location coordinates
   * @param {string} farmerName - Name of the farmer
   * @param {string} purpose - Purpose of delivery
   * @param {string} productType - Type of product
   * @param {number} weight - Weight of delivery
   * @param {Date} timestamp - Request timestamp
   * @param {string} id - Request ID
   * @param {string} vehicleId - Vehicle ID
   * @param {Date} scheduledTime - Scheduled time for the delivery
   */
  const openMapModal = (
    pickup,
    drop,
    farmerName,
    purpose,
    productType,
    weight,
    timestamp,
    id,
    vehicleId,
    scheduledTime
  ) => {
    setMapPoints({
      pickup,
      drop,
      farmerName,
      purpose,
      productType,
      weight,
      timestamp,
      vehicleId,
      scheduledTime,
      id,
    });
    setReadRequests((prev) => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem("readRequests", JSON.stringify(updated));
      return updated;
    });
    setModalOpen(true);
  };

  /**
   * Handles tracking of a delivery
   * @param {Object} delivery - Delivery object containing tracking information
   */
  const handleTrackDelivery = (delivery) => {
    // Save all the delivery info we need for tracking
    setSelectedDelivery({
      haulerId: delivery.haulerAssignedId,
      haulerName: delivery.haulerName || "N/A",
      vehicleId: delivery.vehicleId,
      vehicleName: delivery.vehicleName || "N/A",
      status: delivery.isDone
        ? "Completed"
        : delivery.arrivedAtDestination
        ? "Arrived at Destination"
        : delivery.arrivedAtPickup
        ? "Arrived at Pickup"
        : delivery.isStarted
        ? "In Transit"
        : "Not Started",
      productType: delivery.productType,
      weight: delivery.weight,
      timestamp: delivery.createdAt,
      pickupLocation: delivery.pickupLocation,
      destinationLocation: delivery.destinationLocation,
      estimatedCost: delivery.estimatedCost,
      requestId: delivery.requestId,
      isStarted: delivery.isStarted,
      arrivedAtPickup: delivery.arrivedAtPickup,
      arrivedAtDestination: delivery.arrivedAtDestination,
      pickupName: delivery.pickupName,
      destinationName: delivery.destinationName,
      purpose: delivery.purpose,
      farmerName: delivery.farmerName,
      isDone: delivery.isDone,
    });
    // Show the tracking screen
    setShowLiveTracking(true);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-8">
            Business Dashboard
          </h1>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-8xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Requests Section - Takes 2/3 of the grid */}
          <div className="lg:col-span-2">
            <DeliveryRequestsSection
              requests={requests}
              loadingRequests={loadingRequests}
              readRequests={readRequests}
              setReadRequests={setReadRequests}
              onViewDetails={(req) =>
                openMapModal(
                  req.pickupLocation,
                  req.destinationLocation,
                  req.farmerName,
                  req.purpose,
                  req.productType,
                  req.weight,
                  req.timestamp,
                  req.id,
                  req.vehicleId,
                  req.scheduledTime
                )
              }
            />
          </div>

          {/* Transactions Section - Takes 1/3 of the grid */}
          <div className="lg:col-span-1">
            <MonthlyTransactionsCard
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              transactionData={transactionData}
              isLoading={loadingTransactions}
              overallTotalEarnings={overallTotalEarnings}
            />
          </div>
        </div>

        {/* Active Deliveries Section - Full width below the grid */}
        <div className="mt-6">
          <ActiveDeliveriesSection
            activeDeliveries={activeDeliveries}
            isLoading={loadingDeliveries}
            onTrackDelivery={handleTrackDelivery}
          />
        </div>
      </div>

      {/* Modal Components */}
      {/* Modal for displaying delivery route map */}
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
        vehicleId={mapPoints.vehicleId}
        id={mapPoints.id}
        scheduledTime={mapPoints.scheduledTime}
        setRequests={setRequests}
      />

      {/* Modal for live delivery tracking */}
      <LiveTrackingModal
        isOpen={showLiveTracking}
        onClose={() => setShowLiveTracking(false)}
        deliveryData={selectedDelivery}
      />

      {/* Advertisement Modal */}
      <Modal
        isOpen={showAd}
        onRequestClose={() => {
          if (adClosable) setShowAd(false);
        }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        overlayClassName="fixed inset-0 bg-black/50 z-50"
        shouldCloseOnOverlayClick={adClosable}
        ariaHideApp={false}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-md mx-auto w-full"
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
              You can close this ad in {secondsLeft}{" "}
              {secondsLeft === 1 ? "second" : "seconds"}...
            </p>
          )}
        </motion.div>
      </Modal>
    </div>
  );
}
