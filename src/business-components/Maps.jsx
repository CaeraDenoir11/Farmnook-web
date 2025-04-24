// Maps.jsx with minimal-label Mapbox style
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Use cleaner Mapbox style
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

const userIcon = L.divIcon({
  className: "pulsing-marker",
  html: `
    <div style="
      background: #1A4D2E;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const pickupIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      background: #FF0000;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const destinationIcon = L.divIcon({
  className: "custom-marker",
  html: `
    <div style="
      background: #0000FF;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
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

function RouteMap({
  pickup,
  drop,
  routeColor = "#179400",
  showTooltips = false,
}) {
  const map = useMap();

  useEffect(() => {
    if (!pickup || !drop) return;

    const [startLat, startLng] = pickup.split(",").map(Number);
    const [endLat, endLng] = drop.split(",").map(Number);
    const start = L.latLng(startLat, startLng);
    const end = L.latLng(endLat, endLng);

    const control = L.Routing.control({
      waypoints: [start, end],
      collapsible: false,
      show: false,
      lineOptions: {
        styles: [{ color: routeColor, weight: 4 }],
      },
      createMarker: () => null,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      containerClassName: "hidden",
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    });

    control.addTo(map);

    control.on("routesfound", async (e) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const bounds = L.latLngBounds(route.coordinates);

        // Calculate distance between points
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
            padding: [50, 50],
            maxZoom: zoomLevel,
            animate: true,
            duration: 1.5,
            easeLinearity: 0.25,
          });
        }, 300);

        if (showTooltips) {
          const pickupLabel = await reverseGeocode(startLat, startLng);
          const dropLabel = await reverseGeocode(endLat, endLng);

          L.marker(start, { icon: pickupIcon })
            .addTo(map)
            .bindPopup(pickupLabel);
          L.marker(end, { icon: destinationIcon })
            .addTo(map)
            .bindPopup(dropLabel);
        }
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
  routeColor = "#32CD32",
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
        zoomControl={true}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
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
          attribution={null}
          maxZoom={19}
          minZoom={3}
          keepBuffer={4}
        />

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
