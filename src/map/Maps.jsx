import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Mapbox Configuration
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

export default function RealTimeMap() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log("Updated Position:", latitude, longitude);
          setPosition([latitude, longitude]);
        },
        (err) => console.error("Geolocation Error:", err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  }, []);

  // Function that Android WebView will call
  window.updateUserLocation = (lat, lng) => {
    console.log("Location from Android:", lat, lng);
    setPosition([lat, lng]);
  };

  return (
    <MapContainer
      center={position || [10.3157, 123.8854]} // Default to Cebu City
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url={MAPBOX_TILE_URL}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
      />

      {position && (
        <Marker position={position} icon={userIcon}>
          <Popup>You are here!</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
