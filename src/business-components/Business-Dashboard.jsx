import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import { onAuthStateChanged } from "firebase/auth";
import MapModal from "../map/MapModal.jsx";
import Maps from "./Maps";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";

// Static data for transaction chart
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
   // State variables
   const [selectedMonth, setSelectedMonth] = useState("March"); // selected month for transaction chart
   const [requests, setRequests] = useState([]); // delivery requests to display
   const [loading, setLoading] = useState(true); // loading flag while fetching requests
   const [modalOpen, setModalOpen] = useState(false); // map modal visibility
   const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" }); // pickup & drop coordinates


     // Notification states
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pending delivery requests
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRequests([]);
        setLoading(false);
        return;
      }

      try {
        // Query delivery requests assigned to this business, not yet accepted
        const q = query(
          collection(db, "deliveryRequests"),
          where("businessId", "==", user.uid),
          where("isAccepted", "==", false)
        );

        const snapshot = await getDocs(q);

        // For each request, enrich it with vehicle and farmer info
        const enrichedRequests = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // Get vehicle name
            const vehicleRef = doc(db, "vehicles", data.vehicleId);
            const vehicleDoc = await getDoc(vehicleRef);
            const vehicleName = vehicleDoc.exists()
              ? vehicleDoc.data().model || "Unknown"
              : "Unknown";

            // Get farmer name from 'users' collection
            const farmerRef = doc(db, "users", data.farmerId);
            const farmerDoc = await getDoc(farmerRef);
            const farmerName = farmerDoc.exists()
              ? `${farmerDoc.data().firstName} ${farmerDoc.data().lastName}`
              : "Unknown Farmer";

            return {
              ...data,
              id: docSnap.id,
              vehicleName,
              farmerName,
            };
          })
        );

        setRequests(enrichedRequests);
      } catch (error) {
        console.error("Error fetching delivery requests:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", userId)
        );
        const snapshot = await getDocs(q);

        const loadedNotifications = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: data.time?.toDate().toLocaleString() || "N/A",
          };
        });

        setNotifications(loadedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", userId)
        );
        const snapshot = await getDocs(q);

        const loadedNotifications = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: data.time?.toDate().toLocaleString() || "N/A",
          };
        });

        setNotifications(loadedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Calculate total transactions for selected month
  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth]);

  // Open the map modal with pickup/drop locations
  const openMapModal = (pickup, drop) => {
    setMapPoints({ pickup, drop });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Top Header */}
      <div className="h-[16.67vh] bg-[#1A4D2E] w-full flex py-8 px-12 shadow-md">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>

        {/* Notification Button */}
        <NotificationButton
          notifications={notifications}
          loading={loading}
          error={error}
        />
      </div>

      {/* Main content area */}
      <div className="relative w-full max-w-8xl mt-[-50px] flex flex-col md:flex-row gap-6 px-6 pt-6">
        {/* Left panel: Delivery Requests */}
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4">
          <h2 className="text-xl font-bold text-[#1A4D2E] mb-4">
            Delivery Requests
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-100 auto-hide-scrollbar">
            {/* Show loading state */}
            {loading ? (
              <p className="text-gray-400">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-gray-500">No pending delivery requests.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-[#F5EFE6]  rounded-lg shadow flex justify-between items-start"
                >
                  <div>
                    <p className="text-lg text-[#1A4D2E]">
                      <span className="font-bold">{req.farmerName}</span>
                    </p>
                    <h4 className="text-md font-semibold text-gray-800">
                      {req.vehicleName}
                    </h4>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-2">
                    {/* Button to open map modal */}
                    <button
                      className="text-blue-600 text-sm underline"
                      onClick={() =>
                        openMapModal(
                          req.pickupLocation,
                          req.destinationLocation
                        )
                      }
                    >
                      Details
                    </button>

                    {/* Accept button (future functionality) */}
                    <button className="mt-2 px-4 py-1 bg-[#1A4D2E] text-white text-sm rounded-lg">
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel: Monthly Transactions Graph */}
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#1A4D2E]">
              Monthly Transactions
            </h2>
            <select
              className="p-2 border rounded-lg bg-[#FCFFE0] text-[#1A4D2E]"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {Object.keys(monthlyData).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Animated total count */}
          <motion.p
            className="text-lg font-semibold text-[#1A4D2E] mb-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Total Transactions: {totalTransactions}
          </motion.p>

          {/* Chart */}
          <div className="w-full h-72 bg-gray-100 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyData[selectedMonth]}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient
                    id="colorTransactions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#F5EFE6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  strokeOpacity={0.2}
                  stroke="#1A4D2E"
                />
                <XAxis dataKey="week" tick={{ fill: "#1A4D2E" }} />
                <YAxis tick={{ fill: "#1A4D2E" }} />
                <Tooltip cursor={{ fill: "rgba(26, 77, 46, 0.1)" }} />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#1A4D2E"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTransactions)"
                  activeDot={{ r: 6, fill: "#1A4D2E" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Map Modal to show pickup/destination route */}
      <MapModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pickup={mapPoints.pickup}
        drop={mapPoints.drop}
      />
    </div>
  );
}
