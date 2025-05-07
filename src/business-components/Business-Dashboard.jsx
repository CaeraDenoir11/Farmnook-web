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
  getDocs,
  onSnapshot,
  Timestamp,
  documentId,
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapModal from "../map/MapModal.jsx";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import MonthlyTransactionsCard from "../business-components/components/MonthlyTransactionsCard.jsx";
import useDeliveryRequests from "../assets/hooks/useDeliveryRequests.js";
import useNotifications from "../assets/hooks/useNotifications";
import LiveTrackingModal from "./components/LiveTrackingModal";

// Helper function to get week number within a month
const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const dayOfMonth = date.getDate();
  return Math.ceil((dayOfMonth + firstDay) / 7);
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
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
  return monthNames[monthIndex];
};

export default function BusinessDashboard() {
  // --- State Variables ---
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthName(new Date().getMonth()) + " " + new Date().getFullYear()
  );
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [readRequests, setReadRequests] = useState(() => {
    const saved = localStorage.getItem("readRequests");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAd, setShowAd] = useState(false);
  const [adClosable, setAdClosable] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [activeDeliveries, setActiveDeliveries] = useState([]);

  // --- Transaction Data State ---
  const [transactionData, setTransactionData] = useState({});
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);
  const [overallTotalEarnings, setOverallTotalEarnings] = useState(0);

  // --- Hooks ---
  const {
    requests,
    loading: loadingRequests,
    setRequests,
  } = useDeliveryRequests();

  // --- Fetch Auth State ---
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

  // --- Fetch Active Deliveries ---
  useEffect(() => {
    const businessId = auth.currentUser?.uid;
    if (!businessId) return;

    console.log("Fetching accepted requests for business:", businessId);

    const requestsRef = collection(db, "deliveryRequests");
    const requestsQuery = query(
      requestsRef,
      where("businessId", "==", businessId),
      where("isAccepted", "==", true)
    );

    const unsubscribeRequests = onSnapshot(
      requestsQuery,
      async (requestsSnapshot) => {
        console.log("Found accepted requests:", requestsSnapshot.size);

        const requests = requestsSnapshot.docs.map((doc) => ({
          requestId: doc.id,
          ...doc.data(),
        }));

        const activeDeliveriesPromises = requests.map(async (request) => {
          const deliveriesRef = collection(db, "deliveries");
          const deliveryQuery = query(
            deliveriesRef,
            where("requestId", "==", request.requestId),
            where("isStarted", "==", true),
            where("isDone", "==", false)
          );

          const deliverySnapshot = await getDocs(deliveryQuery);

          if (!deliverySnapshot.empty) {
            const delivery = deliverySnapshot.docs[0].data();
            let haulerInfo = null;
            if (delivery.haulerAssignedId) {
              const haulerDoc = await getDoc(
                doc(db, "users", delivery.haulerAssignedId)
              );
              if (haulerDoc.exists()) {
                const haulerData = haulerDoc.data();
                haulerInfo = {
                  name: `${haulerData.firstName} ${haulerData.lastName}`,
                  licenseNo: haulerData.licenseNo,
                  phoneNum: haulerData.phoneNum || "Not provided",
                  profileImg: haulerData.profileImg || null,
                };
              }
            }

            return {
              ...delivery,
              deliveryId: deliverySnapshot.docs[0].id,
              pickupLocation: request.pickupLocation,
              destinationLocation: request.destinationLocation,
              pickupName: request.pickupName,
              destinationName: request.destinationName,
              productType: request.productType,
              weight: request.weight,
              purpose: request.purpose,
              estimatedCost: request.estimatedCost,
              estimatedTime: request.estimatedTime,
              farmerName: request.farmerName,
              vehicleName: request.vehicleName,
              haulerName: haulerInfo?.name || "N/A",
              haulerLicense: haulerInfo?.licenseNo || "N/A",
              haulerPhone: haulerInfo?.phoneNum || "Not provided",
            };
          }
          return null;
        });

        const activeDeliveries = (
          await Promise.all(activeDeliveriesPromises)
        ).filter(Boolean);
        setActiveDeliveries(activeDeliveries);
      },
      (error) => {
        console.error("Error fetching accepted requests:", error);
      }
    );

    return () => unsubscribeRequests();
  }, []);

  // --- Process Transaction Data ---
  const processTransactionData = (
    historyItems,
    deliveryIdToRequestIdMap,
    requestIdToCostMap
  ) => {
    const monthlyAggregates = {};

    historyItems.forEach((item) => {
      if (
        !item.deliveryArrivalTime ||
        typeof item.deliveryArrivalTime.toDate !== "function"
      ) {
        console.warn(
          "Skipping history item due to invalid deliveryArrivalTime:",
          item
        );
        return;
      }
      const timestamp = item.deliveryArrivalTime.toDate();
      const year = timestamp.getFullYear();
      const monthIndex = timestamp.getMonth();
      const monthName = getMonthName(monthIndex);
      const weekNumber = getWeekOfMonth(timestamp);
      const weekKey = `Week ${weekNumber}`;
      const monthYearKey = `${monthName} ${year}`;

      const requestId = deliveryIdToRequestIdMap.get(item.deliveryId);
      let cost = 0;
      if (requestId) {
        const rawCost = requestIdToCostMap.get(requestId);
        if (typeof rawCost === "string") {
          cost = parseFloat(rawCost) || 0;
        } else if (typeof rawCost === "number") {
          cost = rawCost;
        }
      }

      if (!monthlyAggregates[monthYearKey]) {
        monthlyAggregates[monthYearKey] = {};
      }
      if (!monthlyAggregates[monthYearKey][weekKey]) {
        monthlyAggregates[monthYearKey][weekKey] = {
          transactions: 0,
          earnings: 0,
        };
      }
      monthlyAggregates[monthYearKey][weekKey].transactions++;
      monthlyAggregates[monthYearKey][weekKey].earnings += cost;
    });

    const formattedData = {};
    Object.keys(monthlyAggregates)
      .sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
      })
      .forEach((monthYearKey) => {
        const weeklyData = monthlyAggregates[monthYearKey];
        const chartEntriesForMonth = Object.keys(weeklyData)
          .map((weekKey) => ({
            week: weekKey,
            transactions: weeklyData[weekKey].transactions,
          }))
          .sort(
            (a, b) =>
              parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1])
          );

        const monthTotalTransactions = Object.values(weeklyData).reduce(
          (sum, week) => sum + week.transactions,
          0
        );
        const monthTotalEarnings = Object.values(weeklyData).reduce(
          (sum, week) => sum + week.earnings,
          0
        );

        formattedData[monthYearKey] = {
          chartEntries: chartEntriesForMonth,
          monthTotalTransactions: monthTotalTransactions,
          monthTotalEarnings: monthTotalEarnings,
        };
      });
    return formattedData;
  };

  // --- Fetch and Process Transaction Data Effect ---
  useEffect(() => {
    if (!currentBusinessId) {
      setLoadingTransactions(false);
      setTransactionData({});
      setOverallTotalEarnings(0);
      return;
    }
    setLoadingTransactions(true);

    const historyQuery = collection(db, "deliveryHistory");
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      async (historySnapshot) => {
        const deliveryHistories = historySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const validHistories = deliveryHistories.filter(
          (h) =>
            h.deliveryId &&
            h.deliveryArrivalTime &&
            h.deliveryArrivalTime.toDate
        );

        if (validHistories.length === 0) {
          setTransactionData({});
          setOverallTotalEarnings(0);
          setLoadingTransactions(false);
          return;
        }

        const deliveryDocIdsFromHistory = [
          ...new Set(validHistories.map((item) => item.deliveryId)),
        ];
        const deliveryDocsSnap = await Promise.all(
          deliveryDocIdsFromHistory.map((id) =>
            getDoc(doc(db, "deliveries", id))
          )
        );
        const deliveries = deliveryDocsSnap
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));
        const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

        if (deliveries.length === 0) {
          setTransactionData({});
          setOverallTotalEarnings(0);
          setLoadingTransactions(false);
          return;
        }

        const haulerIds = [
          ...new Set(deliveries.map((d) => d.haulerAssignedId).filter(Boolean)),
        ];
        if (haulerIds.length === 0) {
          setTransactionData({});
          setOverallTotalEarnings(0);
          setLoadingTransactions(false);
          return;
        }

        const haulerQueryPromises = [];
        for (let i = 0; i < haulerIds.length; i += 30) {
          const batch = haulerIds.slice(i, i + 30);
          haulerQueryPromises.push(
            getDocs(
              query(collection(db, "users"), where("userId", "in", batch))
            )
          );
        }
        const haulerSnapshots = await Promise.all(haulerQueryPromises);
        const haulerMap = new Map();
        haulerSnapshots.forEach((snap) =>
          snap.docs.forEach((d) => haulerMap.set(d.data().userId, d.data()))
        );

        const businessHistoryItems = validHistories.filter((history) => {
          const delivery = deliveryMap.get(history.deliveryId);
          if (!delivery || !delivery.haulerAssignedId) return false;
          const hauler = haulerMap.get(delivery.haulerAssignedId);
          return hauler && hauler.businessId === currentBusinessId;
        });

        if (businessHistoryItems.length === 0) {
          setTransactionData({});
          setOverallTotalEarnings(0);
          setLoadingTransactions(false);
          return;
        }

        const requestIdsToFetch = [];
        const deliveryIdToRequestIdMap = new Map();
        businessHistoryItems.forEach((hItem) => {
          const delivery = deliveryMap.get(hItem.deliveryId);
          if (delivery && delivery.requestId) {
            requestIdsToFetch.push(delivery.requestId);
            deliveryIdToRequestIdMap.set(hItem.deliveryId, delivery.requestId);
          }
        });

        const uniqueRequestIds = [...new Set(requestIdsToFetch)];
        const deliveryRequestsData = [];
        if (uniqueRequestIds.length > 0) {
          const requestPromises = [];
          for (let i = 0; i < uniqueRequestIds.length; i += 30) {
            const batchIds = uniqueRequestIds.slice(i, i + 30);
            requestPromises.push(
              getDocs(
                query(
                  collection(db, "deliveryRequests"),
                  where(documentId(), "in", batchIds)
                )
              )
            );
          }
          const requestSnapshots = await Promise.all(requestPromises);
          requestSnapshots.forEach((snapshot) => {
            snapshot.docs.forEach((d) =>
              deliveryRequestsData.push({ id: d.id, ...d.data() })
            );
          });
        }
        const requestIdToCostMap = new Map(
          deliveryRequestsData.map((req) => [req.id, req.estimatedCost])
        );

        const processedData = processTransactionData(
          businessHistoryItems,
          deliveryIdToRequestIdMap,
          requestIdToCostMap
        );
        setTransactionData(processedData);

        const currentOverallEarnings = Object.values(processedData).reduce(
          (total, monthData) => total + (monthData.monthTotalEarnings || 0),
          0
        );
        setOverallTotalEarnings(currentOverallEarnings);

        const availableMonthsForSelection = Object.keys(processedData);
        if (availableMonthsForSelection.length > 0) {
          if (!processedData[selectedMonth]) {
            setSelectedMonth(
              availableMonthsForSelection[
                availableMonthsForSelection.length - 1
              ]
            );
          }
        } else {
          setSelectedMonth(
            getMonthName(new Date().getMonth()) + " " + new Date().getFullYear()
          );
        }

        setLoadingTransactions(false);
      },
      (error) => {
        console.error("Error fetching transaction data:", error);
        setLoadingTransactions(false);
        setTransactionData({});
        setOverallTotalEarnings(0);
      }
    );
    return () => unsubscribeHistory();
  }, [currentBusinessId]);

  // --- Ad Countdown Timer ---
  useEffect(() => {
    if (showAd && secondsLeft > 0) {
      const timer = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (showAd && secondsLeft === 0 && !adClosable) {
      setAdClosable(true);
    }
  }, [showAd, secondsLeft, adClosable]);

  // --- Open Map Modal Function ---
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

  // --- Handle Track Delivery ---
  const handleTrackDelivery = (delivery) => {
    setSelectedDelivery({
      haulerId: delivery.haulerAssignedId,
      haulerName: delivery.haulerName || "N/A",
      vehicleId: delivery.vehicleId,
      vehicleName: delivery.vehicleName || "N/A",
      status: delivery.status,
      productType: delivery.productType,
      weight: delivery.weight,
      timestamp: delivery.createdAt,
      pickupLocation: delivery.pickupLocation,
      destinationLocation: delivery.destinationLocation,
      estimatedArrival: delivery.estimatedTime,
      requestId: delivery.requestId,
      isStarted: delivery.isStarted,
      arrivedAtPickup: delivery.arrivedAtPickup,
      arrivedAtDestination: delivery.arrivedAtDestination,
      pickupName: delivery.pickupName,
      destinationName: delivery.destinationName,
      purpose: delivery.purpose,
      estimatedCost: delivery.estimatedCost,
      farmerName: delivery.farmerName,
    });
    setShowLiveTracking(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-8">
            Business Dashboard
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-8 py-8">
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
                                  onClick={() => {
                                    setSelectedRequest(req);
                                    setAssignModalOpen(true);
                                  }}
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
          </div>

          {/* Transactions Section */}
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

        {/* Active Deliveries Section */}
        <div className="mt-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#1A4D2E]">
                Active Deliveries
              </h2>
              <div className="text-sm text-gray-500">
                {activeDeliveries.length} Active Deliveries
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No active deliveries at the moment.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {activeDeliveries.map((delivery) => (
                    <motion.div
                      key={delivery.deliveryId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 rounded-xl shadow-sm border border-gray-100 bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#1A4D2E]">
                              {delivery.farmerName || "N/A"}
                            </span>
                            <span className="text-xs px-2 py-1 bg-[#1A4D2E]/10 text-[#1A4D2E] rounded-full">
                              {delivery.vehicleName || "N/A"}
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
                              <span>
                                {delivery.createdAt?.toDate().toLocaleString()}
                              </span>
                            </div>
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
                        <div className="flex flex-col items-end space-y-2">
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
                          <button
                            onClick={() => handleTrackDelivery(delivery)}
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
      <LiveTrackingModal
        isOpen={showLiveTracking}
        onClose={() => setShowLiveTracking(false)}
        deliveryData={selectedDelivery}
      />
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
