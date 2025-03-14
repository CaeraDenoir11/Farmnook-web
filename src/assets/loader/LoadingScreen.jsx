import React from "react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center z-50 justify-center bg-black/70">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#F5EFE6]/90 backdrop-blur-xl shadow-2xl rounded-3xl p-10 flex flex-col items-center justify-center border border-white/20"
      >
        {/* Thicker Animated Spinner */}
        <motion.div
          className="w-16 h-16 border-12 border-t-transparent border-[#1A4D2E] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        ></motion.div>

        {/* Minimal Text */}
        <p className="mt-5 text-black text-lg font-bold tracking-wide animate-pulse">
          Loading...
        </p>
      </motion.div>
    </div>
  );
}
