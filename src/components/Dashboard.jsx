import { useState } from "react";
import "../index.css";

import { Bar } from "recharts";
import { BarChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { week: "Week 1", users: 120 },
  { week: "Week 2", users: 90 },
  { week: "Week 3", users: 150 },
  { week: "Week 4", users: 130 },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold m-4">Dashboard</h1>
      <div className="bg-red-400 m-4 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">
          Total Logged-in Users Today: 235
        </h2>
        <BarChart width={500} height={300} data={data} className="mx-auto">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="users" fill="#4CAF50" />
        </BarChart>
      </div>
    </div>
  );
}
