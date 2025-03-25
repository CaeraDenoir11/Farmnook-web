import { useState, useEffect } from "react";
import {
  IoSearchOutline,
  IoStar,
  IoStarHalf,
  IoShareOutline,
} from "react-icons/io5";
import "../index.css";

export default function BusinessReviews() {
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const generalRating = 4.6;

  // Sample Review Data
  const reviewsData = [
    {
      name: "Alice Banks",
      color: "bg-yellow-500",
      text: "The device has a clean design and the metal housing feels sturdy in my hands. Soft rounded corners make it a pleasure to look at.",
      rating: 5,
      date: "2024-03-20",
    },
    {
      name: "Jess Hopkins",
      color: "bg-red-500",
      text: "Gorgeous design! Even more responsive than the previous version. A pleasure to use!",
      rating: 1.5,
      date: "2024-03-15",
    },
    {
      name: "Mark Carter",
      color: "bg-blue-500",
      text: "Very reliable and easy to use. The battery lasts longer than expected!",
      rating: 4.8,
      date: "2024-03-10",
    },
  ];

  // Sort Reviews by Date (Latest First)
  const sortedReviews = [...reviewsData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Search Filter (Based on Review Text)
  const filteredReviews = sortedReviews.filter((review) =>
    review.text.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    try {
      console.log("BusinessReviews component mounted.");
    } catch (err) {
      console.error("Error in BusinessReviews:", err);
      setError("Something went wrong while loading reviews.");
    }
  }, []);

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen px-4 sm:px-8 py-8">
      <div className="container mx-auto w-full max-w-7xl">
        {/* HEADER SECTION */}
        <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-4">
          Customer Review
        </h1>

        {/* General Rating Section */}
        <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between px-4 mb-6">
          <div>
            <div className="text-5xl font-bold text-[#1A4D2E]">
              {generalRating.toFixed(1)}
            </div>
            <div className="flex text-[#1A4D2E] text-2xl">
              {Array.from({ length: Math.floor(generalRating) }).map((_, i) => (
                <IoStar key={i} />
              ))}
              {generalRating % 1 !== 0 && <IoStarHalf />}
            </div>
          </div>

          {/* Search Bar (Now at the Start) */}
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

        {/* REVIEWS SECTION (Wider & Sorted by Date) */}
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
                    <div
                      className={`w-8 h-8 text-center rounded-full ${review.color} text-white flex items-center justify-center font-bold`}
                    >
                      {review.name.charAt(0)}
                    </div>
                    <span className="font-semibold">{review.name}</span>
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

                <div className="text-lg mt-2">{review.text}</div>

                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm">
                    {new Date(review.date).toDateString()}
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
