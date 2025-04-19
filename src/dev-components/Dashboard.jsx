import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");
  const [overallTotal, setOverallTotal] = useState(0);
  const [userTypeCounts, setUserTypeCounts] = useState({
    hauler: 0,
    farmer: 0,
    haulerBusinessAdmin: 0,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const monthlyCount = {};
      let total = 0;
      const userTypes = {
        hauler: 0,
        farmer: 0,
        haulerBusinessAdmin: 0,
      };

      snapshot.forEach((doc) => {
        const { dateJoined, userType } = doc.data();
        let date;

        // 1. Firestore Timestamp
        if (dateJoined?.seconds) {
          date = new Date(dateJoined.seconds * 1000);
        }

        // 2. String like "Apr 15, 2025, 12:44 AM"
        else if (typeof dateJoined === "string" && dateJoined.includes(",")) {
          date = new Date(dateJoined);
        }

        // 3. String like "01-04-2025"
        else if (typeof dateJoined === "string" && dateJoined.includes("-")) {
          const [day, month, year] = dateJoined.split("-").map(Number);
          date = new Date(year, month - 1, day);
        }

        // Ensure valid date
        if (date instanceof Date && !isNaN(date)) {
          const monthName = date.toLocaleString("default", { month: "long" });
          const week = `Week ${Math.ceil(date.getDate() / 7)}`;

          if (!monthlyCount[monthName]) monthlyCount[monthName] = {};
          if (!monthlyCount[monthName][week]) monthlyCount[monthName][week] = 0;

          monthlyCount[monthName][week]++;
          total++;
        }

        // Count user types
        if (userType === "Hauler") userTypes.hauler++;
        else if (userType === "Farmer") userTypes.farmer++;
        else if (userType === "Hauler Business Admin") userTypes.haulerBusinessAdmin++;
      });

      const formattedData = {};
      Object.keys(monthlyCount).forEach((month) => {
        formattedData[month] = Object.entries(monthlyCount[month])
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([week, users]) => ({ week, users }));
      });

      setMonthlyData(formattedData);
      setOverallTotal(total);
      setUserTypeCounts(userTypes);

      if (!selectedMonth && Object.keys(formattedData).length > 0) {
        setSelectedMonth(Object.keys(formattedData)[0]);
      }
    });

    return () => unsubscribe();
  }, [selectedMonth]);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-800">
        Dashboard
      </h1>

      <div className="bg-[#F5EFE6] p-6 rounded-lg shadow-md max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          {/* Month Selector */}
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

          {/* Summary Cards */}
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
            {/* Monthly Total */}
            <div className="bg-white text-green-800 p-4 rounded-lg shadow-md text-center w-full md:w-64">
              <h2 className="text-lg font-semibold">
                Total users for {selectedMonth}
              </h2>
              <p className="text-2xl font-bold mt-2">
                {monthlyData[selectedMonth]?.reduce(
                  (sum, entry) => sum + entry.users,
                  0
                ) || 0}
              </p>
              <p className="text-lg text-gray-500 mt-1">
                Overall: {overallTotal}
              </p>
            </div>

            {/* User Type Summary */}
            <div className="bg-white text-green-800 p-4 rounded-lg shadow-md w-full md:w-64">
              <h2 className="text-lg font-semibold text-center mb-2">
                User Type Summary
              </h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>
                  Haulers: <span className="font-bold">{userTypeCounts.hauler}</span>
                </li>
                <li>
                  Farmers: <span className="font-bold">{userTypeCounts.farmer}</span>
                </li>
                <li>
                  Hauler Business Admins:{" "}
                  <span className="font-bold">{userTypeCounts.haulerBusinessAdmin}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Area Chart */}
        <h2 className="text-lg font-semibold mb-4 text-green-800 text-center">
          Weekly Users in {selectedMonth}
        </h2>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyData[selectedMonth] || []}
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
              <YAxis tick={{ fill: "#4A5568" }} allowDecimals={false} />
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
