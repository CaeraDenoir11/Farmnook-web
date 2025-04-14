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

// 📍 Map click handler to support location selection if enabled
function MapClickHandler({ setMarkerPos }) {
  useMapEvents({
    click(e) {
      setMarkerPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// 🔁 Automatically adjust view on user location change with reset zoom after 10s
function ChangeView({ center }) {
  const map = useMap();
  const defaultZoom = 13;
  const zoomedIn = 17;

  useEffect(() => {
    if (center) {
      map.setView(center, zoomedIn, { animate: true });

      const timeout = setTimeout(() => {
        map.setView(center, defaultZoom, { animate: true });
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [center, map]);

  return null;
}

// 🗺 Reverse geocoding helper to convert coordinates to human-readable names
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

// 🚚 Adds the route line and optional markers between pickup and drop
function RouteMap({ pickup, drop, routeColor = "blue", showTooltips = false }) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !drop || !map) return;

    const [startLat, startLng] = pickup.split(",").map(Number);
    const [endLat, endLng] = drop.split(",").map(Number);

    const start = L.latLng(startLat, startLng);
    const end = L.latLng(endLat, endLng);

    const control = L.Routing.control({
      waypoints: [start, end],
      lineOptions: {
        styles: [{ color: routeColor, weight: 6 }],
      },
      createMarker: () => null,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    });

    control.addTo(map);

    control.on("routesfound", async () => {
      const bounds = L.latLngBounds([start, end]);

      setTimeout(() => {
        map.invalidateSize();
        // map.fitBounds(bounds.pad(0.3)); // optionally enable this if needed
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
      try {
        map.removeControl(control);
      } catch (err) {
        console.warn("Failed to remove control:", err);
      }
    };
  }, [pickup, drop, routeColor, showTooltips, map]);

  return null;
}

/**
 * 📦 Main Maps component to render Leaflet map
 */
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

  // 🌐 Expose user location update function
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

  // 🌐 Expose selected marker for external retrieval
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
            fullScreen={true}
          />
        )}
      </MapContainer>
    </div>
  );
}
