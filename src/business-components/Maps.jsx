// Revised Maps.jsx with stability improvements for Android/WebView
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
import "leaflet-routing-machine";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Custom icon for destination/picked location
const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Changes the map view when the user location is updated
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15); // More zoom-in for clarity on Android
    }
  }, [center, map]);
  return null;
}

// Reverse geocoding helper to convert coordinates to human-readable names
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

// Adds the route line and optional markers with labels between pickup and drop
function RouteMap({ pickup, drop, routeColor = "blue", showTooltips = false }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !drop || !map) return;

    const [startLat, startLng] = pickup.split(",").map(Number);
    const [endLat, endLng] = drop.split(",").map(Number);

    const start = L.latLng(startLat, startLng);
    const end = L.latLng(endLat, endLng);

    // Create the routing control
    const control = L.Routing.control({
      waypoints: [start, end],
      lineOptions: {
        styles: [{ color: routeColor, weight: 6 }],
      },
      createMarker: () => null,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false, // We'll do this manually
      show: false,
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    });

    control.addTo(map);

    // Fit route bounds once it's computed
    control.on("routesfound", async () => {
      const bounds = L.latLngBounds([start, end]);

      // Delay fitBounds to ensure map container is rendered
      setTimeout(() => {
        map.invalidateSize(); // crucial!
        map.fitBounds(bounds.pad(0.3));
      }, 200);

      if (showTooltips) {
        const pickupLabel = await reverseGeocode(startLat, startLng);
        const dropLabel = await reverseGeocode(endLat, endLng);

        L.marker(start, { icon: userIcon })
          .addTo(map)
          .bindPopup(pickupLabel)
          .openPopup();

        L.marker(end, { icon: pinIcon })
          .addTo(map)
          .bindPopup(dropLabel)
          .openPopup();
      }
    });

    return () => {
      // Safely remove control on unmount
      if (map && control) {
        try {
          map.removeControl(control);
        } catch (err) {
          console.warn("Failed to remove control:", err);
        }
      }
    };
  }, [pickup, drop, routeColor, showTooltips, map]);

  return null;
}

/**
 * Main Maps component to render Leaflet map
 * @param {string} pickupLocation - Comma-separated lat,lng string for pickup
 * @param {string} destinationLocation - Comma-separated lat,lng string for destination
 * @param {boolean} disablePicker - If true, disables map click selection (always true for Android)
 * @param {string} routeColor - Optional color for route line
 * @param {boolean} showTooltips - Whether to show location names on markers
 */
export default function Maps({
  pickupLocation,
  destinationLocation,
  disablePicker = true, // force disabled for Android WebView context
  routeColor = "blue",
  showTooltips = false,
  height = "100vh",
}) {
  const [position, setPosition] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);

  const defaultCenter = pickupLocation
    ? pickupLocation.split(",").map(Number)
    : [10.3157, 123.8854];

  // Expose global method to update user location externally
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

  // Expose selected location for external JavaScript to retrieve
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
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={MAPBOX_TILE_URL}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
        />

        {!disablePicker && <MapClickHandler setMarkerPos={setMarkerPos} />}

        {position && (
          <>
            <ChangeView center={position} />
            <Marker position={position} icon={userIcon}>
              <Popup>You Are Here</Popup>
            </Marker>
          </>
        )}

        {markerPos && !disablePicker && (
          <Marker position={markerPos} icon={pinIcon}>
            <Popup>
              Lat: {markerPos[0].toFixed(5)}, Lng: {markerPos[1].toFixed(5)}
            </Popup>
          </Marker>
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
