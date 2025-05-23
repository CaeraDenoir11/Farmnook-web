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
import Login from "./auth/Login.jsx";
import BusinessSidebar from "./business-components/Business-Sidebar.jsx";
import BusinessDashboard from "./business-components/Business-Dashboard.jsx";
import BusinessHaulers from "./business-components/Business-Haulers.jsx";
import BusinessVehicles from "./business-components/Business-Vehicles.jsx";
import BusinessHistory from "./business-components/Business-History.jsx";
import BusinessReviews from "./business-components/Business-Reviews.jsx";
import BusinesPricingManager from "./dev-components/PricingManager.jsx";
import Maps from "./business-components/Maps.jsx";
import BusinessProfile from "./business-components/Business-Profile.jsx";
import logo from "./assets/images/document-logo.png";
import OneSignal from "react-onesignal";
import MapViewer from "./map/MapViewer.jsx";
import LiveTrackingMap from "./map/LiveTrackingMap.jsx";
import GlobalNotification from "./business-components/components/GlobalNotification.jsx";
import PricingRulesManager from "./dev-components/PricingManager.jsx";
// import BusinessSubscriptionPayment from "./business-components/Business-Subscription-Payment";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    JSON.parse(localStorage.getItem("isAuthenticated")) || false
  );
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");
  const [activePage, setActivePage] = useState(
    localStorage.getItem("activePage") || "Dashboard"
  );

  useEffect(() => {
    document.title = "Farmnook";
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

  useEffect(() => {
    if (typeof window !== "undefined" && !window.OneSignalInitialized) {
      OneSignal.init({
        appId: "4e5673fb-8d4d-4ee6-a268-7fab9d390be7",
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });
      window.OneSignalInitialized = true;
      console.log("✅ OneSignal initialized!");
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* ✅ Redirect "/" to "/login" */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ✅ Public Route for Maps - Always accessible */}
        <Route path="/maps" element={<Maps />} />
        <Route path="/map-viewer" element={<MapViewer />} />
        <Route path="/live-tracking" element={<LiveTrackingMap />} />

        {/* ✅ Login Route */}
        <Route
          path="/login"
          element={
            <Login setIsAuthenticated={setIsAuthenticated} setRole={setRole} />
          }
        />

        {/* ✅ Protected Routes */}
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
                  <div className="flex-1 bg-white overflow-auto h-screen">
                    <div className="fixed top-4 right-8 z-50">
                      <GlobalNotification />
                    </div>
                    <Routes>
                      <Route
                        path="/dashboard"
                        element={<BusinessDashboard />}
                      />
                      <Route path="/haulers" element={<BusinessHaulers />} />
                      <Route path="/vehicles" element={<BusinessVehicles />} />
                      <Route path="/history" element={<BusinessHistory />} />
                      <Route path="/maps" element={<Maps />} />
                      <Route path="/reviews" element={<BusinessReviews />} />
                      <Route path="/profile" element={<BusinessProfile />} />
                      {/* <Route
                        path="/subscription-payment"
                        element={<BusinessSubscriptionPayment />}
                      /> */}

                      {/* ✅ Catch-all route to redirect to dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          ) : role === "super-admin" ? (
            <Route
              path="/*"
              element={
                <div className="flex h-screen">
                  <Sidebar
                    activePage={activePage}
                    setActivePage={setActivePage}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                  <div className="flex-1 bg-white overflow-auto h-screen">
                    <div className="fixed top-4 right-8 z-50">
                      <GlobalNotification />
                    </div>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/pricing" element={<PricingRulesManager />} />
                      {/* ✅ Catch-all route to redirect to dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </div>
                </div>
              }
            />
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}
