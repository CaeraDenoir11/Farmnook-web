import { useState, useEffect } from "react";
import { IoSearchOutline, IoStar, IoStarHalf, IoShareOutline } from "react-icons/io5";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import "../index.css";

// Initialize Firebase
import { initializeApp } from "firebase/app";
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
const db = getFirestore(app);

export default function BusinessReviews() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [reviewsData, setReviewsData] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, "feedback"); // Your Firestore collection for reviews
        const querySnapshot = await getDocs(reviewsRef);
        const reviews = querySnapshot.docs.map((doc) => doc.data());

        setReviewsData(reviews);

        // Calculate the average rating
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        const avgRating = totalRating / reviews.length;
        setAverageRating(avgRating);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Something went wrong while loading reviews.");
      }
    };

    fetchReviews();
  }, []);

  // Sort Reviews by Date (Latest First)
  const sortedReviews = [...reviewsData].sort(
    (a, b) => new Date(b.timestamp.seconds * 1000) - new Date(a.timestamp.seconds * 1000)
  );

  // Search Filter (Based on Review Text)
  const filteredReviews = sortedReviews.filter((review) =>
    review.comment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen px-4 sm:px-8 py-8">
      <div className="container mx-auto w-full max-w-7xl">
        {/* HEADER SECTION */}
        <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-4">
          Customer Reviews
        </h1>

        {/* General Rating Section */}
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

          {/* Search Bar */}
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

        {/* ERROR HANDLING */}
        {error && (
          <p className="text-red-600 text-center mb-4 font-semibold">
            ⚠️ {error}
          </p>
        )}

        {/* REVIEWS SECTION */}
        <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 w-full max-w-7xl">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review, index) => (
              <div
                key={index}
                className="w-full bg-white p-6 rounded-md text-[#1A4D2E] border border-[#1A4D2E] shadow-md mb-4"
              >
                {/* Profile and Rating */}
                <div className="flex justify-between">
                  <div className="flex gap-2 items-center">
                    {/* Default Profile Picture */}
                    <div
                      className="w-8 h-8 text-center rounded-full bg-gray-500 text-white flex items-center justify-center font-bold"
                    >
                      {review.farmerName ? review.farmerName.charAt(0) : "A"}
                    </div>
                    <span className="font-semibold">{review.farmerName || "Anonymous"}</span>
                  </div>
                  <div className="flex p-1 gap-1 text-[#1A4D2E] text-lg">
                    {Array.from({ length: Math.floor(review.rating) }).map(
                      (_, i) => (
                        <IoStar key={i} />
                      )
                    )}
                    {review.rating % 1 !== 0 && <IoStarHalf />}
                  </div>
                </div>

                <div className="text-lg mt-2">{review.comment}</div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm">
                    {new Date(review.timestamp.seconds * 1000).toDateString()}
                  </span>
                  <button className="p-1 px-3 bg-[#F5EFE6] text-[#1A4D2E] hover:bg-opacity-80 border border-[#1A4D2E] rounded-md flex items-center gap-1">
                    <IoShareOutline /> Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[#1A4D2E] text-center font-semibold mt-4">
              No reviews found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
