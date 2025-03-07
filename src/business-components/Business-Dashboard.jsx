import { useState } from "react";
import "../index.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const monthlyData = {
  January: [
    { week: "Week 1", users: 100 },
    { week: "Week 2", users: 120 },
    { week: "Week 3", users: 90 },
    { week: "Week 4", users: 130 },
  ],
  February: [
    { week: "Week 1", users: 80 },
    { week: "Week 2", users: 110 },
    { week: "Week 3", users: 95 },
    { week: "Week 4", users: 140 },
  ],
  March: [
    { week: "Week 1", users: 120 },
    { week: "Week 2", users: 90 },
    { week: "Week 3", users: 150 },
    { week: "Week 4", users: 130 },
  ],
};

export default function BusinessDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("March");

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-800">
        Business Dashboard
      </h1>

      <div className="bg-[#F5EFE6] p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          {/* Month Selector on Top Left */}
          <select
            className="p-2 border rounded-lg bg-white text-green-800 shadow-md"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {Object.keys(monthlyData).map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          {/* Total Users on Top Right */}
          <div className="bg-white text-green-800 p-4 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold">Total Logged-in Users</h2>
            <p className="text-2xl font-bold mt-2">
              {monthlyData[selectedMonth].reduce(
                (sum, entry) => sum + entry.users,
                0
              )}
            </p>
          </div>
        </div>

        {/* Line Chart */}
        <h2 className="text-lg font-semibold mb-4 text-green-800 text-center">
          User Activity Over Time ({selectedMonth})
        </h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData[selectedMonth]}
              margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="week" tick={{ fill: "#4A5568" }} />
              <YAxis tick={{ fill: "#4A5568" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#4CAF50"
                strokeWidth={1}
                fill="url(#colorUsers)"
                dot={{ r: 4, fill: "#4CAF50" }}
                activeDot={{
                  r: 6,
                  fill: "#4CAF50",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
