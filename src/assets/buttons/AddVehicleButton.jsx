import {useState} from "react";
import {Plus} from "lucide-react";
import {db} from "../../../configs/firebase";
import {
	collection,
	addDoc,
	serverTimestamp,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
} from "firebase/firestore";
import vehicleTypeList from "../../data/Vehicle-Types-List.js";

function AddVehicleButton({onAddVehicle}) {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showLimitAlert, setShowLimitAlert] = useState(false);
	const [formData, setFormData] = useState({
		vehicleType: "",
		model: "",
		plateNumber: "",
	});

	const plateRegex =
		/^(?:[A-Z]{3} \d{4}|\d{3}[A-Z]{3}|[A-Z]\d{3}[A-Z]{2}|[A-Z]{2}\d{3}[A-Z])$/;

	const handleChange = (e) => {
		setFormData({...formData, [e.target.name]: e.target.value});
	};

	const checkVehicleLimit = async () => {
		const userId = localStorage.getItem("userId");
		if (!userId) return;

		// 🔍 Count current user's vehicles
		const vehicleQuery = query(
			collection(db, "vehicles"),
			where("businessId", "==", userId)
		);
		const vehicleSnapshot = await getDocs(vehicleQuery);
		const totalVehicles = vehicleSnapshot.size;

		// 🔍 Check subscription collection for matching businessId
		const subQuery = query(
			collection(db, "subscriptions"),
			where("businessId", "==", userId)
		);
		const subSnapshot = await getDocs(subQuery);
		const isSubscribed = !subSnapshot.empty;

		if (!isSubscribed && totalVehicles >= 2) {
			setShowLimitAlert(true);
		} else {
			setIsOpen(true);
		}
	};

	const handleSubmit = async () => {
		setError("");
		const {vehicleType, model, plateNumber} = formData;

		if (!vehicleType || !model || !plateNumber) {
			setError("All fields are required!");
			return;
		}

		if (!plateRegex.test(plateNumber)) {
			setError("Invalid plate number format!");
			return;
		}

		setLoading(true);
		try {
			const userId = localStorage.getItem("userId");
			if (!userId) {
				console.error("User ID not found.");
				return;
			}

			const plateQuery = query(
				collection(db, "vehicles"),
				where("plateNumber", "==", plateNumber.toUpperCase())
			);
			const existingSnapshot = await getDocs(plateQuery);

			if (!existingSnapshot.empty) {
				setError("This plate number already exists!");
				setLoading(false);
				return;
			}

			const newVehicle = {
				vehicleType: formData.vehicleType,
				model,
				plateNumber: plateNumber.toUpperCase(),
				businessId: userId,
				createdAt: serverTimestamp(),
			};

			const docRef = await addDoc(collection(db, "vehicles"), newVehicle);
			const savedVehicle = {id: docRef.id, ...newVehicle};
			onAddVehicle(savedVehicle);

			const vehicleQuery = query(
				collection(db, "vehicles"),
				where("businessId", "==", userId)
			);
			const vehicleSnapshot = await getDocs(vehicleQuery);
			const totalVehicles = vehicleSnapshot.size;

			const userDocRef = doc(db, "users", userId);
			await updateDoc(userDocRef, {totalVehicle: totalVehicles});

			setIsOpen(false);
			setFormData({vehicleType: "", model: "", plateNumber: ""});
		} catch (error) {
			console.error("Error adding vehicle:", error);
		} finally {
			setLoading(false);
		}
	};

	// Sort vehicle types by max weight, then by min weight
	const sortedVehicleTypes = [...vehicleTypeList].sort((a, b) => {
		if (a.max !== b.max) {
			return a.max - b.max;
		}
		return a.min - b.min;
	});

	return (
		<>
			{/* Floating Add Button */}
			<div className="group fixed bottom-6 right-6 flex justify-center items-center text-white text-sm font-bold">
				<button
					onClick={checkVehicleLimit}
					className="shadow-md flex items-center group-hover:gap-2 bg-[#1A4D2E] text-[#F5EFE6] p-4 rounded-full cursor-pointer duration-300 hover:scale-110 hover:shadow-2xl"
				>
					<Plus className="fill-[#F5EFE6]" size={20} />
					<span className="text-[0px] group-hover:text-sm duration-300">
						Add Vehicle
					</span>
				</button>
			</div>

			{/* Add Vehicle Modal */}
			{isOpen && (
				<div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
					<div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
						<button
							onClick={() => setIsOpen(false)}
							className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors duration-200 cursor-pointer"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>

						<h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
							Add Vehicle
						</h2>

						{error && (
							<p className="text-red-600 text-center mb-4 font-semibold bg-red-50 p-3 rounded-lg ">
								⚠️ {error}
							</p>
						)}

						<div className="space-y-4">
							<div className="relative">
								<label className="block text-sm font-medium text-[#1A4D2E] mb-1">
									Vehicle Type
								</label>
								<select
									name="vehicleType"
									value={formData.vehicleType}
									onChange={handleChange}
									className="w-full p-3 border border-[#1A4D2E]/20 rounded-lg focus:ring-2 focus:ring-[#1A4D2E] focus:border-[#1A4D2E] outline-none bg-white cursor-pointer"
								>
									<option value="">Select Vehicle Type</option>
									{sortedVehicleTypes.map((type) => (
										<option key={type.name} value={type.name}>
											{type.name} ({type.min.toLocaleString()} -{" "}
											{type.max.toLocaleString()} kg)
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-[#1A4D2E] mb-1">
									Vehicle Model
								</label>
								<input
									type="text"
									name="model"
									placeholder="Enter vehicle model"
									value={formData.model}
									onChange={handleChange}
									className="w-full p-3 border border-[#1A4D2E]/20 rounded-lg focus:ring-2 focus:ring-[#1A4D2E] focus:border-[#1A4D2E] outline-none bg-white"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-[#1A4D2E] mb-1">
									Plate Number
								</label>
								<input
									type="text"
									name="plateNumber"
									placeholder="e.g., NBC 1234"
									value={formData.plateNumber}
									onChange={handleChange}
									className="w-full p-3 border border-[#1A4D2E]/20 rounded-lg focus:ring-2 focus:ring-[#1A4D2E] focus:border-[#1A4D2E] outline-none bg-white"
								/>
								<p className="text-xs text-gray-500 mt-1">
									Valid formats: ABC 1234, 123 ABC, A123 BC, AB123 C
								</p>
							</div>
						</div>

						<div className="flex justify-end mt-6 space-x-4">
							<button
								onClick={() => setIsOpen(false)}
								className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all cursor-pointer"
								disabled={loading}
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={loading}
								className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all flex items-center gap-2 cursor-pointer"
							>
								{loading ? (
									<>
										<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
												fill="none"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="cursor-pointerM4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Saving...
									</>
								) : (
									"Save"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Vehicle Limit Alert Modal */}
			{showLimitAlert && (
				<div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
					<div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
						<div className="text-center">
							<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
								<svg
									className="h-6 w-6 text-red-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-bold text-red-600 mb-2">
								Limit Reached
							</h3>
							<p className="text-gray-700 mb-4">
								You can only add up to 2 vehicles without a subscription.
							</p>
							<p className="text-gray-700 mb-6">
								Please subscribe to add more vehicles.
							</p>
							<button
								onClick={() => setShowLimitAlert(false)}
								className="bg-[#1A4D2E] text-white px-6 py-2 rounded-lg hover:bg-[#145C38] transition-all cursor-pointer"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default AddVehicleButton;
