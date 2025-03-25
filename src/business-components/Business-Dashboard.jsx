import { useState, useMemo } from "react";
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

const vehicles = [
  { id: 1, name: "Truck A", details: "Large truck for bulk deliveries" },
  { id: 2, name: "Van B", details: "Mid-sized van for city transport" },
  { id: 3, name: "Bike C", details: "Eco-friendly bike for small packages" },
  { id: 4, name: "Bike C", details: "Eco-friendly bike for small packages" },
  { id: 5, name: "Bike C", details: "Eco-friendly bike for small packages" },
];

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

  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth]);

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
            {" "}
            {/* Scrollable area */}
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="p-4 bg-gray-100 rounded-lg shadow"
              >
                <p className="text-[#1A4D2E] font-semibold">{vehicle.name}</p>
                <p className="text-sm text-gray-600">{vehicle.details}</p>
                <button className="bg-[#1A4D2E] text-white px-4 py-2 mt-2 rounded-lg hover:bg-green-700">
                  Accept
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
    </div>
  );
}
