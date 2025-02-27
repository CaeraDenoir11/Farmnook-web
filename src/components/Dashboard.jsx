import "../index.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const data = [
  { week: "Week 1", users: 120 },
  { week: "Week 2", users: 90 },
  { week: "Week 3", users: 150 },
  { week: "Week 4", users: 130 },
];

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Total Users Card */}
      <div className="bg-[#F5EFE6] text-green-800 p-6 rounded-lg shadow-md mb-6 max-w-sm mx-auto">
        <h2 className="text-lg font-semibold">Total Logged-in Users Today</h2>
        <p className="text-3xl font-bold mt-2">235</p>
      </div>

      {/* Line Chart Card */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">User Activity Over Time</h2>

        {/* Responsive Line Chart */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#4CAF50"
                strokeWidth={3}
                dot={{ r: 5, fill: "#4CAF50" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
