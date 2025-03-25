import { useState, useEffect, useRef } from "react";
import { Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import logo from "../assets/images/logo.png";
import dashboardIcon from "../assets/images/dashboard.svg";
import driversIcon from "../assets/icons/drivers.svg";
import vehiclesIcon from "../assets/icons/vehicles.svg";
import profileIcon from "../assets/icons/profile.svg";
import inboxIcon from "../assets/icons/message.svg";

export default function Sidebar({
  activePage,
  setActivePage,
  setIsAuthenticated,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 768;
      setIsMobile(mobileView);
      if (mobileView) setIsOpen(false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isOpen]);

  const menuItems = [
    { id: 1, name: "Dashboard", icon: dashboardIcon, route: "/dashboard" },
    { id: 2, name: "Drivers", icon: driversIcon, route: "/drivers" },
    { id: 3, name: "Vehicles", icon: vehiclesIcon, route: "/vehicles" },
    { id: 4, name: "Inbox", icon: inboxIcon, route: "/inbox" },
    { id: 5, name: "Profile", icon: profileIcon, route: "/profile" },
  ];

  return (
    <div className="flex h-screen relative">
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-blend-overlay bg-black/50 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div
        ref={sidebarRef}
        className={`fixed md:relative flex flex-col justify-between transition-all duration-300 overflow-y-auto h-screen
          ${isOpen ? "w-64" : "w-18"} bg-[#F5EFE6] text-white p-4 z-20
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
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ease-in-out duration-300
                  ${
                    activePage === item.name
                      ? "bg-green-800 text-white"
                      : "text-green-800"
                  }`}
                onClick={() => {
                  setActivePage(item.name);
                  navigate(item.route); // ✅ Fix: Navigates to the correct route
                  if (isMobile) setIsOpen(false);
                }}
              >
                <img
                  src={item.icon}
                  alt={item.name}
                  className={`w-6 h-6 transition-all duration-300 ${
                    activePage === item.name ? "filter invert" : ""
                  }`}
                />
                {isOpen && <span className="font-medium">{item.name}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 rounded-md cursor-pointer text-green-800 hover:bg-red-700 ease-in-out duration-300 hover:text-white w-full"
          >
            <LogOut size={18} />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white relative z-10">
        {isMobile && !isOpen && (
          <button
            className="fixed top-4 left-4 bg-white shadow-md p-2 rounded-md z-30"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={18} className="text-green-800" />
          </button>
        )}
      </div>
    </div>
  );
}
