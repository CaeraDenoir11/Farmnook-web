import { useState } from "react";
import { Plus } from "lucide-react";
import { db } from "../../../configs/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import vehicleTypeList from "../../data/Vehicle-Types-List.js";

function AddVehicleButton({ onAddVehicle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    vehicleType: "",
    model: "",
    plateNumber: "",
  });

  const plateRegex =
    /^(?:[A-Z]{3} \d{4}|\d{3}[A-Z]{3}|[A-Z]\d{3}[A-Z]{2}|[A-Z]{2}\d{3}[A-Z])$/;


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    const { vehicleType, model, plateNumber } = formData;

    if (!vehicleType || !model || !plateNumber) {
      setError("All fields are required!");
      return;
    }

    if (!plateRegex.test(plateNumber)) {
      setError("Invalid plate number format!");
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("User ID not found.");
        return;
      }

      // ✅ Check for existing plate number (case-insensitive)
      const plateQuery = query(
        collection(db, "vehicles"),
        where("plateNumber", "==", formData.plateNumber.toUpperCase())
      );
      const existingSnapshot = await getDocs(plateQuery);

      if (!existingSnapshot.empty) {
        setError("This plate number already exists!");
        setLoading(false);
        return;
      }

      const newVehicle = {
        vehicleType: formData.vehicleType.split(" (")[0], // Only store the type
        model: formData.model,
        plateNumber: formData.plateNumber.toUpperCase(), // Standardize case
        businessId: userId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "vehicles"), newVehicle);
      const savedVehicle = { id: docRef.id, ...newVehicle };
      onAddVehicle(savedVehicle);

      // ✅ Count all vehicles belonging to this user
      const vehicleQuery = query(
        collection(db, "vehicles"),
        where("businessId", "==", userId)
      );
      const vehicleSnapshot = await getDocs(vehicleQuery);
      const totalVehicles = vehicleSnapshot.size;

      // ✅ Update the current user's totalVehicle field
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { totalVehicle: totalVehicles });

      setIsOpen(false);
      setFormData({ vehicleType: "", model: "", plateNumber: "" });
    } catch (error) {
      console.error("Error adding vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating "Add Vehicle" button */}
      <div className="group fixed bottom-6 right-6 flex justify-center items-center text-white text-sm font-bold">
        <button
          onClick={() => setIsOpen(true)}
          className="shadow-md flex items-center group-hover:gap-2 bg-[#1A4D2E] text-[#F5EFE6] p-4 rounded-full cursor-pointer duration-300 hover:scale-110 hover:shadow-2xl"
        >
          <Plus className="fill-[#F5EFE6]" size={20} />
          <span className="text-[0px] group-hover:text-sm duration-300">
            Add Vehicle
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
              Add Vehicle
            </h2>

            {error && (
              <p className="text-red-600 text-center mb-4 font-semibold">
                ⚠️ {error}
              </p>
            )}

            <div className="space-y-4">
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              >
                <option value="">Select Vehicle Type</option>
                {vehicleTypeList.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="model"
                placeholder="Vehicle Model"
                value={formData.model}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />

              <input
                type="text"
                name="plateNumber"
                placeholder="Plate Number (e.g., NBC 1234)"
                value={formData.plateNumber}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddVehicleButton;
