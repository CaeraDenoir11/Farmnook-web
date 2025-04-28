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
  iconSize: [25, 25],
  iconAnchor: [12, 25],
});

// ✅ Hauler icon with bold design
const haulerIcon = L.divIcon({
  className: "hauler-marker",
  html: `
    <div style="
      background: #FF6B00;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 4px solid #FFD700;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: #FFD700;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      "></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
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
        styles: [{ color: "#32CD32", weight: 4 }],
      },
      plan: L.Routing.plan(
        [
          L.latLng(pickupCoords[0], pickupCoords[1]),
          L.latLng(dropCoords[0], dropCoords[1]),
        ],
        { createMarker: () => null }
      ),
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      collapsible: false,
      routeWhileDragging: false,
      showAlternatives: false,
      containerClassName: "hidden",
    }).addTo(map);

    routingControl.on("routesfound", (e) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const bounds = L.latLngBounds(route.coordinates);

        // Calculate distance between points
        const start = L.latLng(pickupCoords[0], pickupCoords[1]);
        const end = L.latLng(dropCoords[0], dropCoords[1]);
        const distance = start.distanceTo(end);

        // Dynamic zoom level based on distance
        let zoomLevel = 15;
        if (distance > 50000) {
          // > 50km
          zoomLevel = 10;
        } else if (distance > 20000) {
          // > 20km
          zoomLevel = 11;
        } else if (distance > 10000) {
          // > 10km
          zoomLevel = 12;
        } else if (distance > 5000) {
          // > 5km
          zoomLevel = 13;
        } else if (distance > 2000) {
          // > 2km
          zoomLevel = 14;
        }

        setTimeout(() => {
          map.invalidateSize();
          map.fitBounds(bounds, {
            padding: [100, 100],
            maxZoom: zoomLevel,
            animate: true,
            duration: 0.8,
            easeLinearity: 0.25,
          });
        }, 300);
      }
    });

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
    <div
      className="map-container"
      style={{
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        tap={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        zoomSnap={0.5}
        zoomDelta={0.5}
        inertia={true}
        inertiaDeceleration={3000}
        inertiaMaxSpeed={1500}
        easeLinearity={0.25}
      >
        <TileLayer
          url={MAPBOX_TILE_URL}
          maxZoom={19}
          minZoom={3}
          keepBuffer={4}
        />

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

        {pickupCoords && dropCoords && (
          <RoutingControl pickupCoords={pickupCoords} dropCoords={dropCoords} />
        )}
      </MapContainer>
    </div>
  );
}
