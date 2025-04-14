// src/pages/MapViewer.jsx
import React from "react";
import Maps from "../business-components/Maps";

export default function MapViewer() {
  const queryParams = new URLSearchParams(window.location.search);
  const pickup = queryParams.get("pickup");
  const drop = queryParams.get("drop");

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
