import { useState } from "react";
import AddDriverButton from "../assets/buttons/AddDriverButton.jsx";

export default function BusinessDrivers() {
  const [users, setUsers] = useState([
    {
      id: "1",
      profileImg: "https://via.placeholder.com/50",
      firstName: "John",
      lastName: "Doe",
      license: "ABC123456",
      phone: "(123) 456-7890",
      status: "Active",
    },
    {
      id: "2",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Jane",
      lastName: "Smith",
      license: "XYZ987654",
      phone: "(987) 654-3210",
      status: "On Ride",
    },
    {
      id: "3",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Alice",
      lastName: "Johnson",
      license: "LMN456789",
      phone: "(456) 789-0123",
      status: "Active",
    },
    {
      id: "4",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Bob",
      lastName: "Brown",
      license: "DEF654321",
      phone: "(321) 654-9870",
      status: "Inactive",
    },
    {
      id: "5",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Emma",
      lastName: "Williams",
      license: "GHI789123",
      phone: "(111) 222-3333",
      status: "Active",
    },
    {
      id: "6",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Daniel",
      lastName: "Davis",
      license: "JKL012345",
      phone: "(444) 555-6666",
      status: "On Ride",
    },
    {
      id: "7",
      profileImg: "https://via.placeholder.com/50",
      firstName: "Sophia",
      lastName: "Miller",
      license: "MNO678901",
      phone: "(777) 888-9999",
      status: "Active",
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const usersPerPage = 5;

  // 🔹 Apply search & filtering before pagination
  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.license}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // 🔹 Pagination logic after filtering
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // 🔹 Handle adding a new driver
  const handleAddDriver = (newDriver) => {
    setUsers((prevUsers) => [...prevUsers, newDriver]);
  };

  return (
    <div className="antialiased  bg-white flex flex-col items-center min-h-screen">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-[#1A4D2E]">
            Drivers List
          </h1>

          {/* 🔹 Search & Filter Controls */}
          <div className="my-4 flex items-center gap-4 w-full">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:border-[#1A4D2E]"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="On Ride">On Ride</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:border-[#1A4D2E]"
            />
          </div>

          {/* 🔹 Driver Table */}
          <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-[#1A4D2E] text-white uppercase text-xs font-semibold tracking-wider">
                    <th className="px-5 py-3 border-b-2 text-left">Driver</th>
                    <th className="px-5 py-3 border-b-2 text-left">License</th>
                    <th className="px-5 py-3 border-b-2 text-left">Phone</th>
                    <th className="px-5 py-3 border-b-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="bg-[#F5EFE6] text-gray-900 text-sm"
                    >
                      <td className="px-5 py-5 border-b border-gray-200 flex items-center gap-4">
                        <img
                          src={user.profileImg}
                          alt="Driver"
                          className="rounded-full w-12 h-12 border-2 border-[#1A4D2E]"
                        />
                        <span className="font-light text-[#1A4D2E]">
                          {user.firstName} {user.lastName}
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {user.license}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {user.phone}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300">
                        <span
                          className={`px-3 py-1 font-semibold text-white rounded-full ${
                            user.status === "Active"
                              ? "bg-green-500"
                              : user.status === "On Ride"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 🔹 Pagination Controls */}
              <div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between">
                <span className="text-xs xs:text-sm text-gray-900">
                  Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                  {Math.min(currentPage * usersPerPage, users.length)} of{" "}
                  {users.length} Entries
                </span>

                <div className="inline-flex mt-2 xs:mt-0">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`text-sm font-semibold py-2 px-4 rounded-l ${
                      currentPage === 1
                        ? "bg-white cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-300"
                    }`}
                  >
                    &lt;
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`text-sm font-semibold py-2 px-4 rounded-r ${
                      currentPage === totalPages
                        ? "bg-white cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-300"
                    }`}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 🔹 Add Driver Button */}
          <AddDriverButton onAddDriver={handleAddDriver} />
        </div>
      </div>
    </div>
  );
}
