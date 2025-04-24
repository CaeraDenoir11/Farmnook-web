import { useState, useEffect } from "react";
import "../index.css";
import { db } from "../../configs/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AddVehicleButton from "../assets/buttons/AddVehicleButton.jsx";
import DeleteVehicleButton from "../assets/buttons/DeleteVehicleButton.jsx";
import vehicleTypeList from "../data/Vehicle-Types-List.js";
import VehicleDetailsIcon from "../assets/icons/vehicle-details.svg";
import useVehicles from "../assets/hooks/useVehicles.js";
import { Plus, Edit, Trash2, Truck, Calendar, Gauge } from "lucide-react";

export default function BusinessVehicles() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehiclesPerPage, setVehiclesPerPage] = useState(5);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    type: "",
    year: "",
    capacity: "",
    status: "active",
  });

  useEffect(() => {
    const updateVehiclesPerPage = () => {
      setVehiclesPerPage(window.innerWidth <= 640 ? 5 : 8);
    };
    updateVehiclesPerPage();
    window.addEventListener("resize", updateVehiclesPerPage);
    return () => window.removeEventListener("resize", updateVehiclesPerPage);
  }, []);

  const { vehicles, setVehicles, loading: isLoading } = useVehicles(); // Fetching vehicles

  const handleDeleteVehicle = (vehicleId) => {
    setVehicles((prevVehicles) =>
      prevVehicles.filter((vehicle) => vehicle.id !== vehicleId)
    );
  };

  const filteredVehicles = vehicles.filter((vehicle) =>
    `${vehicle.vehicleType} ${vehicle.model} ${vehicle.plateNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const currentVehicles = filteredVehicles.slice(
    (currentPage - 1) * vehiclesPerPage,
    currentPage * vehiclesPerPage
  );
  const handleAddVehicle = (newVehicle) => {
    setVehicles((prevVehicles) => [...prevVehicles, newVehicle]); // ✅ Correct state update
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVehicle) {
      // Handle update
    } else {
      handleAddVehicle(formData);
    }
    setShowAddVehicle(false);
    setEditingVehicle(null);
    setFormData({
      plateNumber: "",
      model: "",
      type: "",
      year: "",
      capacity: "",
      status: "active",
    });
  };

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl px-8 font-semibold text-[#1A4D2E]">
            Vehicles List
          </h1>
          <div className="my-4 flex items-center gap-4 w-full">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent transition-colors duration-200"
            />
          </div>
          <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
            <div className="inline-block min-w-full shadow-lg rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold tracking-wider">
                    <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                      Vehicle
                    </th>
                    <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                      Type
                    </th>
                    <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                      Year
                    </th>
                    <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                      Capacity
                    </th>
                    <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="bg-white hover:bg-[#F5EFE6]/50 transition-colors duration-200"
                    >
                      <td className="px-5 py-5 border-b border-[#1A4D2E]/10">
                        <div className="flex items-center gap-4">
                          <img
                            src={VehicleDetailsIcon}
                            alt="Vehicle"
                            className="w-12 h-12 object-contain"
                          />
                          <div>
                            <span className="font-medium text-[#1A4D2E]">
                              {vehicle.plateNumber}
                            </span>
                            <p className="text-sm text-gray-600">
                              {vehicle.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                        {vehicle.type}
                      </td>
                      <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                        {vehicle.year}
                      </td>
                      <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                        {vehicle.capacity} kg
                      </td>
                      <td className="px-5 py-5 border-b border-[#1A4D2E]/10">
                        <div className="flex gap-4 items-center">
                          <span
                            className={`px-3 py-1 font-medium text-white rounded-full ${
                              vehicle.status === "active"
                                ? "bg-green-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {vehicle.status}
                          </span>
                          <DeleteVehicleButton
                            vehicleId={vehicle.id}
                            onDelete={(deletedVehicleId) => {
                              setVehicles((prevVehicles) =>
                                prevVehicles.filter(
                                  (vehicle) => vehicle.id !== deletedVehicleId
                                )
                              );
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between border-t border-[#1A4D2E]/10">
                <span className="text-xs xs:text-sm text-gray-900">
                  Showing {(currentPage - 1) * vehiclesPerPage + 1} to{" "}
                  {Math.min(
                    currentPage * vehiclesPerPage,
                    filteredVehicles.length
                  )}{" "}
                  of {filteredVehicles.length} Entries
                </span>
                <div className="inline-flex mt-2 xs:mt-0">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="text-sm font-semibold py-2 px-4 rounded-l bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="text-sm font-semibold py-2 px-4 rounded-r bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
          <AddVehicleButton onAddVehicle={() => {}} />
        </div>
      </div>
    </div>
  );
}
