import { useState } from "react";
import { Plus } from "lucide-react";
import { db, storage, auth } from "../../../configs/firebase"; // Import auth
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Auth

function AddDriverButton({ onAddDriver }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    licenseNo: "",
    phone: "",
    username: "", // Hauler's login email
    password: "",
    confirmPassword: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Handle image preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  // Upload image to Firebase Storage
  const uploadImageToFirebase = async () => {
    if (!imageFile) return null;
    const storageRef = ref(storage, `profileImages/haulers/${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  };

  // Form validation
  const validateForm = () => {
    let newErrors = {};

    // Required fields
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) newErrors[key] = "This field is required";
    });

    // Password validation
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const adminId = localStorage.getItem("userId");
      if (!adminId) throw new Error("Admin User ID not found.");

      // Step 1: Create hauler account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.username, // This is the hauler's login email
        formData.password
      );
      const haulerUid = userCredential.user.uid; // Get hauler's unique ID

      // Step 2: Upload profile image
      const imageUrl = imageFile ? await uploadImageToFirebase() : null;

      // Step 3: Store hauler details in Firestore
      const newHauler = {
        uid: haulerUid, // Link Firebase Auth account to Firestore
        fname: formData.fname,
        lname: formData.lname,
        licenseNo: formData.licenseNo,
        phone: formData.phone,
        profileImg: imageUrl,
        organizationId: adminId, // Link to business admin
        createdAt: serverTimestamp(),
        status: false, // Default status
      };

      await addDoc(collection(db, "haulers"), newHauler);
      console.log("Hauler account created successfully!");

      setIsOpen(false);
      setFormData({
        fname: "",
        lname: "",
        licenseNo: "",
        phone: "",
        username: "",
        password: "",
        confirmPassword: "",
      });
      setPreviewUrl(null);
      setImageFile(null);
    } catch (error) {
      console.error("Error adding hauler:", error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group fixed bottom-4 md:bottom-6 right-4 md:right-6 flex justify-center items-center text-white text-xs md:text-sm font-bold">
        <button
          onClick={() => setIsOpen(true)}
          className="shadow-md flex items-center group-hover:gap-2 bg-[#1A4D2E] text-[#F5EFE6] p-3 md:p-4 rounded-full cursor-pointer duration-300 hover:scale-110 hover:shadow-2xl"
        >
          <Plus className="fill-[#F5EFE6]" size={16} md:size={20} />
          <span className="text-[0px] group-hover:text-xs md:group-hover:text-sm duration-300">
            Add Driver
          </span>
        </button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center p-2 md:p-4">
          <div className="bg-[#F5EFE6] p-3 md:p-6 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl transition-all duration-300">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#1A4D2E] text-center">
              Add Driver
            </h2>

            {errors.general && (
              <p className="text-red-500 text-center text-xs md:text-sm">
                {errors.general}
              </p>
            )}

            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
              <div className="flex-1">
                <label className="block font-semibold mb-1 md:mb-2 text-sm md:text-base">
                  Hauler Account
                </label>
                {["username", "password", "confirmPassword"].map((key) => (
                  <div key={key} className="mb-1 md:mb-2">
                    <input
                      type={
                        key === "password" || key === "confirmPassword"
                          ? "password"
                          : "email"
                      }
                      name={key}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                      className="w-full p-2 md:p-3 border rounded-lg text-sm md:text-base"
                    />
                    {errors[key] && (
                      <p className="text-red-500 text-xs md:text-sm">
                        {errors[key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <label className="block font-semibold mb-1 md:mb-2 text-sm md:text-base">
                  Driver Details
                </label>
                {["fname", "lname", "licenseNo", "phone"].map((key) => (
                  <div key={key} className="mb-1 md:mb-2">
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                      className="w-full p-2 md:p-3 border rounded-lg text-sm md:text-base"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 md:mt-4 p-3 md:p-4 rounded-lg text-center">
              <label className="block font-semibold mb-1 md:mb-2 text-sm md:text-base">
                Profile Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 md:p-3 border rounded-lg text-sm md:text-base"
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 md:w-24 md:h-24 rounded-full shadow-lg mx-auto mt-2"
                />
              )}
            </div>

            <div className="flex justify-end mt-3 md:mt-4 space-x-2 md:space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 md:px-4 py-1 md:py-2 bg-gray-400 text-white rounded-lg text-xs md:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-2 md:px-4 py-1 md:py-2 bg-[#1A4D2E] text-white rounded-lg text-xs md:text-sm"
              >
                {loading ? "Uploading..." : "Add Driver"}
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
