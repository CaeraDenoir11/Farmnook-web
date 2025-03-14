import { useState, useEffect } from "react";
import "../index.css";
import { db } from "../../configs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AddVehicleButton from "../assets/buttons/AddVehicleButton.jsx";

export default function BusinessVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [vehiclesPerPage, setVehiclesPerPage] = useState(8);
  const [isLoading, setIsLoading] = useState(true); // Track loading state

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

  const handleAddVehicle = (newVehicle) => {
    setVehicles((prevVehicles) => [...prevVehicles, newVehicle]);
  };

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = vehicles.slice(
    indexOfFirstVehicle,
    indexOfLastVehicle
  );
  const totalPages = Math.ceil(vehicles.length / vehiclesPerPage);

  return (
    <div className="flex-1 h-screen p-4 sm:p-6 bg-white flex flex-col items-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1A4D2E]">
        Vehicles List
      </h1>

      <div className="w-full max-w-4xl bg-[#F5EFE6] rounded-xl shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="text-center text-gray-500 my-4 text-lg">
              Loading vehicles...
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A4D2E] text-white text-sm sm:text-lg rounded-lg">
                  <th className="p-2 sm:p-3">Model</th>
                  <th className="p-2 sm:p-3">Plate Number</th>
                  <th className="p-2 sm:p-3">Max Weight (Kg)</th>
                  <th className="p-2 sm:p-3">Size</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-[#1A4D2E]/10 transition-all rounded-lg text-xs sm:text-base"
                  >
                    <td className="p-2 sm:p-4 text-gray-700">
                      {vehicle.model}
                    </td>
                    <td className="p-2 sm:p-4 text-gray-700">
                      {vehicle.plateNumber}
                    </td>
                    <td className="p-2 sm:p-4 text-gray-700">
                      {vehicle.maxWeightKg}
                    </td>
                    <td className="p-2 sm:p-4 text-gray-700">{vehicle.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center mt-4 sm:mt-6 space-x-2 sm:space-x-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 sm:px-4 py-1 sm:py-2 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all text-xs sm:text-base"
        >
          &lt;
        </button>
        <span className="text-[#1A4D2E] font-semibold text-sm sm:text-lg">
          {currentPage}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 sm:px-4 py-1 sm:py-2 bg-[#1A4D2E] text-white rounded-lg shadow-md disabled:opacity-50 hover:bg-[#145C38] transition-all text-xs sm:text-base"
        >
          &gt;
        </button>
      </div>

      <AddVehicleButton onAddVehicle={handleAddVehicle} />
    </div>
  );
}
