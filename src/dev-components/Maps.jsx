import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom Mapbox Marker Icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const MAPBOX_ACCESS_TOKEN = "YOUR_MAPBOX_ACCESS_TOKEN";
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

export default function RealTimeMap() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      (err) => {
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <MapContainer
      center={position || [51.505, -0.09]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      {/* Mapbox Tile Layer */}
      <TileLayer
        url={MAPBOX_TILE_URL}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
      />

      {/* User Marker (Real-time) */}
      {position && (
        <Marker position={position} icon={userIcon}>
          <Popup>You are here!</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
