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
import AcceptRequestButton from "../assets/buttons/AcceptRequestButton.jsx";

// Mock transaction chart data
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
  // === State Setup ===
  const [selectedMonth, setSelectedMonth] = useState("March");
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });
  const [haulerModalOpen, setHaulerModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState(null);

  // === Fetch Pending Delivery Requests ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRequests([]);
        setLoadingRequests(false);
        return;
      }

      try {
        const q = query(
          collection(db, "deliveryRequests"),
          where("businessId", "==", user.uid),
          where("isAccepted", "==", false)
        );

        const snapshot = await getDocs(q);

        const enrichedRequests = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // === Vehicle Info Fetch ===
            let vehicleName = "Unknown";
            try {
              const vehicleRef = doc(db, "vehicles", data.vehicleId);
              const vehicleDoc = await getDoc(vehicleRef);
              if (vehicleDoc.exists()) {
                vehicleName = vehicleDoc.data().model || "Unknown";
              }
            } catch (err) {
              console.error("Error fetching vehicle:", err);
            }

            // === Farmer Info Fetch ===
            let farmerName = "Unknown Farmer";
            try {
              const farmerRef = doc(db, "users", data.farmerId);
              const farmerDoc = await getDoc(farmerRef);
              if (farmerDoc.exists()) {
                const farmerData = farmerDoc.data();
                farmerName = `${farmerData.firstName} ${farmerData.lastName}`;
              }
            } catch (err) {
              console.error("Error fetching farmer:", err);
            }

            return {
              ...data,
              id: docSnap.id,
              vehicleName,
              farmerName,
            };
          })
        );

        setRequests(enrichedRequests);
        console.log("Requests length:", enrichedRequests.length);
      } catch (error) {
        console.error("Error fetching delivery requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // === Fetch Notifications ===
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setNotifications([]);
        setLoadingNotifications(false);
        return;
      }

      try {
        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", user.uid)
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
        setLoadingNotifications(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // === Chart Calculation ===
  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth]);

  // === Map Modal Trigger ===
  const openMapModal = (pickup, drop) => {
    setMapPoints({ pickup, drop });
    setModalOpen(true);
  };

  // === Render ===
  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* === Top Header === */}
      <div className="h-[16.67vh] bg-[#1A4D2E] w-full flex py-8 px-12 shadow-md">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <NotificationButton
          notifications={notifications}
          loading={loadingNotifications}
          error={error}
        />
      </div>

      {/* === Main Content === */}
      <div className="relative w-full max-w-8xl mt-[-50px] flex flex-col md:flex-row gap-6 px-6 pt-6">
        {/* === Delivery Requests Panel === */}
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4">
          <h2 className="text-xl font-bold text-[#1A4D2E] mb-4">
            Delivery Requests
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-100 auto-hide-scrollbar">
            {loadingRequests ? (
              <p className="text-gray-400">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-gray-500">No pending delivery requests.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-[#F5EFE6] rounded-lg shadow flex justify-between items-start"
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
                    <button
                      className="mt-2 px-4 py-1 bg-[#1A4D2E] text-white text-sm rounded-lg"
                      onClick={() => setHaulerModalOpen(true)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === Monthly Transactions Panel === */}
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

          <motion.p
            className="text-lg font-semibold text-[#1A4D2E] mb-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            Total Transactions: {totalTransactions}
          </motion.p>

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
      <AcceptRequestButton
        isOpen={haulerModalOpen}
        onClose={() => setHaulerModalOpen(false)}
      />

      {/* === Map Modal === */}
      <MapModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pickup={mapPoints.pickup}
        drop={mapPoints.drop}
      />
    </div>
  );
}
