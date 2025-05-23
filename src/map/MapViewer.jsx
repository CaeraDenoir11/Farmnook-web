// src/pages/MapViewer.jsx
import React, { useEffect } from "react";
import Maps from "../business-components/Maps";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapViewer() {
  const queryParams = new URLSearchParams(window.location.search);
  const pickup = queryParams.get("pickup");
  const drop = queryParams.get("drop");
  const hideUIFlag = queryParams.get("hideUI") === "true";

  const pickupCoords = pickup?.split(",").map(Number);
  const dropCoords = drop?.split(",").map(Number);

  useEffect(() => {
    // Just debug logging for development
    console.log("Pickup:", pickupCoords);
    console.log("Drop:", dropCoords);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {pickupCoords && dropCoords && (
        <Maps
          pickupLocation={pickup}
          destinationLocation={drop}
          disablePicker={true}
          routeColor="#32CD32"
          showTooltips={true}
          height="100%"
          fitBoundsOptions={{
            padding: [100, 100], // Adds spacing around the edges (in pixels)
            maxZoom: 15, // Prevents zooming in too much
            animate: true,
            duration: 0.8,
          }}
        />
      )}
    </div>
  );
}
