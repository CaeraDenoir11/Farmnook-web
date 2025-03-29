import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Firebase Setup
const auth = getAuth();
const db = getFirestore();

// Mapbox Configuration
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`;

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

export default function RealTimeMap() {
  const [position, setPosition] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      authenticateUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  async function authenticateUser(token) {
    try {
      const userCredential = await signInWithCustomToken(auth, token);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setAuthenticated(true);
      } else {
        console.log("User not found in Firestore");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return loading ? (
    <h2>Loading...</h2>
  ) : !authenticated ? (
    <h2>Please log in to access the map.</h2>
  ) : (
    <MapContainer
      center={position || [10.3157, 123.8854]}
      zoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url={MAPBOX_TILE_URL}
        attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
      />

      {position && (
        <Marker position={position} icon={userIcon}>
          <Popup>You are here!</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
