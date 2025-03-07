import React, { useState } from "react";
import logo from "../assets/images/document-logo.png";
import "../login.css";
import googleLogo from "../assets/icons/google.png";

const Login = ({ setIsAuthenticated, setRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "password123") {
      setIsAuthenticated(true);
      setRole("admin");
      setError(false);
    } else if (username === "business-admin" && password === "bizpass456") {
      setIsAuthenticated(true);
      setRole("business-admin");
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F5EFE6] p-6">
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
              <p className="text-red-500 text-center mb-4 font-semibold">
                ⚠️ Invalid credentials!
              </p>
            )}
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full p-3 border rounded-lg bg-[#FCFFE0] focus:ring-2 focus:ring-[#1A4D2E] border-gray-300"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg bg-[#FCFFE0] focus:ring-2 focus:ring-[#1A4D2E] border-gray-300"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button className="w-full bg-[#1A4D2E] text-white p-3 rounded-lg hover:bg-[#163C24] transition duration-200">
                Login
              </button>
            </form>
            <div className="mt-4 flex justify-center">
              <button className="w-full bg-white text-[#1A4D2E] p-3 rounded-lg border border-[#1A4D2E] hover:bg-gray-100 transition duration-200 flex items-center justify-center">
                <img
                  src={googleLogo}
                  alt="Google Logo"
                  className="w-5 h-5 mr-2"
                />
                Login with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
