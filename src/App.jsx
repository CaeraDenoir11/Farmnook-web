import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Users from "./components/Users.jsx";
import Feedback from "./components/Feedback.jsx";
import Settings from "./components/Settings.jsx";
import logo from "./assets/images/document-logo.png"; // Import the PNG

export default function App() {
  const [active, setActive] = useState("Dashboard");

  useEffect(() => {
    document.title = `Farmnook`;

    // Update favicon with PNG
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = logo; // Set favicon to PNG
    } else {
      // If favicon doesn't exist, create one dynamically
      const newFavicon = document.createElement("link");
      newFavicon.rel = "icon";
      newFavicon.type = "image/png";
      newFavicon.href = logo;
      document.head.appendChild(newFavicon);
    }
  }, [active]);

  const renderContent = () => {
    switch (active) {
      case "Users":
        return <Users />;
      case "Feedback":
        return <Feedback />;
      case "Settings":
        return <Settings />;
    }
  };

  return (
    <div>
      <Sidebar setActive={setActive} />
      <div>{renderContent()}</div>
    </div>
  );
}
