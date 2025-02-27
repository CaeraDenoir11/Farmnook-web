import { useState, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import "../index.css";
import logo from "../assets/images/logo.png";
import dashboardIcon from "../assets/images/dashboard.svg";
import usersIcon from "../assets/images/users.svg";
import feedbackIcon from "../assets/images/feedback.svg";
import settingsIcon from "../assets/images/settings.svg";
import Dashboard from "./Dashboard.jsx";
import Users from "./Users.jsx";
import Feedback from "./Feedback.jsx";
import Settings from "./Settings.jsx";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState("Dashboard");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle screen resize & auto-close sidebar when switching to mobile
  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (mobileView) setIsOpen(false); // Auto-close sidebar on small screens
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Run once on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: dashboardIcon, component: <Dashboard /> },
    { name: "Users", icon: usersIcon, component: <Users /> },
    { name: "Feedback", icon: feedbackIcon, component: <Feedback /> },
    { name: "Settings", icon: settingsIcon, component: <Settings /> },
  ];

  return (
    <div className="flex h-screen relative">
      {/* Overlay to darken content when sidebar is open on mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative h-screen flex flex-col justify-between transition-all duration-300 ${
          isOpen ? "w-64" : "w-18"
        } bg-[#F5EFE6] text-white p-4 z-20
          ${isMobile ? (isOpen ? "left-0" : "-left-64") : ""}`}
        style={{ zIndex: 30 }}
      >
        <div>
          <button
            className="mb-4 !bg-white outline-none p-2 rounded-md"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={18} className="text-green-800" />
          </button>

          {isOpen && (
            <img src={logo} alt="Logo" className="mx-auto mb-4 w-48" />
          )}

          <ul>
            {menuItems.map((item) => (
              <li
                key={item.name}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ease-in-out duration-300 ${
                  active === item.name
                    ? "bg-green-800 text-white"
                    : "text-green-800"
                }`}
                onClick={() => {
                  setActive(item.name);
                  if (isMobile) setIsOpen(false); // Close sidebar on mobile after selecting
                }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className={`w-6 h-6 transition-all duration-300 ${
                    active === item.name ? "filter invert" : ""
                  }`}
                />
                {isOpen && <span className="font-medium">{item.name}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          <button className="flex items-center gap-2 p-2 rounded-md cursor-pointer text-green-800 hover:bg-red-700 ease-in-out duration-300 hover:text-white w-full">
            <LogOut size={18} />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white relative z-10">
        {isMobile && !isOpen && (
          <button
            className="absolute top-4 left-4 bg-white shadow-md p-2 rounded-md z-30"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={18} className="text-green-800" />
          </button>
        )}
        {menuItems.find((item) => item.name === active)?.component}
      </div>
    </div>
  );
}
