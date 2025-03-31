// Updated Maps.jsx with reverse geocoding for readable tooltips
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

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
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
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: routeColor, weight: 6 }],
      },
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
      createMarker: () => null, // We'll add custom markers below
    }).addTo(map);

    (async () => {
      if (showTooltips) {
        const pickupLabel = await reverseGeocode(startLat, startLng);
        const dropLabel = await reverseGeocode(endLat, endLng);

        const pickupMarker = L.marker(start, { icon: userIcon })
          .addTo(map)
          .bindPopup(pickupLabel)
          .openPopup();

        const dropMarker = L.marker(end, { icon: pinIcon })
          .addTo(map)
          .bindPopup(dropLabel)
          .openPopup();

        control.on("routesfound", () => {
          pickupMarker.openPopup();
          dropMarker.openPopup();
        });
      }
    })();

    return () => map.removeControl(control);
  }, [pickup, drop, routeColor, showTooltips, map]);

  return null;
}

function MapClickHandler({ setMarkerPos }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setMarkerPos([lat, lng]);
    },
  });
  return null;
}

export default function Maps({
  pickupLocation,
  destinationLocation,
  disablePicker = false,
  routeColor = "blue",
  showTooltips = false,
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
    return () => {
      delete window.updateUserLocation;
    };
  }, []);

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
            <Popup>Your Are Here</Popup>
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
  );
}
