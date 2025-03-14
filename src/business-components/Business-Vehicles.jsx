import { useState, useEffect } from "react";
import "../index.css";
import { db } from "../../configs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AddVehicleButton from "../assets/buttons/AddVehicleButton.jsx";

export default function BusinessVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 5;

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const userId = localStorage.getItem("userId"); // 🔥 Correct reference
        console.log("Fetching vehicles for userId:", userId); // Debugging

        if (!userId) {
          console.error("No user ID found.");
          return;
        }

        const vehicleQuery = query(
          collection(db, "vehicles"),
          where("organizationId", "==", userId) // 🔥 Match userId with organizationId
        );

        const querySnapshot = await getDocs(vehicleQuery);
        const vehicleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Vehicles:", vehicleList); // Debugging
        setVehicles(vehicleList);
      } catch (error) {
        console.error("Error fetching vehicles: ", error);
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
    <div className="flex-1 h-screen p-6 bg-white flex flex-col items-center">
      <h1 className="text-3xl font-bold text-[#1A4D2E]">Vehicles List</h1>
      <div className="w-full max-w-4xl bg-[#F5EFE6] rounded-xl shadow-lg p-6 mt-6">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#1A4D2E] text-white text-lg rounded-lg">
              <th className="p-3">Model</th>
              <th className="p-3">Plate Number</th>
              <th className="p-3">Max Weight (Kg)</th>
              <th className="p-3">Size</th>
            </tr>
          </thead>
          <tbody>
            {currentVehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="hover:bg-[#1A4D2E]/10 transition-all rounded-lg"
              >
                <td className="p-4 text-gray-700">{vehicle.model}</td>
                <td className="p-4 text-gray-700">{vehicle.plateNumber}</td>
                <td className="p-4 text-gray-700">{vehicle.maxWeightKg}</td>
                <td className="p-4 text-gray-700">{vehicle.size}</td>
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

      <AddVehicleButton onAddDriver={handleAddVehicle} />
    </div>
  );
}
