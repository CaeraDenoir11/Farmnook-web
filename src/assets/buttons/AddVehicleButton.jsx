import { useState } from "react";
import { Plus } from "lucide-react";
import { db } from "../../../configs/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function AddVehicleButton({ onAddVehicle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    model: "",
    plateNumber: "",
    maxWeightKg: "",
    size: "",
  });

  // License plate validation regex
  const plateRegex =
    /^(?:[A-Z]{3} \d{4}|\d{3}[A-Z]{3}|[A-Z]\d{3}[A-Z]{2}|[A-Z]{2}\d{3}[A-Z])$/;

  // Handles input changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission and Firestore upload
  const handleSubmit = async () => {
    setError(""); // Reset error before validation

    if (
      !formData.model ||
      !formData.plateNumber ||
      !formData.maxWeightKg ||
      !formData.size
    ) {
      setError("All fields are required!");
      return;
    }

    if (!plateRegex.test(formData.plateNumber)) {
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

      const newVehicle = {
        ...formData,
        maxWeightKg: Number(formData.maxWeightKg), // Ensure correct data type
        organizationId: userId, // Link vehicle to business admin
        assignedDriverId: null, // No driver assigned initially
        createdAt: serverTimestamp(), // Firestore-generated timestamp
      };

      const docRef = await addDoc(collection(db, "vehicles"), newVehicle);
      const savedVehicle = { id: docRef.id, ...newVehicle };

      onAddVehicle(savedVehicle); // Update UI instantly
      setIsOpen(false); // Close modal
      setFormData({ model: "", plateNumber: "", maxWeightKg: "", size: "" }); // Reset form
    } catch (error) {
      console.error("Error adding vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <  >
      {/* Floating "Add Vehicle" button */}
      <div className="group fixed bottom-6 right-6 flex justify-center items-center text-white text-sm font-bold">
        {/* Button */}
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

      {/* Vehicle input modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 ">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
              Add Vehicle
            </h2>

            {/* Error message */}
            {error && (
              <p className="text-red-600 text-center mb-4 font-semibold">
                ⚠️ {error}
              </p>
            )}

            {/* Input Fields */}
            <div className="space-y-4">
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
              <input
                type="number"
                name="maxWeightKg"
                placeholder="Max Weight (Kg)"
                value={formData.maxWeightKg}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              >
                <option value="">Select Size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Action Buttons */}
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
