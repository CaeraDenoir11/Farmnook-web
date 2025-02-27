import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Users from "./components/Users.jsx";
import Feedback from "./components/Feedback.jsx";
import Settings from "./components/Settings.jsx";

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
    }
  };

  return (
    <div>
      <Sidebar setActive={setActive} />
      <div>{renderContent()}</div>
    </div>
  );
}
