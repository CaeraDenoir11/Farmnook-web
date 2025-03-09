import { useState, useEffect } from "react";
import "../index.css";
import profilePic from "../assets/images/profile.png";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      const data = [
        {
          id: "10001",
          name: "Alice",
          company: "Company A",
          email: "alice@companya.com",
          totalVehicles: 12,
          avatar: profilePic,
        },
        {
          id: "10002",
          name: "Bob",
          company: "Company B",
          email: "bob@companyb.com",
          totalVehicles: 8,
          avatar: profilePic,
        },
        {
          id: "10003",
          name: "Charlie",
          company: "Company C",
          email: "charlie@companyc.com",
          totalVehicles: 15,
          avatar: profilePic,
        },
        {
          id: "10004",
          name: "David",
          company: "Company D",
          email: "david@companyd.com",
          totalVehicles: 6,
          avatar: profilePic,
        },
        {
          id: "10005",
          name: "Eve",
          company: "Company E",
          email: "eve@companye.com",
          totalVehicles: 10,
          avatar: profilePic,
        },
        {
          id: "10006",
          name: "Frank",
          company: "Company F",
          email: "frank@companyf.com",
          totalVehicles: 7,
          avatar: profilePic,
        },
      ];
      setUsers(data);
    };
    fetchData();
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="flex-1 min-h-screen p-3 sm:p-5 bg-white flex flex-col items-center">
      <h1 className="text-2xl sm:text-4xl font-bold text-[#1A4D2E] mb-3 sm:mb-6 text-center">
        Users List
      </h1>
      <div className="w-full max-w-6xl bg-[#F5EFE6] rounded-xl shadow-lg p-3 sm:p-6 overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="bg-[#1A4D2E] text-white text-xs sm:text-lg">
              <th className="p-1 sm:p-3 min-w-[80px] sm:w-1/4">Company</th>
              <th className="p-1 sm:p-3 min-w-[120px] sm:w-1/4">ID</th>
              <th className="p-1 sm:p-3 min-w-[160px] sm:w-1/4">Email</th>
              <th className="p-1 sm:p-3 min-w-[60px] sm:w-1/6">Vehicles</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-200 transition-all">
                <td className="p-1 sm:p-3 flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-full w-5 h-5 sm:w-7 sm:h-7"
                  />
                  <span className="text-xs sm:text-sm md:text-lg font-medium">
                    {user.company}
                  </span>
                </td>
                <td className="p-1 sm:p-3 text-gray-700 font-mono font-semibold text-xs sm:text-lg whitespace-nowrap">
                  {user.id}
                </td>
                <td className="p-1 sm:p-3 text-gray-700 text-xs sm:text-lg whitespace-nowrap">
                  {user.email}
                </td>
                <td className="p-1 sm:p-3 text-gray-700 text-xs sm:text-lg text-center whitespace-nowrap">
                  {user.totalVehicles}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          disabled={currentPage === totalPages}
          className="px-2 sm:px-5 py-1 sm:py-3 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
