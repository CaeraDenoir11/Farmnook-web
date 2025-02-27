import { useState } from "react";
import "../index.css";
import profilePic from "../assets/images/profile.png"; // Replace with actual profile image

export default function Settings() {
  return (
    <div className="flex-1 h-full w-full bg-white text-black p-4 pt-12">
      {/* Card Container - Centered Horizontally */}
      <div className="bg-[#F5EFE6] text-black rounded-2xl shadow-lg p-8 w-full max-w-2xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-x-10">
        {/* Profile Picture & Basic Info */}
        <div className="flex flex-col items-center md:items-start">
          <img
            src={profilePic}
            alt="Admin"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover"
          />
          <div className="mt-4 text-center md:text-left space-y-1">
            <h1 className="text-2xl font-bold">Caera Denoir</h1>
            <p className="text-gray-600 text-lg">Super Admin</p>
            <p className="text-sm text-gray-500">
              Managing system configurations and user settings.
            </p>
          </div>
        </div>

        {/* Admin Details Section */}
        <div className="w-full md:w-auto border-t md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0">
          <h2 className="text-xl font-semibold mb-3">Admin Details</h2>
          <p className="space-y-1">
            <span className="font-medium block">Full Name:</span> Caera Denoir
          </p>
          <p className="space-y-1">
            <span className="font-medium block">Email:</span>{" "}
            caera.denoir@example.com
          </p>
          <p className="space-y-1">
            <span className="font-medium block">Phone:</span> +1 234 567 890
          </p>
          <p className="space-y-1">
            <span className="font-medium block">Date of Birth:</span> Jan 1,
            1990
          </p>
        </div>
      </div>
    </div>
  );
}
