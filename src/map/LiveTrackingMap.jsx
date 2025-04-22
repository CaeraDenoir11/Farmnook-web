import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import firebaseConfig from "../configs/firebase"; 

// ✅ Setup Mapbox Tiles
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

// ✅ Icons
const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// ✅ Pulsing icon for hauler
const pulsingIcon = L.divIcon({
  className: "pulsing-marker",
  iconSize: [30, 30],
});


document.head.appendChild(style);

// ✅ Smooth camera pan when hauler moves
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function LiveTrackingMap() {
  const queryParams = new URLSearchParams(window.location.search);
  const pickup = queryParams.get("pickup");
  const drop = queryParams.get("drop");
  const haulerId = queryParams.get("haulerId");

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [haulerCoords, setHaulerCoords] = useState(null);
  const [traveledPath, setTraveledPath] = useState([]);

  // ✅ Initialize pickup/drop positions
  useEffect(() => {
    if (pickup) setPickupCoords(pickup.split(",").map(Number));
    if (drop) setDropCoords(drop.split(",").map(Number));
  }, [pickup, drop]);

  // ✅ Subscribe to Firebase Realtime Database
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const locationRef = ref(db, `haulerLocations/${haulerId}`);

    onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.latitude && data?.longitude) {
        const currentCoords = [data.latitude, data.longitude];
        setHaulerCoords(currentCoords);

        // ✅ Update traveled path without duplicates
        setTraveledPath((prevPath) => {
          const last = prevPath[prevPath.length - 1];
          if (!last || last[0] !== currentCoords[0] || last[1] !== currentCoords[1]) {
            return [...prevPath, currentCoords];
          }
          return prevPath;
        });
      }
    });
  }, [haulerId]);

  const center = haulerCoords || pickupCoords || [10.3157, 123.8854];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={MAPBOX_TILE_URL} />

        {/* ✅ Pickup Marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={pinIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {/* ✅ Drop Marker */}
        {dropCoords && (
          <Marker position={dropCoords} icon={pinIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* ✅ Live Hauler Marker (Pulsing) */}
        {haulerCoords && (
          <>
            <ChangeView center={haulerCoords} />
            <Marker position={haulerCoords} icon={pulsingIcon}>
              <Popup>Hauler (Live)</Popup>
            </Marker>
          </>
        )}

        {/* ✅ Traveled Path (Green Polyline) */}
        {traveledPath.length > 1 && (
          <Polyline positions={traveledPath} color="green" />
        )}
      </MapContainer>
    </div>
  );
}
