import { useState, useEffect } from "react";
import "../index.css";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import defaultUserImg from "../assets/images/default.png";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Fetch subscriptions once
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const snapshot = await getDocs(collection(db, "subscriptions"));
        const data = snapshot.docs.map((doc) => doc.data().businessId);
        setSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      }
    };

    fetchSubscriptions();
  }, []);

  // Real-time listener for users
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("userType", "==", "Hauler Business Admin")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          profileImageUrl: data.profileImageUrl || "",
          businessName: data.businessName || "N/A",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "N/A",
        };
      });

      setUsers(userData);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users
    .map((user) => {
      const isSubscribed = subscriptions.includes(user.id);
      return { ...user, subscriptionStatus: isSubscribed ? "Subscribed" : "Not Subscribed" };
    })
    .filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.businessName.toLowerCase().includes(searchLower);

      const matchesFilter =
        filter === "All" || user.subscriptionStatus === filter;

      return matchesSearch && matchesFilter;
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const subscribedCount = users.filter((user) =>
    subscriptions.includes(user.id)
  ).length;
  const notSubscribedCount = users.length - subscribedCount;

  return (
    <div className="flex-1 min-h-screen p-3 sm:p-5 bg-white flex flex-col items-center">
      <h1 className="text-2xl sm:text-4xl font-bold text-[#1A4D2E] mb-3 sm:mb-6 text-center">
        Hauler Business Admins
      </h1>

      {/* Search and Filter */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full sm:w-60 px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
        >
          <option value="All">All</option>
          <option value="Subscribed">Subscribed</option>
          <option value="Not Subscribed">Not Subscribed</option>
        </select>
      </div>

      {/* Count */}
      <div className="w-full max-w-6xl text-sm sm:text-base mb-2 flex gap-4">
        <span className="text-green-700 font-semibold">
          Subscribed: {subscribedCount}
        </span>
        <span className="text-red-600 font-semibold">
          Not Subscribed: {notSubscribedCount}
        </span>
      </div>

      {/* Table */}
      <div className="w-full max-w-6xl bg-[#F5EFE6] rounded-xl shadow-lg p-3 sm:p-6 overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="bg-[#1A4D2E] text-white text-xs sm:text-lg">
              <th className="p-1 sm:p-3 min-w-[100px]">Profile</th>
              <th className="p-1 sm:p-3 min-w-[150px]">Business Name</th>
              <th className="p-1 sm:p-3 min-w-[150px]">Full Name</th>
              <th className="p-1 sm:p-3 min-w-[200px]">Email</th>
              <th className="p-1 sm:p-3 min-w-[150px]">Subscription</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-200 transition-all">
                  <td className="p-1 sm:p-3">
                    <img
                      src={user.profileImageUrl || defaultUserImg}
                      alt="Profile"
                      className="rounded-full w-8 h-8 sm:w-10 sm:h-10 mx-auto object-cover"
                    />
                  </td>
                  <td className="p-1 sm:p-3 font-medium text-[#1A4D2E]">
                    {user.businessName}
                  </td>
                  <td className="p-1 sm:p-3 text-gray-800">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="p-1 sm:p-3 text-gray-800">{user.email}</td>
                  <td className="p-1 sm:p-3 font-semibold">
                    <span
                      className={
                        user.subscriptionStatus === "Subscribed"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {user.subscriptionStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center mt-3 sm:mt-6 space-x-2 sm:space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 sm:px-5 py-1 sm:py-3 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all"
        >
          &lt;
        </button>
        <span className="text-[#1A4D2E] font-semibold text-sm sm:text-xl px-2 sm:px-6">
          {currentPage}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2 sm:px-5 py-1 sm:py-3 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
