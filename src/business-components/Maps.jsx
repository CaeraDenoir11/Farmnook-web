import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Mapbox Configuration
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

// Custom Marker Icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Recenter map when position changes
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function RealTimeMap() {
  const [position, setPosition] = useState(null);

  // Register function so Android WebView can send location
  useEffect(() => {
    window.updateUserLocation = (lat, lng) => {
      console.log("Received from Android:", lat, lng);
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setPosition([parsedLat, parsedLng]);
      }
    };

    // Optional: test hardcoded location
    // setTimeout(() => window.updateUserLocation(10.3163, 123.8979), 1000);

    return () => {
      delete window.updateUserLocation;
    };
  }, []);

  return (
    <MapContainer
      center={position || [10.3157, 123.8854]} // fallback default
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url={MAPBOX_TILE_URL}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
      />

      {position && (
        <>
          <ChangeView center={position} />
          <Marker
            position={position}
            icon={userIcon}
            eventHandlers={{ add: (e) => e.target.openPopup() }}
          >
            <Popup>Your Current Location</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
