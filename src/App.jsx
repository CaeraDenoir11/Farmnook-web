import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Sidebar from "./dev-components/Sidebar.jsx";
import Dashboard from "./dev-components/Dashboard.jsx";
import Users from "./dev-components/Users.jsx";
import Feedback from "./dev-components/Feedback.jsx";
import Login from "./dev-components/Login.jsx";
import BusinessSidebar from "./business-components/Business-Sidebar.jsx";
import BusinessDashboard from "./business-components/Business-Dashboard.jsx";
import BusinessDrivers from "./business-components/Business-Drivers.jsx";
import BusinessVehicles from "./business-components/Business-Vehicles.jsx";
import BusinessInbox from "./business-components/Business-Inbox.jsx";
import BusinessProfile from "./business-components/Business-Profile.jsx";
import logo from "./assets/images/document-logo.png";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    JSON.parse(localStorage.getItem("isAuthenticated")) || false
  );
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");
  const [activePage, setActivePage] = useState(
    localStorage.getItem("activePage") || "Dashboard"
  );

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
    localStorage.setItem("isAuthenticated", JSON.stringify(isAuthenticated));
    localStorage.setItem("userRole", role);
    localStorage.setItem("activePage", activePage);
  }, [isAuthenticated, role, activePage]);

  return (
    <Router>
      {isAuthenticated && (
        <Navigate to={`/${activePage.toLowerCase()}`} replace />
      )}
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            <Login setIsAuthenticated={setIsAuthenticated} setRole={setRole} />
          }
        />

        {/* Protected Routes */}
        {isAuthenticated ? (
          role === "business-admin" ? (
            <Route
              path="/*"
              element={
                <div className="flex h-screen">
                  <BusinessSidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                  <div className="flex-1 bg-white">
                    <Routes>
                      <Route
                        path="/dashboard"
                        element={<BusinessDashboard />}
                      />
                      <Route path="/drivers" element={<BusinessDrivers />} />
                      <Route path="/vehicles" element={<BusinessVehicles />} />
                      <Route path="/inbox" element={<BusinessInbox />} />
                      <Route path="/profile" element={<BusinessProfile />} />
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          ) : (
            <Route
              path="/*"
              element={
                <div className="flex h-screen">
                  <Sidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                  <div className="flex-1 bg-white">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/feedback" element={<Feedback />} />

                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          )
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}
