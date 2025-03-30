import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "/configs/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "../index.css";
import profilePic from "../assets/images/default.png";

export default function BusinessProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const userId = user.uid;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const adminData = userSnap.data();
          setAdmin(adminData);

          // Fetch total vehicles for the admin's organization
          const vehiclesRef = collection(db, "vehicles");
          const q = query(vehiclesRef, where("organizationId", "==", userId));
          const querySnapshot = await getDocs(q);
          setTotalVehicles(querySnapshot.size);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen w-full bg-white p-6 md:p-10">
      <div className="rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col relative">
        <div className="relative bg-[#1A4D2E] h-48 md:h-56 w-full flex items-center pl-6 md:pl-12 pt-6">
          <div className="ml-auto pr-6 md:pr-12 text-right pt-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              {admin ? `${admin.businessName}` : "No Data Available"}
            </h1>
            <p className="text-lg font-medium text-white">{admin?.userType}</p>
          </div>
          <img
            src={profilePic}
            alt="Admin"
            className="absolute left-6 md:left-12 bottom-[-50px] w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
        <div className="pt-24 pb-10 px-6 md:px-12 flex flex-col items-start text-left bg-[#F5EFE6] rounded-t-3xl shadow-md w-full -mt-20">
          <div className="mt-6 p-6 md:p-8 w-full">
            <h2 className="text-2xl font-semibold mb-4 text-[#1A4D2E]">
              Admin Details
            </h2>
            {admin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Full Name
                  </span>
                  <span className="text-lg font-semibold text-[#1A4D2E]">
                    {admin.firstName} {admin.lastName}
                  </span>
                </div>
                <div className="flex flex-col items-start break-words">
                  <span className="text-sm font-medium text-gray-600">
                    Email
                  </span>
                  <span className="text-lg font-semibold text-[#1A4D2E]">
                    {admin.email}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Total Vehicles
                  </span>
                  <span className="text-lg font-semibold text-[#1A4D2E]">
                    {totalVehicles}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Date Joined
                  </span>
                  <span className="text-lg font-semibold text-[#1A4D2E]">
                    {admin.dateJoined
                      ? (() => {
                          const [day, month, year] =
                            admin.dateJoined.split("-");
                          const formattedDate = new Date(
                            `${year}-${month}-${day}`
                          );
                          return formattedDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          });
                        })()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <p>No admin details available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
