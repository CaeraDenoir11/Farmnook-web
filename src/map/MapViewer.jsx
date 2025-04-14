// src/pages/MapViewer.jsx
import React from "react";
import Maps from "../business-components/Maps";

export default function MapViewer() {
  const queryParams = new URLSearchParams(window.location.search);
  const pickup = queryParams.get("pickup");
  const drop = queryParams.get("drop");
  const toCoords = (str) => {
    const [lat, lng] = (str || "").split(",").map(Number);
    return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
  };
  
  const pickupCoords = toCoords(query.get("pickup"));
  const dropCoords = toCoords(query.get("drop"));
  
  if (!pickupCoords || !dropCoords) {
    return <h1 style={{ color: "red" }}>🚨 Invalid or missing coordinates</h1>;
  }
  

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Maps
        pickupLocation={pickup}
        destinationLocation={drop}
        disablePicker={true}
        routeColor="blue"
        showTooltips={true}
        height="100%"
      />
    </div>
  );
}
