import { useState } from "react";
import { Plus } from "lucide-react";
import { db, storage, auth } from "../../../configs/firebase";
import { query, where, getDocs, collection, setDoc, doc, serverTimestamp } from "firebase/firestore";

// ✅ NEW: Setup a secondary Firebase App and Auth instance
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const secondaryApp = initializeApp(
  {
    apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
  },
  "Secondary"
);
const secondaryAuth = getAuth(secondaryApp);

function AddHaulerButton({ onAddHauler }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    licenseNo: "",
    email: "",
    password: "",
    confirmPassword: "",
  });


  const validateForm = () => {
    let newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (!formData[key]) newErrors[key] = "This field is required";
    });

    const licensePattern = /^[A-Z]\d{2}-\d{2}-\d{6}$/;
    if (formData.licenseNo && !licensePattern.test(formData.licenseNo)) {
      newErrors.licenseNo = "License must follow format: LNN-NN-NNNNNN (e.g. D12-34-567890)";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const adminId = auth.currentUser?.uid;

      const licenseQuery = query(
        collection(db, "users"),
        where("licenseNo", "==", formData.licenseNo)
      );
      const licenseSnap = await getDocs(licenseQuery);
      if (!licenseSnap.empty) {
        setErrors({ licenseNo: "This license number is already registered." });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      const haulerUid = userCredential.user.uid;

      await secondaryAuth.signOut();

      const now = new Date();
      const formattedDate = now.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const newHauler = {
        userId: haulerUid,
        firstName: formData.fname,
        lastName: formData.lname,
        licenseNo: formData.licenseNo,
        email: formData.email,
        phoneNum: "",
        profileImg: "",
        businessId: adminId,
        dateJoined: formattedDate,
        userType: "Hauler",
        status: false,
      };

      await setDoc(doc(db, "users", haulerUid), newHauler);
      console.log("✅ Hauler account added!");

      if (onAddHauler) {
        onAddHauler({
          userId: haulerUid,
          ...newHauler,
        });
      }

      setIsOpen(false);
      setFormData({
        fname: "",
        lname: "",
        licenseNo: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
    } catch (error) {
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
            Add Hauler
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex justify-center items-center p-2 md:p-4">
          <div className="bg-[#F5EFE6] p-3 md:p-6 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl transition-all duration-300">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4 text-[#1A4D2E] text-center">
              Add Hauler
            </h2>

            {errors.general && (
              <p className="text-red-500 text-center text-xs md:text-sm">
                {errors.general}
              </p>
            )}
            {errors.licenseNo && (
              <p className="text-red-500 text-center md:text-sm mt-1">
                {errors.licenseNo}
              </p>
            )}

            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
              <div className="flex-1">
                <label className="block font-semibold mb-1 md:mb-2 text-sm md:text-base">
                  Hauler Account
                </label>
                {["email", "password", "confirmPassword"].map((key) => (
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
                  Hauler Details
                </label>
                {["fname", "lname", "licenseNo"].map((key) => (
                  <div key={key} className="mb-1 md:mb-2">
                    <input
                      type="text"
                      name={key}
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      placeholder={key === "licenseNo"
                        ? "A00-00-000000"
                        : key === "fname"
                          ? "First Name"
                          : "Last Name"}
                      className="w-full p-2 md:p-3 border rounded-lg text-sm md:text-base"
                    />

                  </div>
                ))}
              </div>
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
                {loading ? "Uploading..." : "Add Hauler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AddHaulerButton;
