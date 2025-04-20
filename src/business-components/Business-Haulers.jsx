import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../configs/firebase.js";
import {
  collection,
  query,
  onSnapshot,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import AddHaulerButton from "../assets/buttons/AddHaulerButton.jsx";
import DeleteHaulerButton from "../assets/buttons/DeleteHaulerButton.jsx";
import defaultImg from "../assets/images/default.png";
import { updateDoc } from "firebase/firestore";
import useHaulers from "../assets/hooks/useHaulers.js";

export default function BusinessHaulers() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const usersPerPage = 5;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const { haulers: users, setHaulers: setUsers, currentUser, loading } = useHaulers(); // fetching haulers

  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.licenseNo}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" ||
      (user.status ? "Online" : "Offline") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl px-8 font-semibold text-[#1A4D2E]">
            Haulers List
          </h1>
          <div className="my-4 flex items-center gap-4 w-full">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-400 px-4 py-2 rounded-lg focus:outline-none focus:border-[#1A4D2E]"
            >
              <option value="All">All</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
            <input
              type="text"
              placeholder="Search haulers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:border-[#1A4D2E]"
            />
          </div>
          <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold tracking-wider">
                    <th className="px-10 py-3 border-b-1 text-left">Hauler</th>
                    <th className="px-5 py-3 border-b-1 text-left">License</th>
                    <th className="px-5 py-3 border-b-1 text-left">Phone</th>
                    <th className="px-5 py-3 border-b-1 text-left">Status</th>
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
                          src={user.profileImageUrl || defaultImg}
                          alt="Hauler"
                          className="rounded-full w-12 h-12 border-2 border-[#1A4D2E]"
                        />
                        <span className="font-light text-[#1A4D2E]">
                          {user.firstName} {user.lastName}
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 text-[#1A4D2E]">
                        {user.isAdmin ? (
                          <input
                            type="text"
                            value={user.licenseNo || ""}
                            onChange={(e) => {
                              const updatedLicense = e.target.value;
                              setUsers((prevUsers) =>
                                prevUsers.map((u) =>
                                  u.id === user.id ? { ...u, licenseNo: updatedLicense } : u
                                )
                              );
                            }}
                            onBlur={async () => {
                              try {
                                const adminRef = doc(db, "users", user.id);
                                await getDoc(adminRef); // optional: check if doc exists
                                await updateDoc(adminRef, { licenseNo: user.licenseNo });
                                console.log("License number updated successfully.");
                              } catch (error) {
                                console.error("Error updating license number:", error);
                              }
                            }}
                            placeholder="Enter License Number"
                            className="border border-gray-300 rounded px-2 focus:outline-none focus:border-[#1A4D2E]"
                          />
                        ) : (
                          user.licenseNo
                        )}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {user.phoneNum}
                      </td>
                      <td className="px-5 py-3 border-b border-gray-300">
                        <div className="flex  gap-4">
                          <span
                            className={`px-3 py-1 font-semibold text-white rounded-full ${user.status ? "bg-green-500" : "bg-gray-500"}`}
                          >
                            {user.status ? "Online" : "Offline"}
                          </span>
                          {!user.isAdmin && (
                            <DeleteHaulerButton
                              haulerId={user.id}
                              onDelete={(deletedHaulerId) => {
                                setUsers((prevUsers) =>
                                  prevUsers.filter((user) => user.id !== deletedHaulerId)
                                );
                              }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between">
                <span className="text-xs xs:text-sm text-gray-900">
                  Showing {(currentPage - 1) * usersPerPage + 1} to{" "}
                  {Math.min(currentPage * usersPerPage, filteredUsers.length)}{" "}
                  of {filteredUsers.length} Entries
                </span>
                <div className="inline-flex mt-2 xs:mt-0">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="text-sm font-semibold py-2 px-4 rounded-l bg-gray-100 hover:bg-gray-300"
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
                    className="text-sm font-semibold py-2 px-4 rounded-r bg-gray-100 hover:bg-gray-300"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AddHaulerButton onAddHauler={() => { }} />
        </div>
      </div>
    </div>
  );
}
