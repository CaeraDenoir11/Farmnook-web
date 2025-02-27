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

        {/* Responsive Line Chart with Smooth Styling */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
            >
              {/* Gradient Fill for a Softer Look */}
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
                strokeWidth={1} // Thinner, elegant line
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
