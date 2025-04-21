// Maps.jsx with minimal-label Mapbox style
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Use cleaner Mapbox style
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

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

// Smooth zooming when user location is updated, without locking zoom level
function ChangeView({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      // Animate to zoom level 20 but let user zoom more if needed
      map.flyTo(center, 18, {
        animate: true,
        duration: 1.2, // smoother transition
      });
    }
  }, [center, map]);

  return null;
}

function RouteMap({ pickup, drop, routeColor = "blue", showTooltips = false }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !drop) return;

    const [startLat, startLng] = pickup.split(",").map(Number);
    const [endLat, endLng] = drop.split(",").map(Number);
    const start = L.latLng(startLat, startLng);
    const end = L.latLng(endLat, endLng);

    const control = L.Routing.control({
      waypoints: [start, end],
      collapsible: true,
      show: true,
      lineOptions: {
        styles: [{ color: routeColor, weight: 4 }],
      },
      createMarker: () => null,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    });

    control.addTo(map);

    control.on("routesfound", async () => {
      const bounds = L.latLngBounds([start, end]);
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, {
          padding: [100, 100],
          maxZoom: 15,
        });
      }, 300);

      if (showTooltips) {
        const pickupLabel = await reverseGeocode(startLat, startLng);
        const dropLabel = await reverseGeocode(endLat, endLng);

        L.marker(start, { icon: userIcon }).addTo(map).bindPopup(pickupLabel);
        L.marker(end, { icon: pinIcon }).addTo(map).bindPopup(dropLabel);
      }
    });

    return () => {
      try {
        map.removeControl(control);
      } catch (err) {
        console.warn("Failed to remove control:", err);
      }
    };
  }, [pickup, drop, routeColor, showTooltips, map]);

  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
    );
    const data = await response.json();
    return data.features?.[0]?.place_name || "Unknown location";
  } catch (err) {
    console.error("Geocoding error:", err);
    return "Unknown location";
  }
}

export default function Maps({
  pickupLocation,
  destinationLocation,
  disablePicker = true,
  routeColor = "blue",
  showTooltips = false,
  height = "100vh",
}) {
  const [position, setPosition] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);

  const defaultCenter = pickupLocation
    ? pickupLocation.split(",").map(Number)
    : [10.3157, 123.8854];

  useEffect(() => {
    window.updateUserLocation = (lat, lng) => {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setPosition([parsedLat, parsedLng]);
      }
    };
    return () => delete window.updateUserLocation;
  }, []);

  useEffect(() => {
    window.getSelectedLocation = () => {
      if (!markerPos) return null;
      return { lat: markerPos[0], lng: markerPos[1] };
    };
    return () => delete window.getSelectedLocation;
  }, [markerPos]);

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={MAPBOX_TILE_URL} attribution={null} />

        {position && (
          <>
            <ChangeView center={position} />
            <Marker position={position} icon={userIcon}>
              <Popup>You Are Here</Popup>
            </Marker>
          </>
        )}

        {pickupLocation && destinationLocation && (
          <RouteMap
            pickup={pickupLocation}
            drop={destinationLocation}
            routeColor={routeColor}
            showTooltips={showTooltips}
          />
        )}
      </MapContainer>
    </div>
  );
}
