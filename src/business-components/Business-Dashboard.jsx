import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import {
	collection,
	query,
	where,
	doc,
	getDoc,
	onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../../configs/firebase";
import { onAuthStateChanged, GoogleAuthProvider } from "firebase/auth"; // ✅ Fixed here
import MapModal from "../map/MapModal.jsx";
import Maps from "./Maps";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";
import MonthlyTransactionsCard from "../business-components/components/MonthlyTransactionsCard.jsx";
import useDeliveryRequests from "../assets/hooks/useDeliveryRequests.js";
import useNotifications from "../assets/hooks/useNotifications";

const monthlyData = {
	January: [
		{ week: "Week 1", transactions: 10 },
		{ week: "Week 2", transactions: 15 },
		{ week: "Week 3", transactions: 20 },
		{ week: "Week 4", transactions: 25 },
	],
	February: [
		{ week: "Week 1", transactions: 12 },
		{ week: "Week 2", transactions: 18 },
		{ week: "Week 3", transactions: 24 },
		{ week: "Week 4", transactions: 30 },
	],
	March: [
		{ week: "Week 1", transactions: 20 },
		{ week: "Week 2", transactions: 25 },
		{ week: "Week 3", transactions: 30 },
		{ week: "Week 4", transactions: 35 },
	],
};

export default function BusinessDashboard() {
	const [selectedMonth, setSelectedMonth] = useState("March");
	const [selectedRequest, setSelectedRequest] = useState(null);

	const [modalOpen, setModalOpen] = useState(false);
	const [mapPoints, setMapPoints] = useState({ pickup: "", drop: "" });
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [readRequests, setReadRequests] = useState(() => {
		const saved = localStorage.getItem("readRequests");
		return saved ? JSON.parse(saved) : [];
	});

	// ✅ Ad modal state
	const [showAd, setShowAd] = useState(false);
	const [adClosable, setAdClosable] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(5); // Track remaining time for ad

	// ✅ Check subscription status and show ad
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const subRef = query(
					collection(db, "subscriptions"),
					where("businessId", "==", user.uid)
				);
				const unsubscribeSnapshot = onSnapshot(subRef, (snapshot) => {
					if (snapshot.empty) {
						// User is not subscribed
						setShowAd(true);
						setTimeout(() => setAdClosable(true), 5000); // Make it closable after 5s
					} else {
						// User is subscribed, hide the ad
						setShowAd(false);
					}
				});
				return () => unsubscribeSnapshot();
			}
		});

		return () => unsubscribeAuth();
	}, []);

	// ✅ Countdown timer for ad
	useEffect(() => {
		if (showAd && secondsLeft > 0) {
			const timer = setInterval(() => {
				setSecondsLeft((prev) => prev - 1);
			}, 1000);

			return () => clearInterval(timer); // Clean up timer on unmount or when secondsLeft changes
		} else if (secondsLeft === 0) {
			setAdClosable(true); // Make ad closable after 5 seconds
		}
	}, [showAd, secondsLeft]);

	const { requests, loading: loadingRequests, setRequests } = useDeliveryRequests(); //Fetching delivery requests
	// Realtime Notifications (NEW WAY)
	const { notifications, loading: loadingNotifications, error } = useNotifications();

	const totalTransactions = useMemo(() => {
		return monthlyData[selectedMonth].reduce(
			(total, entry) => total + entry.transactions,
			0
		);
	}, [selectedMonth]);

	const openMapModal = (
		pickup,
		drop,
		farmerName,
		purpose,
		productType,
		weight,
		timestamp,
		id
	) => {
		setMapPoints({
			pickup,
			drop,
			farmerName,
			purpose,
			productType,
			weight,
			timestamp,
		});

		setReadRequests((prev) => {
			const updated = [...new Set([...prev, id])];
			localStorage.setItem("readRequests", JSON.stringify(updated));
			return updated;
		});
		setModalOpen(true);
	};

	return (
		<div className="min-h-screen flex flex-col items-center">
			<div className="h-[16.67vh] bg-[#1A4D2E] w-full flex py-8 px-12 shadow-md">
				<h1 className="text-2xl font-semibold text-white">Dashboard</h1>
				<NotificationButton
					notifications={notifications}
					loading={loadingNotifications}
					error={error}
				/>
			</div>
			<div className="relative w-full max-w-8xl mt-[-50px] flex flex-col md:flex-row gap-6 px-6 pt-6 h-[calc(100vh-150px)]">
				<div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4  h-full overflow-y-auto ">
					<h2 className="text-xl font-bold text-[#1A4D2E] mb-4">
						Delivery Requests
					</h2>
					<div className="space-y-4 overflow-y-auto max-h-100 auto-hide-scrollbar">
						{loadingRequests ? (
							<p className="text-gray-400">Loading requests...</p>
						) : requests.length === 0 ? (
							<p className="text-gray-500">No pending delivery requests.</p>
						) : (
							requests.map((req) => {
								const formattedTime = req.timestamp?.toDate
									? req.timestamp.toDate().toLocaleString("en-US", {
										month: "short",
										day: "numeric",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
										hour12: true,
									})
									: "N/A";

								return (
									<div
										key={req.id}
										className={`p-4 rounded-lg shadow flex justify-between items-start ${readRequests.includes(req.id)
											? "bg-[#F5EFE6]"
											: "bg-[#DAC5C5]"
											}`}
									>
										<div>
											<p className="text-lg text-[#1A4D2E]">
												<span className="font-bold">{req.farmerName}</span>
											</p>
											<h4 className="text-md font-semibold text-gray-800">
												{req.vehicleName}
											</h4>
											<h4 className="text-md font-semibold text-gray-800">
												{formattedTime}
											</h4>
										</div>
										<div className="flex flex-col items-end justify-between gap-2">
											<button
												className="text-blue-600 text-sm underline"
												onClick={() =>
													openMapModal(
														req.pickupLocation,
														req.destinationLocation,
														req.farmerName,
														req.purpose,
														req.productType,
														req.weight,
														req.timestamp,
														req.id
													)
												}
											>
												Details
											</button>
											<button
												className="mt-2 px-4 py-1 bg-[#1A4D2E] text-white text-sm rounded-lg"
												onClick={() => {
													setSelectedRequest(req);
													setAssignModalOpen(true);
												}}
											>
												Accept
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Transactions */}
				<MonthlyTransactionsCard
					selectedMonth={selectedMonth}
					setSelectedMonth={setSelectedMonth}
					monthlyData={monthlyData}
				/>
			</div>

			{/* Accept Request Modal */}
			<AcceptRequestModal
				isOpen={assignModalOpen}
				onClose={() => setAssignModalOpen(false)}
				onAssign={(hauler) => setAssignModalOpen(false)}
				req={selectedRequest}
				setRequests={setRequests}
			/>

			{/* Map Modal */}
			<MapModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				pickup={mapPoints.pickup}
				drop={mapPoints.drop}
				farmerName={mapPoints.farmerName}
				purpose={mapPoints.purpose}
				productType={mapPoints.productType}
				weight={mapPoints.weight}
				timestamp={mapPoints.timestamp}
			/>

			{/* ✅ Ad Modal */}
			<Modal
				isOpen={showAd}
				onRequestClose={() => {
					if (adClosable) setShowAd(false);
				}}
				className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50"
				overlayClassName="Overlay"
				shouldCloseOnOverlayClick={adClosable}
			>
				<div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md mx-auto">
					<h2 className="text-xl font-bold mb-4">🚀 Test Ad</h2>
					<p className="mb-4">
						This is a test ad displayed for non-subscribed users.
					</p>
					{adClosable ? (
						<button
							onClick={() => setShowAd(false)}
							className="bg-[#1A4D2E] text-white px-4 py-2 rounded-lg"
						>
							Close Ad
						</button>
					) : (
						<p className="text-sm text-gray-400">
							You can close this ad in {secondsLeft} seconds...
						</p>
					)}
				</div>
			</Modal>
		</div>
	);
}
