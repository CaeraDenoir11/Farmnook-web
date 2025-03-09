import { useState } from "react";
import "../index.css";
import profilePic from "../assets/images/profile.png"; // Replace with actual profile image

export default function BusinessProfile() {
  return (
    <div className="flex-1 h-full w-full bg-white text-[#1A4D2E] flex items-center justify-center p-6 md:p-10">
      {/* Card Container - Modern UI with Advanced Responsiveness */}
      <div className="bg-[#F5EFE6] text-[#1A4D2E] rounded-3xl shadow-2xl p-6 md:p-12 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 transition-all duration-300">
        {/* Profile Picture & Basic Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-1/3">
          <img
            src={profilePic}
            alt="Admin"
            className="w-32 h-32 md:w-40 md:h-40 lg:w-52 lg:h-52 rounded-full object-cover border-4 border-[#1A4D2E] shadow-[0_4px_10px_rgba(26,77,46,0.4)] hover:scale-105 transition-transform duration-300"
          />
          <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Caera Denoir
            </h1>
            <p className="text-lg font-medium">Super Admin</p>
            <p className="text-sm max-w-xs md:max-w-sm opacity-90 leading-relaxed">
              Managing system configurations and user settings.
            </p>
          </div>
        </div>

        {/* Admin Details Section - Advanced Responsive Layout */}
        <div className="w-full md:w-2/3 flex flex-col gap-6 p-6 md:p-8 bg-white rounded-xl shadow-md border border-[#1A4D2E]">
          <h2 className="text-2xl font-semibold mb-4 md:mb-6 text-center md:text-left">
            Admin Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Full Name</span>
              <span className="text-lg font-semibold">Caera Denoir</span>
            </div>
            <div className="flex flex-col break-words">
              <span className="text-sm font-medium">Email</span>
              <span className="text-lg font-semibold">
                caera.denoir@example.com
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Phone</span>
              <span className="text-lg font-semibold">+1 234 567 890</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Date of Birth</span>
              <span className="text-lg font-semibold">Jan 1, 1990</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
