import { useState } from "react";
import { Plus } from "lucide-react";
import { db, storage } from "../../../configs/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function AddDriverButton({ onAddDriver }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    licenseNo: "",
    phone: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImageToFirebase = async () => {
    if (!imageFile) return null;
    const storageRef = ref(storage, `profileImages/haulers/${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found.");

      const imageUrl = imageFile ? await uploadImageToFirebase() : null;
      const newDriver = {
        ...formData,
        profileImg: imageUrl,
        organizationId: userId,
        createdAt: serverTimestamp(),
        status: false, // Default passive state
      };

      await addDoc(collection(db, "haulers"), newDriver);
      console.log("Driver added successfully!");
      setIsOpen(false);
      setFormData({ fname: "", lname: "", licenseNo: "", phone: "" });
      setPreviewUrl(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error adding driver:", error);
      console.log("Failed to add driver. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group fixed bottom-6 right-6 flex justify-center items-center text-white text-sm font-bold">
        <button
          onClick={() => setIsOpen(true)}
          className="shadow-md flex items-center group-hover:gap-2 bg-[#1A4D2E] text-[#F5EFE6] p-4 rounded-full cursor-pointer duration-300 hover:scale-110 hover:shadow-2xl"
        >
          <Plus className="fill-[#F5EFE6]" size={20} />
          <span className="text-[0px] group-hover:text-sm duration-300">
            Add Driver
          </span>
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex justify-center items-center">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-96">
            <h2 className="text-2xl font-bold mb-6 text-[#1A4D2E] text-center">
              Add Driver
            </h2>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-24 rounded-full shadow-lg mx-auto mb-4"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-3 border rounded-lg"
            />
            {Object.keys(formData).map((key) => (
              <input
                key={key}
                name={key}
                value={formData[key]}
                onChange={(e) =>
                  setFormData({ ...formData, [key]: e.target.value })
                }
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                className="w-full p-3 border rounded-lg my-2"
              />
            ))}
            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg"
              >
                {loading ? "Uploading..." : "Add Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddDriverButton;
