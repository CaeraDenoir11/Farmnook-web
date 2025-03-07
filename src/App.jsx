import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Users from "./components/Users.jsx";
import Feedback from "./components/Feedback.jsx";
import Settings from "./components/Settings.jsx";
import Login from "./components/Login.jsx";
import BusinessSidebar from "./business-components/Business-Sidebar.jsx";
import BusinessDashboard from "./business-components/Business-Dashboard.jsx";
import BusinessDrivers from "./business-components/Business-Drivers.jsx";
import BusinessVehicles from "./business-components/Business-Vehicles.jsx";
import BusinessProfile from "./business-components/Business-Profile.jsx";
import logo from "./assets/images/document-logo.png";

export default function App() {
  const [active, setActive] = useState(
    localStorage.getItem("activePage") || "Dashboard"
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    JSON.parse(localStorage.getItem("isAuthenticated")) || false
  );
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");

  useEffect(() => {
    document.title = `Farmnook`;
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = logo;
    } else {
      const newFavicon = document.createElement("link");
      newFavicon.rel = "icon";
      newFavicon.type = "image/png";
      newFavicon.href = logo;
      document.head.appendChild(newFavicon);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("activePage", active);
  }, [active]);

  useEffect(() => {
    localStorage.setItem("isAuthenticated", JSON.stringify(isAuthenticated));
    localStorage.setItem("userRole", role);
  }, [isAuthenticated, role]);

  const renderContent = () => {
    if (role === "business-admin") {
      switch (active) {
        case "Drivers":
          return <BusinessDrivers />;
        case "Vehicles":
          return <BusinessVehicles />;
        case "Profile":
          return <BusinessProfile />;
        case "Dashboard":
        default:
          return <BusinessDashboard />;
      }
    } else {
      switch (active) {
        case "Users":
          return <Users />;
        case "Feedback":
          return <Feedback />;
        case "Settings":
          return <Settings />;
        case "Dashboard":
        default:
          return <Dashboard />;
      }
    }
  };

  if (!isAuthenticated) {
    return <Login setIsAuthenticated={setIsAuthenticated} setRole={setRole} />;
  }

  return (
    <div className="flex h-screen">
      {role === "business-admin" ? (
        <BusinessSidebar
          active={active}
          setActive={setActive}
          setIsAuthenticated={setIsAuthenticated}
        />
      ) : (
        <Sidebar
          active={active}
          setActive={setActive}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
      <div className="flex-1 bg-white">{renderContent()}</div>
    </div>
  );
}
