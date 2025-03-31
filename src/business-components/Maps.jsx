import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSearchParams } from "react-router-dom"; // Import for reading URL params

// Mapbox Configuration
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

// Custom Marker Icons
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
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

// Allow user to pick a location by clicking (Only if enabled)
function MapClickHandler({ setMarkerPos }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setMarkerPos([lat, lng]);
    },
  });
  return null;
}

export default function Maps() {
  const [searchParams] = useSearchParams();
  const disablePicker = searchParams.get("disablePicker") === "true"; // Check if picking is disabled

  const [position, setPosition] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);

  // Register function for Android WebView to update location
  useEffect(() => {
    window.updateUserLocation = (lat, lng) => {
      console.log("Received from Android:", lat, lng);
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setPosition([parsedLat, parsedLng]);
      }
    };

    return () => {
      delete window.updateUserLocation;
    };
  }, []);

  // Expose function for Android to retrieve selected location
  useEffect(() => {
    window.getSelectedLocation = () => {
      if (!markerPos) return null;
      return { lat: markerPos[0], lng: markerPos[1] };
    };

    return () => {
      delete window.getSelectedLocation;
    };
  }, [markerPos]);

  return (
    <MapContainer
      center={position || [10.3157, 123.8854]} // Default fallback
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url={MAPBOX_TILE_URL}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
      />
      {!disablePicker && <MapClickHandler setMarkerPos={setMarkerPos} />}{" "}
      {/* Disable picking if flagged */}
      {position && (
        <>
          <ChangeView center={position} />
          <Marker position={position} icon={userIcon}>
            <Popup>Your Are Here</Popup>
          </Marker>
        </>
      )}
      {markerPos &&
        !disablePicker && ( // Only show selected marker if picking is enabled
          <Marker position={markerPos} icon={pinIcon}>
            <Popup>
              Lat: {markerPos[0].toFixed(5)}, Lng: {markerPos[1].toFixed(5)}
            </Popup>
          </Marker>
        )}
    </MapContainer>
  );
}
