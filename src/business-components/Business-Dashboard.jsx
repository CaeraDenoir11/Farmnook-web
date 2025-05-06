import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs, // Added getDocs
  onSnapshot,
  Timestamp, // Added Timestamp for type checking
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapModal from "../map/MapModal.jsx";
// import Maps from "./Maps"; // Maps component not used in the provided code snippet
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx"; // Not used here, but kept import
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import MonthlyTransactionsCard from "../business-components/components/MonthlyTransactionsCard.jsx";
import useDeliveryRequests from "../assets/hooks/useDeliveryRequests.js";
import useNotifications from "../assets/hooks/useNotifications"; // Not used here, but kept import

// Helper function to get week number within a month
const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const dayOfMonth = date.getDate();
  // Adjust dayOfMonth based on the first day of the month (0=Sun, 1=Mon, etc.)
  // This calculation assumes week starts on Sunday. Adjust if needed.
  return Math.ceil((dayOfMonth + firstDay) / 7);
};

// Helper function to get month name
const getMonthName = (monthIndex) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return monthNames[monthIndex];
};

export default function BusinessDashboard() {
  // --- Existing State ---
  const [selectedMonth, setSelectedMonth] = useState(getMonthName(new Date().getMonth())); // Default to current month
  const [selectedRequest, setSelectedRequest] = useState(null);
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

  // --- New State for Transaction Data ---
  const [transactionData, setTransactionData] = useState({}); // Will store { Month: [{ week: 'Week 1', transactions: count }, ...] }
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [currentBusinessId, setCurrentBusinessId] = useState(null);

  // --- Hooks ---
  const {
    requests,
    loading: loadingRequests,
    setRequests,
  } = useDeliveryRequests();
  // const { notifications, loading: loadingNotifications, error } = useNotifications(); // Keep if needed elsewhere

  // --- Fetch and Process Transaction Data ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentBusinessId(user.uid);
            // Subscription check logic (kept as is)
            const subRef = query(collection(db, "subscriptions"), where("businessId", "==", user.uid));
            const unsubscribeSnapshot = onSnapshot(subRef, (snapshot) => {
                if (snapshot.empty) {
                    setShowAd(true);
                    setSecondsLeft(5); // Reset timer
                    setAdClosable(false);
                    const timerId = setTimeout(() => setAdClosable(true), 5000);
                    // Clear timeout if component unmounts or subscription status changes before 5s
                    return () => clearTimeout(timerId);
                } else {
                    setShowAd(false);
                }
            });
            return () => unsubscribeSnapshot(); // Cleanup subscription listener
        } else {
            setCurrentBusinessId(null);
            setTransactionData({}); // Clear data if user logs out
            setLoadingTransactions(true);
        }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
}, []);


  // Effect for fetching and processing transaction data when businessId is known
  useEffect(() => {
      if (!currentBusinessId) {
          setLoadingTransactions(false); // Not loading if no user
          return;
      }

      setLoadingTransactions(true);

      const historyQuery = collection(db, "deliveryHistory");

      const unsubscribeHistory = onSnapshot(historyQuery, async (historySnapshot) => {
          console.log("Fetched raw history count:", historySnapshot.docs.length);

          const deliveryHistories = historySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
          }));

          // Filter out entries without deliveryId or arrival time
          const validHistories = deliveryHistories.filter(
              (h) => h.deliveryId && h.deliveryArrivalTime && h.deliveryArrivalTime.toDate
          );

          if (validHistories.length === 0) {
              console.log("No valid history entries with deliveryId and arrival time.");
              setTransactionData({});
              setLoadingTransactions(false);
              return;
          }

          const deliveryIds = [...new Set(validHistories.map((item) => item.deliveryId))];

          // --- Fetch related deliveries ---
          // Firestore 'in' query supports max 30 elements per query. Batch if needed.
          // For simplicity here, assuming fewer than 30 unique deliveries per snapshot update.
          // If you expect more, implement batching.
          const deliveryDocs = await Promise.all(
              deliveryIds.map(id => getDoc(doc(db, "deliveries", id)))
          );
          const deliveries = deliveryDocs
              .filter((snap) => snap.exists())
              .map((snap) => ({ id: snap.id, ...snap.data() }));
          const deliveryMap = new Map(deliveries.map(d => [d.id, d]));

          console.log("Fetched deliveries:", deliveries.length);

          // --- Fetch related haulers to check businessId ---
          const haulerIds = [...new Set(deliveries.map((d) => d.haulerAssignedId).filter(Boolean))];

          if (haulerIds.length === 0) {
              console.log("No haulers found for the fetched deliveries.");
              setTransactionData({});
              setLoadingTransactions(false);
              return;
           }

          // Again, batching might be needed for `haulerIds` if > 30
           const haulerQuery = query(collection(db, "users"), where("userId", "in", haulerIds));
           const haulerSnapshot = await getDocs(haulerQuery);
           const haulerMap = new Map(haulerSnapshot.docs.map(d => [d.data().userId, d.data()]));

           console.log("Fetched haulers:", haulerMap.size);


          // --- Filter history items relevant to the current business ---
          const businessHistoryItems = validHistories.filter(history => {
              const delivery = deliveryMap.get(history.deliveryId);
              if (!delivery || !delivery.haulerAssignedId) return false;
              const hauler = haulerMap.get(delivery.haulerAssignedId);
              // Keep history if the hauler belongs to the current business
              return hauler && hauler.businessId === currentBusinessId;
          });

          console.log("Filtered history for business:", businessHistoryItems.length);

          // --- Process filtered data for the chart ---
          const processedData = processTransactionData(businessHistoryItems);
          setTransactionData(processedData);
          setLoadingTransactions(false);

      }, (error) => {
          console.error("Error fetching delivery history:", error);
          setLoadingTransactions(false);
          // Handle error state if needed
      });

      return () => unsubscribeHistory(); // Cleanup history listener

  }, [currentBusinessId]); // Re-run if businessId changes

  // --- Processing Function ---
  const processTransactionData = (historyItems) => {
    const monthlyCounts = {};

    historyItems.forEach((item) => {
      const timestamp = item.deliveryArrivalTime.toDate(); // Convert Firestore Timestamp to JS Date
      const year = timestamp.getFullYear(); // Consider year if data spans multiple years
      const monthIndex = timestamp.getMonth();
      const monthName = getMonthName(monthIndex);
      const weekNumber = getWeekOfMonth(timestamp);
      const weekKey = `Week ${weekNumber}`;

      const monthYearKey = `${monthName} ${year}`; // Use "Month Year" as key if spanning years

      if (!monthlyCounts[monthYearKey]) {
        monthlyCounts[monthYearKey] = {};
      }
      if (!monthlyCounts[monthYearKey][weekKey]) {
        monthlyCounts[monthYearKey][weekKey] = 0;
      }
      monthlyCounts[monthYearKey][weekKey]++;
    });

    // Convert counts to the format expected by Recharts
    const formattedData = {};
    Object.keys(monthlyCounts).sort((a, b) => { // Sort months chronologically
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
    }).forEach((monthYearKey) => {
      const weeklyData = monthlyCounts[monthYearKey];
      formattedData[monthYearKey] = Object.keys(weeklyData)
        .map((weekKey) => ({
          week: weekKey,
          transactions: weeklyData[weekKey],
        }))
        .sort((a, b) => parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1])); // Sort weeks numerically
    });

    // Set default selected month to the latest month with data if current selection is invalid
     const availableMonths = Object.keys(formattedData);
     if (availableMonths.length > 0 && !formattedData[selectedMonth]) {
         setSelectedMonth(availableMonths[availableMonths.length - 1]);
     } else if (availableMonths.length === 0) {
         setSelectedMonth(getMonthName(new Date().getMonth()) + " " + new Date().getFullYear()); // Fallback if no data
     }


    console.log("Processed transaction data:", formattedData);
    return formattedData;
  };


  // --- Ad Countdown Timer --- (Keep as is)
  useEffect(() => {
    if (showAd && secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (showAd && secondsLeft === 0 && !adClosable) {
        setAdClosable(true); // Ensure it becomes closable exactly when timer hits 0
    }
  }, [showAd, secondsLeft, adClosable]);


  // --- Open Map Modal Function --- (Keep as is)
  const openMapModal = (pickup, drop, farmerName, purpose, productType, weight, timestamp, id) => {
    setMapPoints({ pickup, drop, farmerName, purpose, productType, weight, timestamp });
    setReadRequests((prev) => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem("readRequests", JSON.stringify(updated));
      return updated;
    });
    setModalOpen(true);
  };

  // --- Render Logic ---
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
          {/* Delivery Requests Section (Keep as is) */}
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
                            month: "short", day: "numeric", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true,
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
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
                                   <span>{formattedTime}</span>
                                 </div>
                               </div>
                             </div>
                             <div className="flex flex-col items-end space-y-2">
                               <button
                                 className="text-[#1A4D2E] hover:text-[#1A4D2E]/80 text-sm font-medium transition-colors"
                                 onClick={() => openMapModal(req.pickupLocation, req.destinationLocation, req.farmerName, req.purpose, req.productType, req.weight, req.timestamp, req.id)}
                               >
                                 View Details
                               </button>
                               {req.status === "Cancelled" ? (
                                 <button className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg cursor-not-allowed" disabled> Cancelled </button>
                               ) : (
                                 <button
                                   className="px-4 py-2 bg-[#1A4D2E] text-white text-sm rounded-lg hover:bg-[#1A4D2E]/90 transition-colors"
                                   onClick={() => { setSelectedRequest(req); setAssignModalOpen(true); }}
                                 > Accept Request </button>
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

          {/* Transactions Section - Updated */}
          <div className="lg:col-span-1">
            <MonthlyTransactionsCard
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              transactionData={transactionData} // Pass processed data
              isLoading={loadingTransactions}   // Pass loading state
            />
          </div>
        </div>
      </div>

      {/* Modals (Keep as is) */}
      <AcceptRequestModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={(hauler) => setAssignModalOpen(false)} // Logic might need adjustment based on Assign modal implementation
        req={selectedRequest}
        setRequests={setRequests} // Make sure this prop is handled correctly in AcceptRequestModal
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

      {/* Ad Modal (Keep as is) */}
       <Modal
         isOpen={showAd}
         onRequestClose={() => { if (adClosable) setShowAd(false); }}
         className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" // Added padding for smaller screens
         overlayClassName="fixed inset-0 bg-black/50 z-50" // Ensure overlay has z-index
         shouldCloseOnOverlayClick={adClosable}
         ariaHideApp={false} // Recommended for accessibility if #root is not set
       >
         <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-md mx-auto w-full" // Added w-full
         >
           <h2 className="text-2xl font-bold mb-4 text-[#1A4D2E]">
             🚀 Upgrade Your Experience
           </h2>
           <p className="mb-6 text-gray-600">
             Unlock premium features and remove ads by subscribing to our service.
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
               You can close this ad in {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'}...
             </p>
           )}
         </motion.div>
       </Modal>
    </div>
  );
}