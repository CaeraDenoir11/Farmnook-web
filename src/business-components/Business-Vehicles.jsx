import { useState, useEffect } from "react";
import "../index.css";
import { db } from "../../configs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AddVehicleButton from "../assets/buttons/AddVehicleButton.jsx";

export default function BusinessVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehiclesPerPage, setVehiclesPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateVehiclesPerPage = () => {
      setVehiclesPerPage(window.innerWidth <= 640 ? 5 : 8);
    };
    updateVehiclesPerPage();
    window.addEventListener("resize", updateVehiclesPerPage);
    return () => window.removeEventListener("resize", updateVehiclesPerPage);
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.error("No user ID found.");
          return;
        }
        const vehicleQuery = query(
          collection(db, "vehicles"),
          where("organizationId", "==", userId)
        );
        const querySnapshot = await getDocs(vehicleQuery);
        const vehicleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVehicles(vehicleList);
      } catch (error) {
        console.error("Error fetching vehicles: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) =>
    `${vehicle.model} ${vehicle.plateNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const currentVehicles = filteredVehicles.slice(
    (currentPage - 1) * vehiclesPerPage,
    currentPage * vehiclesPerPage
  );

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-[#1A4D2E]">
            Vehicles List
          </h1>

          {/* Search Bar */}
          <div className="my-4 flex items-center gap-4 w-full">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:border-[#1A4D2E]"
            />
          </div>

          {/* Table */}
          <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold tracking-wider">
                    <th className="px-5 py-3 border-b-1 text-left">Model</th>
                    <th className="px-5 py-3 border-b-1 text-left">
                      Plate Number
                    </th>
                    <th className="px-5 py-3 border-b-1 text-left">
                      Max Weight (Kg)
                    </th>
                    <th className="px-5 py-3 border-b-1 text-left">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="bg-[#F5EFE6] text-gray-900 text-sm"
                    >
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {vehicle.model}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {vehicle.plateNumber}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {vehicle.maxWeightKg}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-300 text-[#1A4D2E]">
                        {vehicle.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between">
                <span className="text-xs xs:text-sm text-gray-900">
                  Showing {(currentPage - 1) * vehiclesPerPage + 1} to{" "}
                  {Math.min(currentPage * vehiclesPerPage, vehicles.length)} of{" "}
                  {vehicles.length} Entries
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
          <AddVehicleButton />
        </div>
      </div>
    </div>
  );
}
