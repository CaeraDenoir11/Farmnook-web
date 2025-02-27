import { useState } from "react";
import "../index.css";

export default function Feedback() {
  return (
    <div className="!flex-1 h-screen p-6 bg-white">
      <h1 className="text-2xl font-bold">Welcome to the Feedback</h1>
      <p className="mt-2 text-red-700">This is your main content area.</p>
    </div>
  );
}
