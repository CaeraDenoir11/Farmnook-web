import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Dashboard from "./Dashboard.jsx";
import Users from "./Users.jsx";
import Feedback from "./Feedback.jsx";
import Settings from "./Settings.jsx";

export default function App() {
  const [active, setActive] = useState("Dashboard");

  const renderContent = () => {
    switch (active) {
      case "Users":
        return <Users />;
      case "Feedback":
        return <Feedback />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar setActive={setActive} />
      <div className="flex-1">{renderContent()}</div>
    </div>
  );
}
