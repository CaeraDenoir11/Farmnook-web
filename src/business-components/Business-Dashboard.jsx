// BusinessDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import Maps from "./Maps";
import Modal from "react-modal";

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
  const [requests, setRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });

  useEffect(() => {
    const fetchRequests = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, "deliveryRequests"),
        where("businessId", "==", userId),
        where("isAccepted", "==", false)
      );

      const snapshot = await getDocs(q);

      const enrichedRequests = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const vehicleRef = doc(db, "vehicles", data.vehicleId);
          const vehicleDoc = await getDoc(vehicleRef);
          return {
            ...data,
            id: docSnap.id,
            vehicleName: vehicleDoc.exists()
              ? vehicleDoc.data().model || "Unknown"
              : "Unknown",
          };
        })
      );

      setRequests(enrichedRequests);
    };

    fetchRequests();
  }, []);

  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth]);

  const openMapModal = (pickup, drop) => {
    setMapPoints({ pickup, drop });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center ">
      <div className="h-[16.67vh] bg-[#1A4D2E] w-full flex py-8 px-12 shadow-md">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      </div>
      <div className="relative w-full max-w-8xl mt-[-50px] flex flex-col md:flex-row gap-6 px-6 pt-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4">
          <h2 className="text-xl font-bold text-[#1A4D2E] mb-4">
            Pending Orders
          </h2>
          <div className="space-y-4 overflow-y-auto max-h-100 auto-hide-scrollbar">
            {requests.map((req) => (
              <div key={req.id} className="p-4 bg-gray-100 rounded-lg shadow">
                <p className="text-[#1A4D2E] font-semibold">
                  {req.vehicleName}
                </p>
                <p className="text-sm text-gray-600">{req.vehicleType}</p>
                <p className="text-sm text-gray-600">{req.productType}</p>
                <button
                  className="text-blue-600 text-sm underline mt-2"
                  onClick={() =>
                    openMapModal(req.pickupLocation, req.destinationLocation)
                  }
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>

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

      {/* Map Modal */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        className="fixed inset-0 bg-black/50 flex items-center justify-center px-4"
        overlayClassName="ReactModal__Overlay"
      >
        <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] p-4 relative shadow-xl">
          <button
            className="absolute top-4 right-4 text-red-600 font-bold"
            onClick={() => setModalOpen(false)}
          >
            Close
          </button>
          <Maps
            pickupLocation={mapPoints.pickup}
            destinationLocation={mapPoints.drop}
            disablePicker={true}
            routeColor="blue"
            showTooltips={true}
          />
        </div>
      </Modal>
    </div>
  );
}
