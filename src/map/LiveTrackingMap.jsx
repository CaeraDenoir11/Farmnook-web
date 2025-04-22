import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import firebaseConfig from "../../configs/firebase.js";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// ✅ Correct pulsing marker using divIcon
const haulerIcon = L.divIcon({
  className: "pulsing-marker",
  iconSize: [30, 30],
});

// ✅ Camera pan control
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

// ✅ Routing control component for the blue route
function RoutingControl({ pickupCoords, dropCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!pickupCoords || !dropCoords) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickupCoords[0], pickupCoords[1]),
        L.latLng(dropCoords[0], dropCoords[1]),
      ],
      lineOptions: {
        styles: [{ color: "blue", weight: 4 }],
      },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [pickupCoords, dropCoords, map]);

  return null;
}

export default function LiveTrackingMap() {
  const urlParams = new URLSearchParams(window.location.search);
  const pickup = urlParams.get("pickup");
  const drop = urlParams.get("drop");
  const haulerId = urlParams.get("haulerId");

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [haulerCoords, setHaulerCoords] = useState(null);

  useEffect(() => {
    if (pickup) {
      const [lat, lng] = pickup.split(",").map(Number);
      setPickupCoords([lat, lng]);
    }
    if (drop) {
      const [lat, lng] = drop.split(",").map(Number);
      setDropCoords([lat, lng]);
    }
  }, [pickup, drop]);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const locationRef = ref(db, `haulerLocations/${haulerId}`);

    onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.latitude && data?.longitude) {
        setHaulerCoords([data.latitude, data.longitude]);
      }
    });
  }, [haulerId]);

  const center = haulerCoords || pickupCoords || [10.3157, 123.8854];

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={MAPBOX_TILE_URL} />

        {pickupCoords && (
          <Marker position={pickupCoords} icon={pinIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropCoords && (
          <Marker position={dropCoords} icon={pinIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {haulerCoords && (
          <>
            <ChangeView center={haulerCoords} />
            <Marker position={haulerCoords} icon={haulerIcon}>
              <Popup>Hauler (Live)</Popup>
            </Marker>
          </>
        )}

        {/* ✅ Add the routing line between pickup and drop */}
        {pickupCoords && dropCoords && (
          <RoutingControl pickupCoords={pickupCoords} dropCoords={dropCoords} />
        )}
      </MapContainer>
    </div>
  );
}
