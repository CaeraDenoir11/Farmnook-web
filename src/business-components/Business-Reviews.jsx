import React, { useState, useEffect } from "react";
import {
  IoSearchOutline,
  IoStar,
  IoStarHalf,
  IoShareOutline,
} from "react-icons/io5";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import "../index.css";

// ——— Initialize Firebase ———
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
  appId: import.meta.env.VITE_FIREBASE_APPID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function BusinessReviews() {
  // UI state
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [status, setStatus] = useState("loading"); 
  // status: "loading" | "forbidden" | "ready"

  useEffect(() => {
    const fetchReviewsForAdmin = async () => {
      try {
        // 1️⃣ Ensure user is signed in
        const user = auth.currentUser;
        if (!user) {
          setStatus("forbidden");
          return;
        }

        // 2️⃣ Load their profile from Firestore
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const userData = userSnap.data();
        if (
          !userData ||
          userData.userType !== "Hauler Business Admin" ||
          typeof userData.userId !== "string"
        ) {
          setStatus("forbidden");
          return;
        }

        // 3️⃣ Query feedback only for *this* admin’s business
        const myBusinessId = userData.userId;
        const q = query(
          collection(db, "feedback"),
          where("haulerId", "==", myBusinessId)
        );
        const snap = await getDocs(q);
        const reviews = snap.docs.map((d) => d.data());

        // 4️⃣ Compute average rating
        const total = reviews.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(reviews.length ? total / reviews.length : 0);

        // 5️⃣ Save fetched reviews & flip to “ready”
        setReviewsData(reviews);
        setStatus("ready");
      } catch (err) {
        console.error("Error loading reviews:", err);
        setError("Something went wrong while loading reviews.");
        setStatus("ready");
      }
    };

    fetchReviewsForAdmin();
  }, []);

  // While we’re loading the user/profile feedback…
  if (status === "loading") {
    return <p className="text-center mt-8">Loading…</p>;
  }
  // If they’re not a Hauler Business Admin …
  if (status === "forbidden") {
    return (
      <p className="text-center mt-8 text-red-600">
        🚫 You don’t have permission to view this page.
      </p>
    );
  }

  // Sort newest first, then filter by search
  const sorted = [...reviewsData].sort(
    (a, b) => b.timestamp.seconds - a.timestamp.seconds
  );
  const filtered = sorted.filter((r) =>
    r.comment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen px-4 sm:px-8 py-8">
      <div className="container mx-auto w-full max-w-7xl">
        {/* HEADER */}
        <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-4">
          Customer Reviews
        </h1>

        {/* AVERAGE RATING + SEARCH */}
        <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between px-4 mb-6">
          <div>
            <div className="text-5xl font-bold text-[#1A4D2E]">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex text-[#1A4D2E] text-2xl">
              {Array.from({ length: Math.floor(averageRating) }).map((_, i) => (
                <IoStar key={i} />
              ))}
              {averageRating % 1 !== 0 && <IoStarHalf />}
            </div>
          </div>
          <div className="w-full sm:w-96 mt-4 sm:mt-0">
            <div className="flex items-center bg-white border border-gray-400 rounded-lg px-3 py-2">
              <IoSearchOutline className="text-[#1A4D2E] text-lg mr-2" />
              <input
                type="text"
                placeholder="Search Feedback..."
                className="w-full bg-transparent focus:outline-none text-[#1A4D2E] placeholder-[#1A4D2E]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <p className="text-red-600 text-center mb-4 font-semibold">
            ⚠️ {error}
          </p>
        )}

        {/* REVIEWS LIST */}
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 w-full max-w-7xl">
          {filtered.length > 0 ? (
            filtered.map((r, idx) => (
              <div
                key={idx}
                className="w-full bg-white p-6 rounded-md text-[#1A4D2E] border border-[#1A4D2E] shadow-md mb-4"
              >
                <div className="flex justify-between">
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 text-center rounded-full bg-gray-500 text-white flex items-center justify-center font-bold">
                      {(r.farmerName || "A").charAt(0)}
                    </div>
                    <span className="font-semibold">{r.farmerName || "Anonymous"}</span>
                  </div>
                  <div className="flex p-1 gap-1 text-[#1A4D2E] text-lg">
                    {Array.from({ length: Math.floor(r.rating) }).map((_, i) => (
                      <IoStar key={i} />
                    ))}
                    {r.rating % 1 !== 0 && <IoStarHalf />}
                  </div>
                </div>

                <div className="text-lg mt-2">{r.comment}</div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm">
                    {new Date(r.timestamp.seconds * 1000).toDateString()}
                  </span>
                  <button className="p-1 px-3 bg-[#F5EFE6] text-[#1A4D2E] hover:bg-opacity-80 border border-[#1A4D2E] rounded-md flex items-center gap-1">
                    <IoShareOutline /> Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[#1A4D2E] text-center font-semibold mt-4">
              No reviews found for your business.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
