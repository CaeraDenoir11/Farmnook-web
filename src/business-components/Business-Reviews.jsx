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

  useEffect(() => {
    try {
      console.log("BusinessReviews component mounted.");
    } catch (err) {
      console.error("Error in BusinessReviews:", err);
      setError("Something went wrong while loading reviews.");
    }
  }, []);

  return (
    <div className="flex-1 bg-[#1A4D2E] flex justify-center items-center h-full p-10">
      <div className="md:w-3/5 w-3/4 px-10 flex flex-col gap-2 p-5 bg-[#F5EFE6] text-[#1A4D2E] rounded-lg shadow-lg">
        <h1 className="py-5 text-lg font-semibold">Reviews</h1>

        {/* Error Handling */}
        {error && (
          <p className="text-red-600 text-center mb-4 font-semibold">
            ⚠️ {error}
          </p>
        )}

        {/* Search Bar */}
        <div className="flex bg-[#1A4D2E] bg-opacity-20 border border-[#1A4D2E] rounded-md p-2">
          <IoSearchOutline className="text-[#1A4D2E] text-xl" />
          <input
            type="text"
            placeholder="Search Review"
            className="p-2 bg-transparent focus:outline-none w-full text-[#1A4D2E] placeholder-[#1A4D2E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Reviews */}
        <div className="flex flex-col gap-3 mt-10">
          {[
            {
              name: "Jess Hopkins",
              color: "bg-red-500",
              text: "Gorgeous design! Even more responsive than the previous version. A pleasure to use!",
              rating: 4.5,
            },
            {
              name: "Alice Banks",
              color: "bg-yellow-500",
              text: "The device has a clean design and the metal housing feels sturdy in my hands. Soft rounded corners make it a pleasure to look at.",
              rating: 5,
            },
          ].map((review, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 bg-[#1A4D2E] p-4 rounded-md text-[#F5EFE6]"
            >
              {/* Profile and Rating */}
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <div
                    className={`w-7 h-7 text-center rounded-full ${review.color} text-white flex items-center justify-center`}
                  >
                    {review.name.charAt(0)}
                  </div>
                  <span>{review.name}</span>
                </div>
                <div className="flex p-1 gap-1 text-yellow-400">
                  {Array.from({ length: Math.floor(review.rating) }).map(
                    (_, i) => (
                      <IoStar key={i} />
                    )
                  )}
                  {review.rating % 1 !== 0 && <IoStarHalf />}
                </div>
              </div>

              <div>{review.text}</div>

              <div className="flex justify-between">
                <span>Feb 13, 2021</span>
                <button className="p-1 px-2 bg-[#F5EFE6] text-[#1A4D2E] hover:bg-opacity-80 border border-[#F5EFE6] rounded-md flex items-center gap-1">
                  <IoShareOutline /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
