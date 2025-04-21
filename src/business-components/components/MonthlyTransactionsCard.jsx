import { useMemo } from "react";
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

export default function MonthlyTransactionsCard({
  selectedMonth,
  setSelectedMonth,
  monthlyData,
}) {
  const totalTransactions = useMemo(() => {
    return monthlyData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth, monthlyData]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/8 self-start">
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
              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
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
  );
}