import React, { useState } from "react";
import { auth, db } from "../../configs/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import LoadingScreen from "../assets/loader/LoadingScreen.jsx";
import "../login.css";
import logo from "../assets/images/document-logo.png";

export default function Login({ setIsAuthenticated, setRole }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userQuery = query(
        collection(db, "users_business_admin"),
        where("email", "==", email.toLowerCase())
      );
      const querySnapshot = await getDocs(userQuery);

      let userData = null;
      let role = "";
      let userId = "";

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
        userId = userDoc.id; // This is the Firestore-generated ID
        role = "business-admin";
      } else {
        const adminQuery = query(
          collection(db, "users_super_admin"),
          where("email", "==", email.toLowerCase())
        );
        const adminSnapshot = await getDocs(adminQuery);
        if (!adminSnapshot.empty) {
          const adminDoc = adminSnapshot.docs[0];
          userData = adminDoc.data();
          userId = adminDoc.id;
          role = "super-admin";
        }
      }

      if (!userData) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);

      setIsAuthenticated(true);
      setRole(role);
      localStorage.setItem("userRole", role);
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("userId", userId); // 🔥 Store user ID correctly

      navigate("/dashboard");
    } catch (error) {
      setError("Login failed. Please check your credentials and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F5EFE6] p-6">
      {loading && <LoadingScreen />}
      <div className="w-full max-w-4xl bg-[#1A4D2E] shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        <div className="hidden md:flex flex-col w-1/2 items-center justify-center text-center p-10 bg-[#1A4D2E]">
          <img src={logo} alt="Farmnook Logo" className="w-40 md:w-82 mb-6" />
          <h2 className="text-xl md:text-2xl font-semibold text-[#F5EFE6]">
            Bridging Farms, Delivering Freshness
          </h2>
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="bg-[#F5EFE6] p-8 md:p-10 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A4D2E] mb-6 text-center">
              Welcome Admin!
            </h2>
            {error && (
              <p className="text-red-600 text-center mb-4 font-semibold">
                ⚠️ {error}
              </p>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full p-3 border rounded-lg bg-[#FCFFE0] focus:ring-2 focus:ring-[#1A4D2E] border-gray-300"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-4 relative">
                <label className="block text-gray-700 font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full p-3 border rounded-lg bg-[#FCFFE0] focus:ring-2 focus:ring-[#1A4D2E] border-gray-300 pr-10"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <button className="w-full bg-[#1A4D2E] text-white p-3 rounded-lg hover:bg-[#163C24] transition duration-200">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
