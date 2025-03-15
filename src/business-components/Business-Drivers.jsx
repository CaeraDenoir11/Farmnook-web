import { useState, useEffect } from "react";
import { db } from "../../configs/firebase";
import { collection, getDocs } from "firebase/firestore";
import AddDriverButton from "../assets/buttons/AddDriverButton.jsx";

export default function BusinessDrivers() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    const fetchHaulers = async () => {
      console.log("Fetching userId from localStorage...");
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID not found.");
        return;
      }

      const querySnapshot = await getDocs(collection(db, "haulers"));
      const userList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.organizationId === userId); // Filter by organizationId

      setUsers(userList);
    };

    fetchHaulers();
  }, []);

  const handleAddDriver = (newDriver) => {
    setUsers((prevUsers) => [...prevUsers, newDriver]);
  };

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
              <th className="p-3">Profile</th>
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
                    src={user.profileImg}
                    alt="Driver"
                    className="rounded-full w-12 h-12"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
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

      {/* Add Driver Button */}
      <AddDriverButton onAddDriver={handleAddDriver} />
    </div>
  );
}
