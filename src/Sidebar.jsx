import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import "./index.css";
import logo from "./assets/images/logo.png";
import dashboardIcon from "./assets/images/dashboard.svg";
import usersIcon from "./assets/images/users.svg";
import feedbackIcon from "./assets/images/feedback.svg";
import settingsIcon from "./assets/images/settings.svg";
import Dashboard from "./Dashboard.jsx";
import Users from "./Users.jsx";
import Feedback from "./Feedback.jsx";
import Settings from "./Settings.jsx";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: dashboardIcon, component: <Dashboard /> },
    { name: "Users", icon: usersIcon, component: <Users /> },
    { name: "Feedback", icon: feedbackIcon, component: <Feedback /> },
    { name: "Settings", icon: settingsIcon, component: <Settings /> },
  ];

  return (
    <div className="flex h-screen">
      <div
        className={`h-screen flex flex-col justify-between transition-all duration-300 ${
          isOpen ? "w-64" : "w-18"
        } bg-[--color-primary] text-white p-4`}
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
                onClick={() => setActive(item.name)}
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
          <button className="flex items-center gap-2 p-2 rounded-md cursor-pointer text-green-800 hover:bg-red-600 ease-in-out duration-300 hover:text-white w-full">
            <LogOut size={18} />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white">
        {menuItems.find((item) => item.name === active)?.component}
      </div>
    </div>
  );
}
