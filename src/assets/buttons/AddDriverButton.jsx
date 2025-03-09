import { useState } from "react";
import { Plus } from "lucide-react";

function AddDriverButton({ onAddDriver }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    company: "",
    phone: "",
    avatar: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onAddDriver(formData);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#1A4D2E] text-white px-5 py-4 flex items-center gap-2 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-transform duration-300"
      >
        <Plus size={20} /> Add Driver
      </button>

      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-96">
            <h2 className="text-2xl font-bold mb-6 text-[#1A4D2E] text-center">
              Add Driver
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
              <input
                type="text"
                name="id"
                placeholder="ID"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
              <input
                type="text"
                name="company"
                placeholder="Company"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#1A4D2E] outline-none"
              />
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddDriverButton;
