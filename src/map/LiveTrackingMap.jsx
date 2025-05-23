import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import firebaseConfig from "../../configs/firebase.js";

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

// Update pickup icon to match MapModal
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

// Update destination icon to match MapModal
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

// Update ROUTE_STATES to match Android status
const ROUTE_STATES = {
  GOING_TO_PICKUP: "GOING_TO_PICKUP",
  ARRIVED_AT_PICKUP: "ARRIVED_AT_PICKUP",
  ON_DELIVERY: "ON_DELIVERY",
  ARRIVED_AT_DESTINATION: "ARRIVED_AT_DESTINATION",
  COMPLETED: "COMPLETED",
};

// Add new function to handle status updates
function updateRouteState(newState) {
  switch (newState) {
    case "Going to Pickup":
      return ROUTE_STATES.GOING_TO_PICKUP;
    case "Arrived at Pickup":
      return ROUTE_STATES.ARRIVED_AT_PICKUP;
    case "On Delivery":
      return ROUTE_STATES.ON_DELIVERY;
    case "Arrived at Destination":
      return ROUTE_STATES.ARRIVED_AT_DESTINATION;
    case "Completed":
      return ROUTE_STATES.COMPLETED;
    default:
      return ROUTE_STATES.GOING_TO_PICKUP;
  }
}

// ✅ Camera pan control
function ChangeView({ center }) {
  const map = useMap();
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [autoCenterTimeout, setAutoCenterTimeout] = useState(null);

  useEffect(() => {
    // Function to handle user interaction
    const handleInteraction = () => {
      setLastInteraction(Date.now());
    };

    // Add event listeners for map interaction
    map.on("mousedown", handleInteraction);
    map.on("touchstart", handleInteraction);
    map.on("dragstart", handleInteraction);
    map.on("zoomstart", handleInteraction);

    // Cleanup function
    return () => {
      map.off("mousedown", handleInteraction);
      map.off("touchstart", handleInteraction);
      map.off("dragstart", handleInteraction);
      map.off("zoomstart", handleInteraction);
      if (autoCenterTimeout) {
        clearTimeout(autoCenterTimeout);
      }
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      // Clear any existing timeout
      if (autoCenterTimeout) {
        clearTimeout(autoCenterTimeout);
      }

      // Set new timeout for auto-centering
      const timeout = setTimeout(() => {
        const now = Date.now();
        // Only auto-center if there's been no interaction for 10 seconds
        if (now - lastInteraction >= 10000) {
          map.panTo(center, { animate: true });
        }
      }, 10000);

      setAutoCenterTimeout(timeout);
    }

    return () => {
      if (autoCenterTimeout) {
        clearTimeout(autoCenterTimeout);
      }
    };
  }, [center, map, lastInteraction]);

  return null;
}

// Update RouteProgress component to handle new states
function RouteProgress({ haulerCoords, pickupCoords, dropCoords, routeState }) {
  const map = useMap();
  const [progressLine, setProgressLine] = useState(null);
  const [mainRoute, setMainRoute] = useState(null);
  const [dashedRoute, setDashedRoute] = useState(null);

  useEffect(() => {
    if (!haulerCoords || !pickupCoords || !dropCoords) return;

    console.log("RouteProgress: Updating routes", {
      haulerCoords,
      pickupCoords,
      dropCoords,
      routeState,
    });

    // Calculate distance between hauler and pickup
    const haulerPos = L.latLng(haulerCoords[0], haulerCoords[1]);
    const pickupPos = L.latLng(pickupCoords[0], pickupCoords[1]);
    const distance = haulerPos.distanceTo(pickupPos);

    // Check if hauler is within 20 meters of pickup
    const isAtPickup = distance <= 20;

    // Handle dashed route - only show during GOING_TO_PICKUP state
    if (routeState === ROUTE_STATES.GOING_TO_PICKUP) {
      if (dashedRoute) {
        map.removeControl(dashedRoute);
      }

      const newDashedRoute = L.Routing.control({
        waypoints: [haulerPos, pickupPos],
        lineOptions: {
          styles: [
            {
              color: "#FF6B00", // Orange color to match hauler icon
              weight: 3,
              opacity: 0.7,
              dashArray: "10, 10", // Creates dashed line effect
              lineJoin: "round",
              lineCap: "round",
            },
          ],
        },
        plan: L.Routing.plan([haulerPos, pickupPos], {
          createMarker: () => null,
        }),
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        collapsible: false,
        routeWhileDragging: false,
        showAlternatives: false,
        containerClassName: "hidden",
        router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
      }).addTo(map);

      setDashedRoute(newDashedRoute);
      console.log("Dashed route created");
    } else {
      // Remove dashed route if not in GOING_TO_PICKUP state
      if (dashedRoute) {
        map.removeControl(dashedRoute);
        setDashedRoute(null);
        console.log("Dashed route removed");
      }
    }

    // Create the main route
    if (mainRoute) {
      map.removeControl(mainRoute);
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickupCoords[0], pickupCoords[1]),
        L.latLng(dropCoords[0], dropCoords[1]),
      ],
      lineOptions: {
        styles: [
          {
            color: "#1A4D2E", // Dark green color for the main route
            weight: 4,
          },
        ],
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
      fitSelectedRoutes: false,
      collapsible: false,
      routeWhileDragging: false,
      showAlternatives: false,
      containerClassName: "hidden",
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    }).addTo(map);

    setMainRoute(routingControl);
    console.log("Main route created");

    // Listen for route found event to create progress line
    routingControl.on("routesfound", (e) => {
      console.log("Route found event triggered");
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const coordinates = route.coordinates;

        // Only show progress line if not in GOING_TO_PICKUP state
        if (routeState !== ROUTE_STATES.GOING_TO_PICKUP) {
          // Find the closest point on the route to the hauler
          let closestPoint = coordinates[0];
          let minDistance = Infinity;
          coordinates.forEach((coord) => {
            const dist = L.latLng(coord).distanceTo(haulerPos);
            if (dist < minDistance) {
              minDistance = dist;
              closestPoint = coord;
            }
          });

          // Get the index of the closest point
          const closestIndex = coordinates.findIndex(
            (coord) =>
              coord[0] === closestPoint[0] && coord[1] === closestPoint[1]
          );

          // Create progress line from start to current position
          const progressCoordinates = coordinates.slice(0, closestIndex + 1);

          if (progressLine) {
            map.removeLayer(progressLine);
          }

          const newProgressLine = L.polyline(progressCoordinates, {
            color: "#0066CC", // Blue color
            weight: 4,
            opacity: 0.7,
            lineJoin: "round",
            lineCap: "round",
          }).addTo(map);

          setProgressLine(newProgressLine);
          console.log("Progress line updated");
        } else {
          // Remove progress line if in GOING_TO_PICKUP state
          if (progressLine) {
            map.removeLayer(progressLine);
            setProgressLine(null);
            console.log("Progress line removed");
          }
        }
      }
    });

    return () => {
      if (mainRoute) {
        map.removeControl(mainRoute);
      }
      if (progressLine) {
        map.removeLayer(progressLine);
      }
      if (dashedRoute) {
        map.removeControl(dashedRoute);
      }
    };
  }, [haulerCoords, pickupCoords, dropCoords, routeState, map]);

  return null;
}

// Update RoutingControl component to only show the main route
function RoutingControl({ pickupCoords, dropCoords, routeState }) {
  const map = useMap();
  useEffect(() => {
    if (!pickupCoords || !dropCoords) return;

    console.log("RoutingControl: Creating route", {
      pickupCoords,
      dropCoords,
      routeState,
    });

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickupCoords[0], pickupCoords[1]),
        L.latLng(dropCoords[0], dropCoords[1]),
      ],
      lineOptions: {
        styles: [
          {
            color: "#1A4D2E", // Dark green color for the main route
            weight: 4,
          },
        ],
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
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN),
    }).addTo(map);

    routingControl.on("routesfound", (e) => {
      console.log("Route found in RoutingControl");
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
  }, [pickupCoords, dropCoords, routeState, map]);

  return null;
}

export default function LiveTrackingMap({
  pickup,
  drop,
  haulerId,
  height = "100%",
}) {
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  const [haulerCoords, setHaulerCoords] = useState(null);
  const [routeState, setRouteState] = useState(ROUTE_STATES.GOING_TO_PICKUP);

  // Get URL parameters if in WebView context
  const urlParams = new URLSearchParams(window.location.search);
  const urlPickup = urlParams.get("pickup");
  const urlDrop = urlParams.get("drop");
  const urlHaulerId = urlParams.get("haulerId");

  // Use URL parameters if available, otherwise use props
  const effectivePickup = urlPickup || pickup;
  const effectiveDrop = urlDrop || drop;
  const effectiveHaulerId = urlHaulerId || haulerId;

  useEffect(() => {
    if (effectivePickup) {
      try {
        const [lat, lng] = effectivePickup.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPickupCoords([lat, lng]);
          console.log("Pickup coordinates set:", [lat, lng]);
        }
      } catch (error) {
        console.error("Error parsing pickup coordinates:", error);
      }
    }
    if (effectiveDrop) {
      try {
        const [lat, lng] = effectiveDrop.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setDropCoords([lat, lng]);
          console.log("Drop coordinates set:", [lat, lng]);
        }
      } catch (error) {
        console.error("Error parsing drop coordinates:", error);
      }
    }
  }, [effectivePickup, effectiveDrop]);

  useEffect(() => {
    if (!effectiveHaulerId) return;

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const locationRef = ref(db, `haulerLocations/${effectiveHaulerId}`);

    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.latitude && data?.longitude) {
        const newHaulerCoords = [data.latitude, data.longitude];
        setHaulerCoords(newHaulerCoords);
        console.log("Hauler location updated:", newHaulerCoords);

        // Check if hauler is at pickup
        if (pickupCoords) {
          const haulerPos = L.latLng(newHaulerCoords[0], newHaulerCoords[1]);
          const pickupPos = L.latLng(pickupCoords[0], pickupCoords[1]);
          const distance = haulerPos.distanceTo(pickupPos);

          if (distance <= 20 && routeState === ROUTE_STATES.GOING_TO_PICKUP) {
            setRouteState(ROUTE_STATES.ARRIVED_AT_PICKUP);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [effectiveHaulerId, pickupCoords, routeState]);

  const center = haulerCoords || pickupCoords || [10.3157, 123.8854];

  // Add function to handle status updates from Android
  const handleStatusUpdate = (newStatus) => {
    console.log("Status update received:", newStatus);
    setRouteState(updateRouteState(newStatus));
  };

  // Expose the function to the window object for Android to call
  useEffect(() => {
    window.updateRouteStatus = handleStatusUpdate;
    return () => {
      delete window.updateRouteStatus;
    };
  }, []);

  // Determine if we're in WebView context
  const isWebView = window.location.pathname === "/live-tracking";

  return (
    <div
      className="w-full"
      style={{
        height: isWebView ? "100vh" : height,
        width: isWebView ? "100vw" : "100%",
        position: isWebView ? "fixed" : "relative",
        top: isWebView ? 0 : "auto",
        left: isWebView ? 0 : "auto",
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
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={MAPBOX_TILE_URL}
          maxZoom={19}
          minZoom={3}
          keepBuffer={4}
        />

        {pickupCoords && (
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropCoords && (
          <Marker position={dropCoords} icon={destinationIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {haulerCoords && (
          <>
            <ChangeView center={haulerCoords} />
            <Marker position={haulerCoords} icon={haulerIcon}>
              <Popup>
                <div className="text-center font-semibold">
                  {routeState === ROUTE_STATES.GOING_TO_PICKUP && (
                    <span className="text-[#FF6B00]">Going to Pickup</span>
                  )}
                  {routeState === ROUTE_STATES.ARRIVED_AT_PICKUP && (
                    <span className="text-[#f2e24f]">Arrived at Pickup</span>
                  )}
                  {routeState === ROUTE_STATES.ON_DELIVERY && (
                    <span className="text-[#87db39]">On Delivery</span>
                  )}
                  {routeState === ROUTE_STATES.ARRIVED_AT_DESTINATION && (
                    <span className="text-[#1A4D2E]">
                      Arrived at Destination
                    </span> 
                  )}
                  {routeState === ROUTE_STATES.COMPLETED && (
                    <span className="text-[#4B0082]">Completed</span>
                  )}
                </div>
              </Popup>
            </Marker>
            <RouteProgress
              haulerCoords={haulerCoords}
              pickupCoords={pickupCoords}
              dropCoords={dropCoords}
              routeState={routeState}
            />
          </>
        )}

        {pickupCoords && dropCoords && (
          <RoutingControl
            pickupCoords={pickupCoords}
            dropCoords={dropCoords}
            routeState={routeState}
          />
        )}
      </MapContainer>
    </div>
  );
}
