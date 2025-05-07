import {useState, useEffect} from "react";
import "../index.css";
import {db} from "../../configs/firebase";
import {collection, getDocs, query, where} from "firebase/firestore";
import AddVehicleButton from "../assets/buttons/AddVehicleButton.jsx";
import DeleteVehicleButton from "../assets/buttons/DeleteVehicleButton.jsx";
import vehicleTypeList from "../data/Vehicle-Types-List.js";
import VehicleDetailsIcon from "../assets/icons/vehicle-details.svg";
import useVehicles from "../assets/hooks/useVehicles.js";
import {Truck} from "lucide-react";

export default function BusinessVehicles() {
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [vehiclesPerPage, setVehiclesPerPage] = useState(5);
	const [showVehicleDetails, setShowVehicleDetails] = useState(false);

	// Function to extract maximum weight from vehicle type string
	const getMaxWeight = (vehicleType) => {
		// Extract the weight range part (e.g., "1-200 kg")
		const weightMatch = vehicleType.match(/\((\d+)-(\d+)\s*kg\)/);
		if (!weightMatch) return 0;

		// Return the maximum weight (second number)
		return parseInt(weightMatch[2]);
	};

	// Enhanced sorting logic for vehicle types
	const sortedVehicleTypes = [...vehicleTypeList].sort((a, b) => {
		// First sort by max weight
		if (a.max !== b.max) {
			return a.max - b.max;
		}
		// If max weights are equal, sort by min weight
		return a.min - b.min;
	});

	// Group vehicle types by weight categories
	const weightCategories = {
		light: {min: 0, max: 1000, label: "Light Vehicles (up to 1,000 kg)"},
		medium: {min: 1001, max: 5000, label: "Medium Vehicles (1,001-5,000 kg)"},
		heavy: {min: 5001, max: 10000, label: "Heavy Vehicles (5,001-10,000 kg)"},
		extraHeavy: {
			min: 10001,
			max: Infinity,
			label: "Extra Heavy Vehicles (10,001+ kg)",
		},
	};

	// Categorize vehicles
	const categorizedVehicles = sortedVehicleTypes.reduce((acc, vehicle) => {
		const category =
			Object.entries(weightCategories).find(
				([_, range]) => vehicle.max >= range.min && vehicle.max <= range.max
			)?.[0] || "extraHeavy";

		if (!acc[category]) {
			acc[category] = {
				label: weightCategories[category].label,
				vehicles: [],
			};
		}
		acc[category].vehicles.push(vehicle);
		return acc;
	}, {});

	useEffect(() => {
		const updateVehiclesPerPage = () => {
			setVehiclesPerPage(window.innerWidth <= 640 ? 5 : 8);
		};
		updateVehiclesPerPage();
		window.addEventListener("resize", updateVehiclesPerPage);
		return () => window.removeEventListener("resize", updateVehiclesPerPage);
	}, []);

	const {vehicles, setVehicles, loading: isLoading} = useVehicles();

	const handleDeleteVehicle = (vehicleId) => {
		setVehicles((prevVehicles) =>
			prevVehicles.filter((vehicle) => vehicle.id !== vehicleId)
		);
	};

	const filteredVehicles = vehicles.filter((vehicle) =>
		`${vehicle.vehicleType} ${vehicle.model} ${vehicle.plateNumber}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase())
	);

	const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
	const currentVehicles = filteredVehicles.slice(
		(currentPage - 1) * vehiclesPerPage,
		currentPage * vehiclesPerPage
	);

	const handleAddVehicle = (newVehicle) => {
		setVehicles((prevVehicles) => [...prevVehicles, newVehicle]);
	};

	return (
		<div className="antialiased bg-white flex flex-col items-center min-h-screen">
			<div className="container mx-auto px-4 sm:px-8">
				<div className="py-8">
					<div className="flex items-center justify-between px-8 mb-4">
						<h1 className="text-2xl font-semibold text-[#1A4D2E]">
							Vehicles List
						</h1>
						<button
							onClick={() => setShowVehicleDetails(true)}
							className="flex items-center gap-2 px-4 py-2 text-[#1A4D2E] hover:bg-[#F5EFE6] rounded-lg transition-all duration-200 group"
							title="View Vehicle Types"
						>
							<img
								src={VehicleDetailsIcon}
								alt="Vehicle Details"
								className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
							/>
							<span className="text-sm font-medium cursor-pointer">
								Vehicle Types
							</span>
						</button>
					</div>

					{/* Search Bar */}
					<div className="my-4 flex items-center gap-4 w-full">
						<input
							type="text"
							placeholder="Search vehicles..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent transition-colors duration-200"
						/>
					</div>

					{/* Table */}
					<div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
						<div className="inline-block min-w-full shadow-lg rounded-lg overflow-hidden">
							<table className="min-w-full leading-normal">
								<thead>
									<tr className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold tracking-wider">
										<th className="px-10 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
											Vehicle Type
										</th>
										<th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
											Model
										</th>
										<th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
											Plate Number
										</th>
										<th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{currentVehicles.map((vehicle) => (
										<tr
											key={vehicle.id}
											className="bg-white hover:bg-[#F5EFE6]/50 transition-colors duration-200"
										>
											<td className="px-5 py-5 border-b border-[#1A4D2E]/10 flex items-center gap-4">
												<div className="rounded-full w-12 h-12 border-2 border-[#1A4D2E] flex items-center justify-center bg-[#F5EFE6]">
													<Truck className="w-6 h-6 text-[#1A4D2E]" />
												</div>
												<span className="font-medium text-[#1A4D2E]">
													{vehicle.vehicleType}
												</span>
											</td>
											<td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
												{vehicle.model}
											</td>
											<td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
												{vehicle.plateNumber}
											</td>
											<td className="px-5 py-5 border-b border-[#1A4D2E]/10">
												<div className="flex gap-4 items-center">
													<DeleteVehicleButton
														vehicleId={vehicle.id}
														onDelete={handleDeleteVehicle}
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>

							{/* Pagination Controls */}
							<div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between border-t border-[#1A4D2E]/10">
								<span className="text-xs xs:text-sm text-gray-900">
									Showing {(currentPage - 1) * vehiclesPerPage + 1} to{" "}
									{Math.min(
										currentPage * vehiclesPerPage,
										filteredVehicles.length
									)}{" "}
									of {filteredVehicles.length} Entries
								</span>
								<div className="inline-flex mt-2 xs:mt-0 ">
									<button
										onClick={() =>
											setCurrentPage((prev) => Math.max(prev - 1, 1))
										}
										disabled={currentPage === 1}
										className="text-sm font-semibold py-2 px-4 rounded-l bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										&lt;
									</button>
									<span className="px-4 py-2 text-sm font-semibold">
										Page {currentPage} of {totalPages}
									</span>
									<button
										onClick={() =>
											setCurrentPage((prev) => Math.min(prev + 1, totalPages))
										}
										disabled={currentPage === totalPages}
										className="text-sm font-semibold py-2 px-4 rounded-r bg-gray-100 hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										&gt;
									</button>
								</div>
							</div>
						</div>
					</div>
					<AddVehicleButton onAddVehicle={handleAddVehicle} />
				</div>
			</div>

			{/* Modal for Vehicle Details */}
			{showVehicleDetails && (
				<div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/20 z-50">
					<div className="bg-white px-8 py-6 rounded-xl shadow-2xl w-[90%] max-w-2xl h-auto relative flex flex-col">
						<div className="flex justify-between items-center mb-6">
							<div className="flex items-center gap-3">
								<Truck className="w-6 h-6 text-[#1A4D2E]" />
								<h2 className="text-xl font-semibold text-[#1A4D2E]">
									Available Vehicle Types
								</h2>
							</div>
							<button
								onClick={() => setShowVehicleDetails(false)}
								className="text-gray-500 hover:text-red-500 transition-colors duration-200 absolute top-4 right-4"
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
						</div>

						<div className="max-h-[60vh] overflow-y-auto pr-2">
							<ul className="space-y-3">
								{sortedVehicleTypes.map((type, index) => (
									<li
										key={index}
										className="bg-[#F5EFE6] p-4 rounded-lg border border-[#1A4D2E]/10 hover:border-[#1A4D2E]/30 transition-all duration-200"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center">
												<Truck className="w-5 h-5 text-[#1A4D2E]" />
											</div>
											<div>
												<span className="font-medium text-[#1A4D2E]">
													{type.name}
												</span>
												<div className="text-sm text-gray-600">
													{type.min.toLocaleString()} -{" "}
													{type.max.toLocaleString()} kg
												</div>
											</div>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
