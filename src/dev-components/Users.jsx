import { useState, useEffect } from "react";
import "../index.css";
import {
    collection, 
    query,      
    where,      
    getDocs,    
    deleteDoc,  
    doc,        
    getDoc      
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import defaultUserImg from "../assets/images/default.png";
import { FaTrashAlt } from "react-icons/fa";
import { useBusinessAdmins, useSubscriptions, useBusinessDetails } from "../assets/hooks/useUsers";
export default function Users() {
    const { users, loadingUsers } = useBusinessAdmins();
    const { subscriptions, loadingSubscriptions } = useSubscriptions();

    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [viewMode, setViewMode] = useState("Haulers");
    const usersPerPage = 5;

    const { haulers, vehicles, loadingDetails } = useBusinessDetails(selectedBusiness ? selectedBusiness.id : null);

    const confirmDelete = (userId) => {
        const userObject = users.find(user => user.id === userId);
        if (userObject) {
            setUserToDelete({ id: userId, email: userObject.email });
            setShowConfirmModal(true);
        } else {
            
            getDoc(doc(db, "users", userId)).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserToDelete({ id: userId, email: data.email || "N/A" });
                } else {
                    console.warn(`User with ID ${userId} not found in Firestore.`);
                    setUserToDelete({ id: userId, email: "N/A (not found)" });
                }
                setShowConfirmModal(true);
            }).catch(error => {
                console.error("Error fetching user data for deletion:", error);
                setUserToDelete({ id: userId, email: "N/A (error fetching)" });
                setShowConfirmModal(true);
            });
        }
    };

    const handleDeleteConfirmed = async () => {
        if (!userToDelete || !userToDelete.id) {
            console.error("User to delete or user ID is not set.");
            setShowConfirmModal(false);
            setUserToDelete(null);
            return;
        }

        const { id: userIdToDelete, email: userEmail } = userToDelete;
        setShowConfirmModal(false);

        try {
            console.log(`Deleting user ${userEmail} (ID: ${userIdToDelete}) from Firestore 'users' collection...`);
            await deleteDoc(doc(db, "users", userIdToDelete));
            console.log(`User ${userIdToDelete} deleted from Firestore 'users' collection.`);

            const haulerQuery = query(
                collection(db, "users"),
                where("businessId", "==", userIdToDelete)
            );
            const haulerSnapshot = await getDocs(haulerQuery);
            const haulerDeletePromises = haulerSnapshot.docs.map((docSnap) =>
                deleteDoc(doc(db, "users", docSnap.id))
            );
            await Promise.all(haulerDeletePromises);
            console.log(`Deleted ${haulerSnapshot.docs.length} associated haulers.`);

            const vehicleQuery = query(
                collection(db, "vehicles"),
                where("businessId", "==", userIdToDelete)
            );
            const vehicleSnapshot = await getDocs(vehicleQuery);
            const vehicleDeletePromises = vehicleSnapshot.docs.map((docSnap) =>
                deleteDoc(doc(db, "vehicles", docSnap.id))
            );
            await Promise.all(vehicleDeletePromises);
            console.log(`Deleted ${vehicleSnapshot.docs.length} associated vehicles.`);

            alert(`Successfully deleted business admin ${userEmail} and all related data from Firestore.`);

        } catch (error) {
            console.error("Error during Firestore deletion process:", error);
            let errorMessage = `Failed to delete business admin ${userEmail} and/or related data from Firestore.`;
            if (error.code && error.code.startsWith("permission-denied")) {
                errorMessage += " Check Firestore security rules.";
            } else {
                errorMessage += ` Firestore Error: ${error.message}.`;
            }
            alert(`Deletion Error: ${errorMessage}`);
        } finally {
            setUserToDelete(null);
            // If the deleted user was the selected business, clear the selection
            if (selectedBusiness && selectedBusiness.id === userIdToDelete) {
                setSelectedBusiness(null);
                setViewMode("Haulers");
            }
        }
    };

    const handleRowClick = (business) => {
        if (!business || !business.id) {
            console.error("Invalid business object passed to handleRowClick:", business);
            return;
        }
        setSelectedBusiness(business);
        setViewMode("Haulers"); // Reset to haulers view when a new business is selected
    };

    const handleBackClick = () => {
        setSelectedBusiness(null);
        // haulers and vehicles will be cleared by useBusinessDetails hook when selectedBusiness.id becomes null
        setViewMode("Haulers");
    };

    const filteredUsers = users
        .map((user) => ({
            ...user,
            subscriptionStatus: subscriptions.includes(user.id)
                ? "Subscribed"
                : "Not Subscribed",
        }))
        .filter((user) => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                user.firstName.toLowerCase().includes(searchLower) ||
                user.lastName.toLowerCase().includes(searchLower) ||
                fullName.includes(searchLower) ||
                (user.email && user.email.toLowerCase().includes(searchLower)) ||
                user.businessName.toLowerCase().includes(searchLower);
            const matchesFilter =
                filter === "All" || user.subscriptionStatus === filter;
            return matchesSearch && matchesFilter;
        });

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const subscribedCount = users.filter((user) =>
        subscriptions.includes(user.id)
    ).length;
    const notSubscribedCount = users.length - subscribedCount;

    if (loadingUsers || loadingSubscriptions) {
        return <div className="flex-1 min-h-screen p-3 sm:p-5 bg-white flex justify-center items-center"><p className="text-xl text-gray-700">Loading data...</p></div>;
    }

    return (
        <div className="flex-1 min-h-screen p-3 sm:p-5 bg-white flex flex-col items-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1A4D2E] mb-3 sm:mb-6 text-center">
                {selectedBusiness
                    ? `${viewMode} of ${selectedBusiness.businessName}`
                    : "Hauler Business Admins"}
            </h1>

            {!selectedBusiness ? (
                <>
                    <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, business..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full sm:w-60 px-3 py-2 text-sm rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1A4D2E]"
                        />
                        <select
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full sm:w-auto px-3 py-2 rounded-md border border-gray-300 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1A4D2E]"
                        >
                            <option value="All">All Subscriptions</option>
                            <option value="Subscribed">Subscribed</option>
                            <option value="Not Subscribed">Not Subscribed</option>
                        </select>
                    </div>

                    <div className="w-full max-w-6xl text-sm sm:text-base mb-2 flex justify-start gap-4 px-1">
                        <span className="text-green-700 font-semibold">
                            Subscribed: {subscribedCount}
                        </span>
                        <span className="text-red-600 font-semibold">
                            Not Subscribed: {notSubscribedCount}
                        </span>
                        <span className="text-gray-700 font-semibold ml-auto">
                            Total: {users.length}
                        </span>
                    </div>

                    <div className="w-full max-w-6xl bg-[#F5EFE6] rounded-xl shadow-lg p-3 sm:p-6 overflow-x-auto">
                        <table className="w-full text-center border-collapse text-xs sm:text-sm md:text-base">
                            <thead>
                                <tr className="bg-[#1A4D2E] text-white text-left text-xs sm:text-sm">
                                    <th className="p-2 rounded-tl-lg">Profile</th>
                                    <th className="p-2">Business Name</th>
                                    <th className="p-2">Full Name</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Subscription</th>
                                    <th className="p-2 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.length > 0 ? (
                                    currentUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => handleRowClick(user)}
                                            className="cursor-pointer hover:bg-gray-200 border-b border-gray-300 text-left last:border-b-0"
                                        >
                                            <td className="p-2 align-middle">
                                                <img
                                                    src={user.profileImageUrl || defaultUserImg}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    onError={(e) => e.target.src = defaultUserImg}
                                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto object-cover border border-gray-300"
                                                />
                                            </td>
                                            <td className="p-2 align-middle">{user.businessName}</td>
                                            <td className="p-2 align-middle">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="p-2 align-middle">{user.email}</td>
                                            <td className="p-2 align-middle">
                                                <span
                                                    className={`text-sm font-medium px-2 py-1 rounded-full ${subscriptions.includes(user.id)
                                                            ? "bg-green-200 text-green-800"
                                                            : "bg-red-200 text-red-800"
                                                        }`}
                                                >
                                                    {subscriptions.includes(user.id)
                                                        ? "Subscribed"
                                                        : "Not Subscribed"}
                                                </span>
                                            </td>
                                            <td className="p-2 align-middle">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(user.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 transition"
                                                    title="Delete user"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center py-4 text-gray-500 italic"
                                        >
                                            No users match your search/filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center space-x-2 text-sm">
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index + 1}
                                    onClick={() => setCurrentPage(index + 1)}
                                    className={`px-3 py-1 rounded ${currentPage === index + 1
                                            ? "bg-[#1A4D2E] text-white"
                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            ) : ( // Render Haulers or Vehicles View for selectedBusiness
                <>
                    <button
                        onClick={handleBackClick}
                        className="mb-4 self-start px-4 py-2 text-sm text-white bg-[#1A4D2E] rounded-md hover:bg-blue-700 transition-colors"
                    >
                        ← Back to Business Admins
                    </button>
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setViewMode("Haulers")}
                            className={`px-4 py-2 rounded-md ${viewMode === "Haulers"
                                    ? "bg-[#1A4D2E] text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                        >
                            Haulers
                        </button>
                        <button
                            onClick={() => setViewMode("Vehicles")}
                            className={`px-4 py-2 rounded-md ${viewMode === "Vehicles"
                                    ? "bg-[#1A4D2E] text-white"
                                    : "bg-gray-200 text-gray-800"
                                }`}
                        >
                            Vehicles
                        </button>
                    </div>

                    {loadingDetails ? (
                         <div className="w-full max-w-4xl flex justify-center items-center p-4"><p className="text-lg text-gray-600">Loading details...</p></div>
                    ) : (
                        <div className="w-full max-w-4xl bg-white border border-gray-300 rounded-lg shadow p-4">
                            {viewMode === "Haulers" ? (
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-700 border-b">
                                            <th className="p-2">Full Name</th>
                                            <th className="p-2">License No</th>
                                            <th className="p-2">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {haulers.map((hauler) => (
                                            <tr key={hauler.id} className="border-b hover:bg-gray-100">
                                                <td className="p-2">{hauler.fullName}</td>
                                                <td className="p-2">{hauler.licenseNo}</td>
                                                <td className="p-2">{hauler.email}</td>
                                            </tr>
                                        ))}
                                        {haulers.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-4 text-gray-500">
                                                    No haulers found for this business.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : ( // viewMode === "Vehicles"
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="text-gray-700 border-b">
                                            <th className="p-2">Type</th>
                                            <th className="p-2">Model</th>
                                            <th className="p-2">Plate No</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicles.map((vehicle) => (
                                            <tr
                                                key={vehicle.id}
                                                className="border-b hover:bg-gray-100"
                                            >
                                                <td className="p-2">{vehicle.vehicleType}</td>
                                                <td className="p-2">{vehicle.model}</td>
                                                <td className="p-2">{vehicle.plateNumber}</td>
                                            </tr>
                                        ))}
                                        {vehicles.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-4 text-gray-500">
                                                    No vehicles found for this business.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-xl max-w-md w-full text-center">
                        <h2 className="text-lg font-bold mb-2">Confirm Deletion</h2>
                        <p className="mb-4">
                            Are you sure you want to delete <strong>{userToDelete?.email}</strong> and all their associated haulers and vehicles from the database? This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleDeleteConfirmed}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setUserToDelete(null);
                                }}
                                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}