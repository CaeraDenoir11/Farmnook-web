import {useState, useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {
	doc,
	getDoc,
	collection,
	query,
	where,
	getDocs,
	updateDoc,
} from "firebase/firestore";
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";
import {db} from "/configs/firebase";
import "../index.css";
import profilePic from "../assets/images/default.png";
import SubscribeButton from "../components/SubscribeButton";
//import SubscribeButton from "./Business-Subscription-Payment";

export default function BusinessProfile() {
	const [admin, setAdmin] = useState(null);
	const [loading, setLoading] = useState(true);
	const [totalVehicles, setTotalVehicles] = useState(0);
	const [showSubscription, setShowSubscription] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const navigate = useNavigate();
	const auth = getAuth();
	const storage = getStorage();
	const fileInputRef = useRef(null);

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

					// Fetch total vehicles
					const vehiclesRef = collection(db, "vehicles");
					const q = query(vehiclesRef, where("businessId", "==", userId));
					const querySnapshot = await getDocs(q);
					setTotalVehicles(querySnapshot.size);

					// Check subscription status
					const subscriptionsRef = collection(db, "subscriptions");
					const qSubscriptions = query(
						subscriptionsRef,
						where("businessId", "==", userId)
					);
					const subscriptionSnapshot = await getDocs(qSubscriptions);
					setIsSubscribed(!subscriptionSnapshot.empty);
				}
			} catch (error) {
				console.error("Error fetching admin data:", error);
			} finally {
				setLoading(false);
			}
		});

		return () => unsubscribe();
	}, [auth, navigate]);

	const handleSubscribeClick = () => {
		navigate("/subscription-payment");
	};

	const handleSubscriptionClick = async () => {
		if (!auth.currentUser) return;
		setShowSubscription(true);

		try {
			const subscriptionsRef = collection(db, "subscriptions");
			const q = query(
				subscriptionsRef,
				where("userId", "==", auth.currentUser.uid)
			);
			const querySnapshot = await getDocs(q);

			setIsSubscribed(!querySnapshot.empty);
		} catch (error) {
			console.error("Error checking subscription:", error);
		}
	};

	const handleImageClick = () => {
		fileInputRef.current.click(); // trigger hidden input
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file || !auth.currentUser) return;

		const userId = auth.currentUser.uid;
		const storageRef = ref(storage, `haulerAdmin/${userId}/${file.name}`);

		try {
			// Upload to Firebase Storage
			await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(storageRef);

			// Update Firestore
			const userRef = doc(db, "users", userId);
			await updateDoc(userRef, {
				profileImageUrl: downloadURL,
			});

			// Update state
			setAdmin((prev) => ({...prev, profileImageUrl: downloadURL}));
		} catch (error) {
			console.error("Error uploading image:", error);
		}
	};

	if (loading) {
		return (
			<div className="h-screen flex items-center justify-center">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-white p-6 md:p-10 relative">
			{/* Main Profile Section */}
			<div
				className={`flex items-center justify-center transition-all duration-500 ease-in-out ${
					showSubscription ? "flex-[0.75]" : "flex-[1]"
				}`}
			>
				<div className="rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col relative">
					{/* Header Section */}
					<div className="relative bg-[#1A4D2E] h-48 md:h-56 w-full flex items-center pl-6 md:pl-12 pt-6">
						<div className="ml-auto pr-6 md:pr-12 text-right pt-10">
							<h1 className="text-3xl md:text-4xl font-extrabold text-white">
								{admin ? `${admin.businessName}` : "No Data Available"}
							</h1>
							<p className="text-lg font-medium text-white">
								{admin?.userType}
							</p>
							<button
								className="px-6 py-2 mt-4 text-white font-semibold bg-[#a63f3a] rounded-lg shadow-md hover:bg-[#D62828] transition-all duration-300 cursor-pointer"
								onClick={handleSubscriptionClick}
							>
								Subscription
							</button>
						</div>

						{/* Profile Image */}
						<img
							src={admin?.profileImageUrl || profilePic}
							alt="Admin"
							onClick={handleImageClick}
							className="absolute left-6 md:left-12 bottom-[-50px] w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg hover:shadow-xl hover:scale-110 transition-transform duration-300 cursor-pointer"
						/>
						<input
							type="file"
							accept="image/*"
							ref={fileInputRef}
							style={{display: "none"}}
							onChange={handleFileChange}
						/>
					</div>

					{/* Admin Details Section */}
					<div className="pt-24 pb-10 px-6 md:px-12 flex flex-col items-start text-left bg-[#F5EFE6] rounded-t-3xl shadow-md w-full -mt-20">
						<div className="mt-6 p-6 md:p-8 w-full">
							<h2 className="text-2xl font-semibold mb-4 text-[#1A4D2E]">
								Admin Details
							</h2>
							{admin ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
									<div className="flex flex-col items-start">
										<span className="text-sm font-medium text-gray-600">
											Owner Full Name
										</span>
										<span className="text-lg font-semibold text-[#1A4D2E]">
											{admin.firstName} {admin.lastName}
										</span>
									</div>
									<div className="flex flex-col items-start break-words">
										<span className="text-sm font-medium text-gray-600">
											Location
										</span>
										<span className="text-lg font-semibold text-[#1A4D2E]">
											{admin.locationName}
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

			{/* Subscription Panel */}
			{showSubscription && (
				<div className="absolute top-12 bottom-12 right-3 w-1/4 bg-[#a63f3a] text-white p-6 shadow-2xl rounded-2xl transition-all duration-300 flex flex-col justify-between">
					<button
						className="absolute top-4 right-4 text-white text-2xl font-bold cursor-pointer"
						onClick={() => setShowSubscription(false)}
					>
						✖
					</button>
					<div className="flex flex-col items-center">
						<h2 className="text-2xl font-bold mb-4 text-center">
							One-Time Subscription
						</h2>
						<p className="text-center text-lg mb-6">
							Enjoy premium access with a single payment—no recurring fees.
						</p>
						<div className="w-full flex flex-col items-start space-y-4">
							<div className="flex items-center space-x-3">
								<span className="text-green-300 text-xl">✔</span>
								<span className="text-lg font-medium">
									Additional Vehicle Add-On
								</span>
							</div>
							<div className="flex items-center space-x-3">
								<span className="text-green-300 text-xl">✔</span>
								<span className="text-lg font-medium">Go Ads Free</span>
							</div>
						</div>
					</div>
					{/* Subscribe Button */}
					{/* SUBSCRIBE WITH PAYMENT <button
            className="px-6 py-2 mt-4 text-white font-semibold bg-[#a63f3a] rounded-lg shadow-md hover:bg-[#D62828] transition-all duration-300"
            onClick={handleSubscribeClick}
          >
            Subscribe
          </button> */}
					<SubscribeButton />
				</div>
			)}
		</div>
	);
}
