import { useState } from "react";
import "../index.css";
import profilePic from "../assets/images/profile.png"; // Replace with actual profile image

export default function Settings() {
  return (
    <div className="flex-1 h-full w-full bg-white text-black p-4 pt-12">
      {/* Card Container - Enlarged for Larger Screens */}
      <div className="bg-[#F5EFE6] text-black rounded-2xl shadow-lg p-10 w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-x-12">
        {/* Profile Picture & Basic Info */}
        <div className="flex flex-col items-center md:items-start">
          <img
            src={profilePic}
            alt="Admin"
            className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 border-gray-300 shadow-sm"
          />
          <div className="mt-5 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">Caera Denoir</h1>
            <p className="text-gray-600 text-lg font-medium">Super Admin</p>
            <p className="text-sm text-gray-500">
              Managing system configurations and user settings.
            </p>
          </div>
        </div>

        {/* Admin Details Section - Modern Simplistic Design */}
        <div className="w-full md:w-auto border-t md:border-t-0 md:border-l pl-0 md:pl-8 pt-4 md:pt-0">
          <h2 className="text-2xl font-semibold mb-5">Admin Details</h2>
          <div className="space-y-4">
            <p className="flex justify-between text-lg">
              <span className="font-medium text-gray-700">Full Name:</span>
              <span className="text-gray-900 font-semibold">Caera Denoir</span>
            </p>
            <p className="flex justify-between text-lg">
              <span className="font-medium text-gray-700">Email:</span>
              <span className="text-gray-900 font-semibold">
                caera.denoir@example.com
              </span>
            </p>
            <p className="flex justify-between text-lg">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="text-gray-900 font-semibold">
                +1 234 567 890
              </span>
            </p>
            <p className="flex justify-between text-lg">
              <span className="font-medium text-gray-700">Date of Birth:</span>
              <span className="text-gray-900 font-semibold">Jan 1, 1990</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
