import { useState, useEffect } from "react";
import "../index.css";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../configs/firebase";
import defaultUserImg from "../assets/images/default.png";


export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("userType", "==", "Hauler Business Admin")
        );
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          profileImageUrl: doc.data().profileImageUrl || "",
          businessName: doc.data().businessName || "N/A",
          firstName: doc.data().firstName || "",
          lastName: doc.data().lastName || "",
          email: doc.data().email || "N/A",
        }));
        setUsers(userData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchData();
  }, []);

  // Filtering users based on search input
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.businessName.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="flex-1 min-h-screen p-3 sm:p-5 bg-white flex flex-col items-center">
      <h1 className="text-2xl sm:text-4xl font-bold text-[#1A4D2E] mb-3 sm:mb-6 text-center">
        Hauler Business Admins
      </h1>

    {/* Search Bar Positioned Top-Left */}
    <div className="w-full max-w-6xl flex justify-end mb-2">
      <input
       type="text"
       placeholder="Search..."
        className="w-60 px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]"
       value={searchTerm}
        onChange={(e) => {
         setSearchTerm(e.target.value);
          setCurrentPage(1); // Reset to page 1 on new search
       }}
     />
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
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