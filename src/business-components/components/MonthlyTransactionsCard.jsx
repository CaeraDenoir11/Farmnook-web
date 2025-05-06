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
  transactionData, // Changed prop name from monthlyData
  isLoading,        // Added isLoading prop
}) {

  // Calculate total transactions for the selected month using the new data structure
  const totalTransactions = useMemo(() => {
    // Check if data for the selected month exists and is an array
    if (!transactionData || !Array.isArray(transactionData[selectedMonth])) {
      return 0;
    }
    return transactionData[selectedMonth].reduce(
      (total, entry) => total + entry.transactions,
      0
    );
  }, [selectedMonth, transactionData]);

  // Get available months from the transaction data keys
  const availableMonths = useMemo(() => Object.keys(transactionData), [transactionData]);

  // Data for the chart for the selected month
  const chartData = useMemo(() => {
      return transactionData?.[selectedMonth] || []; // Return empty array if no data for month
  }, [selectedMonth, transactionData]);


  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#1A4D2E]">
          Monthly Transactions
        </h2>
        {availableMonths.length > 0 ? ( // Only show select if there's data
             <select
             className="p-2 border rounded-lg bg-[#FCFFE0] text-[#1A4D2E]"
             value={selectedMonth}
             onChange={(e) => setSelectedMonth(e.target.value)}
             disabled={isLoading} // Disable while loading
           >
             {availableMonths.map((month) => (
               <option key={month} value={month}>
                 {month}
               </option>
             ))}
           </select>
        ) : !isLoading && (
            <span className="text-sm text-gray-500">No data</span> // Show message if no data and not loading
        )}
      </div>

      {/* Display Total Transactions */}
      <motion.p
        key={selectedMonth + totalTransactions} // Add key for animation trigger on change
        className="text-lg font-semibold text-[#1A4D2E] mb-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }} // Faster animation
      >
        Total Transactions: {isLoading ? "..." : totalTransactions}
      </motion.p>

      {/* Chart Area */}
      <div className="flex-1 min-h-[300px] w-full bg-[#FCFFE0] p-4 rounded-lg relative">
        {isLoading ? (
          <div className="absolute inset-0 flex justify-center items-center bg-[#FCFFE0]/50">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
          </div>
        ) : chartData.length === 0 ? (
             <div className="absolute inset-0 flex justify-center items-center">
                <p className="text-gray-500">No transactions for {selectedMonth}.</p>
             </div>
        ): (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData} // Use dynamically generated chart data
              margin={{ top: 20, right: 30, left: 0, bottom: 10 }} // Adjusted left margin
            >
              <defs>
                <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#F5EFE6" stopOpacity={0.1} /> {/* Adjusted opacity */}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#1A4D2E" />
              <XAxis dataKey="week" tick={{ fill: "#1A4D2E", fontSize: 12 }} tickLine={{ stroke: "#1A4D2E" }} axisLine={{ stroke: "#1A4D2E" }} />
              <YAxis allowDecimals={false} tick={{ fill: "#1A4D2E", fontSize: 12 }} tickLine={{ stroke: "#1A4D2E" }} axisLine={{ stroke: "#1A4D2E" }} />
              <Tooltip
                cursor={{ fill: "rgba(26, 77, 46, 0.1)" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #1A4D2E",
                  borderRadius: "8px",
                  color: "#1A4D2E",
                  fontSize: '14px', // Adjust font size if needed
                }}
                formatter={(value) => [`${value} Transactions`, null]} // Customize tooltip content
              />
              <Area
                type="monotone"
                dataKey="transactions"
                stroke="#1A4D2E"
                strokeWidth={2} // Slightly thinner line
                fillOpacity={1}
                fill="url(#colorTransactions)"
                activeDot={{ r: 6, fill: "#1A4D2E", stroke: "white", strokeWidth: 2 }}
                animationDuration={500} // Add animation
              />
            </AreaChart>
          </ResponsiveContainer>
         )}
      </div>
    </div>
  );
}