import { useState, useEffect } from "react";
import "../index.css";
import profilePic from "../assets/images/profile.png";

export default function BusinessDrivers() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      const data = [
        {
          id: 1,
          name: "Alice",
          company: "Company A",
          phone: "123-456-7890",
          avatar: profilePic,
        },
        {
          id: 2,
          name: "Bob",
          company: "Company B",
          phone: "234-567-8901",
          avatar: profilePic,
        },
        {
          id: 3,
          name: "Charlie",
          company: "Company C",
          phone: "345-678-9012",
          avatar: profilePic,
        },
        {
          id: 4,
          name: "David",
          company: "Company D",
          phone: "456-789-0123",
          avatar: profilePic,
        },
        {
          id: 5,
          name: "Eve",
          company: "Company E",
          phone: "567-890-1234",
          avatar: profilePic,
        },
        {
          id: 6,
          name: "Frank",
          company: "Company F",
          phone: "678-901-2345",
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
    <div className="flex-1 h-screen p-6 bg-white flex flex-col items-center">
      <h1 className="text-3xl font-bold text-[#1A4D2E]">Drivers List</h1>
      <div className="w-full max-w-4xl bg-[#F5EFE6] rounded-xl shadow-lg p-6 mt-6">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1A4D2E] text-white text-lg rounded-lg">
              <th className="p-3">Name</th>
              <th className="p-3">ID</th>
              <th className="p-3">Company</th>
              <th className="p-3">Phone</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-[#1A4D2E]/10 transition-all rounded-lg"
              >
                <td className="p-4 flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-full w-12 h-12"
                  />
                  <span className="text-lg font-medium">{user.name}</span>
                </td>
                <td className="p-4 text-gray-700">{user.id}</td>
                <td className="p-4 text-gray-700">{user.company}</td>
                <td className="p-4 text-gray-700">{user.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center mt-6 space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all"
        >
          &lt;
        </button>
        <span className="text-[#1A4D2E] font-semibold text-lg">
          {currentPage}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
