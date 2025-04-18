import {useState, useEffect, useMemo} from "react";
import {motion} from "framer-motion";
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
import {auth, db} from "../../configs/firebase";
import {onAuthStateChanged, GoogleAuthProvider} from "firebase/auth"; // ✅ Fixed here
import MapModal from "../map/MapModal.jsx";
import Maps from "./Maps";
import Modal from "react-modal";
import NotificationButton from "../assets/buttons/NotificationButton.jsx";
import AcceptRequestModal from "../assets/buttons/AcceptRequestModal.jsx";

const monthlyData = {
	January: [
		{week: "Week 1", transactions: 10},
		{week: "Week 2", transactions: 15},
		{week: "Week 3", transactions: 20},
		{week: "Week 4", transactions: 25},
	],
	February: [
		{week: "Week 1", transactions: 12},
		{week: "Week 2", transactions: 18},
		{week: "Week 3", transactions: 24},
		{week: "Week 4", transactions: 30},
	],
	March: [
		{week: "Week 1", transactions: 20},
		{week: "Week 2", transactions: 25},
		{week: "Week 3", transactions: 30},
		{week: "Week 4", transactions: 35},
	],
};

export default function BusinessDashboard() {
	const [selectedMonth, setSelectedMonth] = useState("March");
	const [requests, setRequests] = useState([]);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [loadingRequests, setLoadingRequests] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [mapPoints, setMapPoints] = useState({pickup: "", drop: ""});
	const [assignModalOpen, setAssignModalOpen] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [loadingNotifications, setLoadingNotifications] = useState(true);
	const [error, setError] = useState(null);
	const [readRequests, setReadRequests] = useState(() => {
		const saved = localStorage.getItem("readRequests");
		return saved ? JSON.parse(saved) : [];
	});

	// ✅ Ad modal state
	const [showAd, setShowAd] = useState(false);
	const [adClosable, setAdClosable] = useState(false);

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

	// === Real-time Fetch Pending Delivery Requests ===
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
			if (!user) {
				setRequests([]);
				setLoadingRequests(false);
				return;
			}

			const q = query(
				collection(db, "deliveryRequests"),
				where("businessId", "==", user.uid),
				where("isAccepted", "==", false)
			);

			const unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
				const enrichedRequests = await Promise.all(
					snapshot.docs.map(async (docSnap) => {
						const data = docSnap.data();

						// vehicleName
						let vehicleName = "Unknown";
						try {
							const vehicleRef = doc(db, "vehicles", data.vehicleId);
							const vehicleDoc = await getDoc(vehicleRef);
							if (vehicleDoc.exists()) {
								vehicleName = vehicleDoc.data().model || "Unknown";
							}
						} catch (err) {
							console.error("Error fetching vehicle:", err);
						}

						// farmerName
						let farmerName = "Unknown Farmer";
						try {
							const farmerRef = doc(db, "users", data.farmerId);
							const farmerDoc = await getDoc(farmerRef);
							if (farmerDoc.exists()) {
								const farmerData = farmerDoc.data();
								farmerName = `${farmerData.firstName} ${farmerData.lastName}`;
							}
						} catch (err) {
							console.error("Error fetching farmer:", err);
						}

						return {
							...data,
							id: docSnap.id,
							vehicleName,
							farmerName,
						};
					})
				);

				// ✅ SORT BY TIMESTAMP DESCENDING
				enrichedRequests.sort((a, b) => {
					const aTime = a.timestamp?.toDate?.() || 0;
					const bTime = b.timestamp?.toDate?.() || 0;
					return bTime - aTime;
				});

				setRequests(enrichedRequests);
				setLoadingRequests(false);
			});

			return () => unsubscribeSnapshot();
		});

		return () => unsubscribeAuth();
	}, []);

	// Realtime Notifications (NEW WAY)
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
			if (!user) {
				setNotifications([]);
				setLoadingNotifications(false);
				return;
			}

			const q = query(
				collection(db, "notifications"),
				where("businessId", "==", user.uid)
			);

			const unsubscribeSnapshot = onSnapshot(
				q,
				(snapshot) => {
					const loadedNotifications = snapshot.docs.map((doc) => {
						const data = doc.data();
						const dateObj = data.timestamp?.toDate();

						const formattedDate = dateObj
							? dateObj.toLocaleDateString("en-US", {
									month: "2-digit",
									day: "2-digit",
									year: "2-digit",
							  })
							: "N/A";

						const formattedTime = dateObj
							? dateObj.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
							  })
							: "N/A";
						return {
							id: doc.id,
							...data,
							date: formattedDate,
							time: formattedTime,
						};
					});
					setNotifications(loadedNotifications);
					setLoadingNotifications(false);
				},
				(err) => {
					console.error("Error fetching notifications:", err);
					setError("Failed to load notifications");
					setLoadingNotifications(false);
				}
			);

			return () => unsubscribeSnapshot();
		});

		return () => unsubscribeAuth();
	}, []);

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
			<div className="relative w-full max-w-8xl mt-[-50px] flex flex-col md:flex-row gap-6 px-6 pt-6">
				<div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/4">
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
										className={`p-4 rounded-lg shadow flex justify-between items-start ${
											readRequests.includes(req.id)
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
				<div className="bg-white p-6 rounded-2xl shadow-lg w-full md:w-3/8">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-bold text-[#1A4D2E]">
							Monthly Transactions
						</h2>
						<select
							className="p-2 border rounded-lg bg-[#FCFFE0] text-[#1A4D2E]"
							value={selectedMonth}
							onChange={(e) => setSelectedMonth(e.target.value)}
						>
							{Object.keys(monthlyData).map((month) => (
								<option key={month} value={month}>
									{month}
								</option>
							))}
						</select>
					</div>
					<motion.p
						className="text-lg font-semibold text-[#1A4D2E] mb-2 text-center"
						initial={{opacity: 0}}
						animate={{opacity: 1}}
						transition={{duration: 1}}
					>
						Total Transactions: {totalTransactions}
					</motion.p>
					<div className="w-full h-72 bg-gray-100 p-4 rounded-lg">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={monthlyData[selectedMonth]}
								margin={{top: 20, right: 30, left: 0, bottom: 10}}
							>
								<defs>
									<linearGradient
										id="colorTransactions"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.9} />
										<stop offset="95%" stopColor="#F5EFE6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									strokeOpacity={0.2}
									stroke="#1A4D2E"
								/>
								<XAxis dataKey="week" tick={{fill: "#1A4D2E"}} />
								<YAxis tick={{fill: "#1A4D2E"}} />
								<Tooltip cursor={{fill: "rgba(26, 77, 46, 0.1)"}} />
								<Area
									type="monotone"
									dataKey="transactions"
									stroke="#1A4D2E"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorTransactions)"
									activeDot={{r: 6, fill: "#1A4D2E"}}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
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
							You can close this ad in 5 seconds...
						</p>
					)}
				</div>
			</Modal>
		</div>
	);
}
