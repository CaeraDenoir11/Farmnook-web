import {useState, useEffect} from "react";
import {FaCcVisa, FaCcMastercard} from "react-icons/fa";

export default function BusinessSubscriptionPayment({onClose, onProceed}) {
	const [subscriptionPlan, setSubscriptionPlan] = useState("one-time");
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState("");

	const [billedTo, setBilledTo] = useState("");
	const [cardNumber, setCardNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvv, setCvv] = useState("");
	const [country, setCountry] = useState("Philippines");
	const [zipCode, setZipCode] = useState("");

	useEffect(() => {
		if (error) {
			if (billedTo || cardNumber || expiry || cvv || zipCode) {
			}
		}
	}, [billedTo, cardNumber, expiry, cvv, country, zipCode, error]);

	const handleInputChange = (setter) => (e) => {
		setter(e.target.value);
		if (error) setError("");
	};

	const handleProceedClick = async () => {
		setError("");
		if (!onProceed) {
			console.error("onProceed handler is not defined!");
			setError("Cannot proceed: Internal configuration error.");
			return;
		}

		if (
			!billedTo.trim() ||
			!cardNumber.replace(/\s/g, "") ||
			!expiry.trim() ||
			!cvv.trim() ||
			!country.trim() ||
			!zipCode.trim()
		) {
			setError("All fields are required. Please fill in all the details.");
			return;
		}

		const cleanCardNumber = cardNumber.replace(/\s/g, "");
		if (cleanCardNumber.length < 15 || cleanCardNumber.length > 19) {
			setError("Please enter a valid card number length (15-19 digits).");
			return;
		}
		if (!/^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/.test(expiry.trim())) {
			setError(
				"Please enter a valid expiry date in MM / YY format (e.g., 03 / 25)."
			);
			return;
		}
		if (!/^\d{3,4}$/.test(cvv.trim())) {
			setError("Please enter a valid CVV (3 or 4 digits).");
			return;
		}

		setIsProcessing(true);
		try {
			const paymentDetails = {
				billedTo: billedTo.trim(),
				cardLast4: cleanCardNumber.slice(-4),
				expiry: expiry.trim(),
				country: country.trim(),
				zipCode: zipCode.trim(),
				subscriptionType: subscriptionPlan,
			};
			await onProceed(paymentDetails);
			setShowSuccessModal(true);
		} catch (err) {
			console.error(
				"Subscription processing failed in payment form:",
				err.message
			);

			if (
				err.message.includes("User not logged in") ||
				err.message.includes("Already subscribed")
			) {
				setError(err.message); // These are already user-friendly
			} else {
				setError();
			}
		} finally {
			setIsProcessing(false);
		}
	};

	const handleCloseSuccessModalAndPanel = () => {
		setShowSuccessModal(false);
		if (onClose) {
			onClose();
		}
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-lg w-full h-full flex flex-col text-black text-left relative">
			<button
				className="absolute top-4 right-4 text-gray-500 text-2xl hover:text-gray-700 z-10 cursor-pointer"
				onClick={() => {
					setError("");
					onClose();
				}}
				disabled={isProcessing}
			>
				×
			</button>

			<h2 className="text-xl font-semibold mb-1">
				Upgrade to a Premium Account!
			</h2>
			<p className="text-sm text-gray-500 mb-4"></p>

			{/* Error Display Area */}
			{error && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
					{error}
				</div>
			)}

			<div className="flex-grow overflow-y-auto pr-2">
				{" "}
				{/* Added pr-2 for scrollbar spacing */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Billing Details */}
					<div>
						<label htmlFor="billedTo" className="block text-sm font-medium">
							Billed to
						</label>
						<input
							id="billedTo"
							type="text"
							placeholder="Full Name on Card"
							value={billedTo}
							onChange={handleInputChange(setBilledTo)}
							className="w-full mt-1 p-2 border rounded-md"
							disabled={isProcessing}
							required
						/>

						<label
							htmlFor="cardNumber"
							className="block text-sm font-medium mt-4"
						>
							Card Number
						</label>
						<div className="flex items-center space-x-2 border rounded-md p-2">
							<input
								id="cardNumber"
								type="text"
								placeholder="1234 5678 9012 3456"
								value={cardNumber}
								onChange={handleInputChange(setCardNumber)}
								className="w-full outline-none"
								disabled={isProcessing}
								required
								maxLength={23}
							/>
							<FaCcVisa className="text-blue-600 text-xl" />
							<FaCcMastercard className="text-red-600 text-xl" />
						</div>

						<div className="flex space-x-2 mt-2">
							<div className="w-1/2">
								<label htmlFor="expiry" className="block text-sm font-medium">
									Expiry
								</label>
								<input
									id="expiry"
									type="text"
									placeholder="MM / YY"
									value={expiry}
									onChange={handleInputChange(setExpiry)}
									className="w-full p-2 border rounded-md"
									disabled={isProcessing}
									required
									maxLength={7}
								/>
							</div>
							<div className="w-1/2">
								<label htmlFor="cvv" className="block text-sm font-medium">
									CVV
								</label>
								<input
									id="cvv"
									type="text"
									placeholder="123"
									value={cvv}
									onChange={handleInputChange(setCvv)}
									className="w-full p-2 border rounded-md"
									disabled={isProcessing}
									required
									maxLength={4}
								/>
							</div>
						</div>

						<label
							htmlFor="country"
							className="block text-sm font-medium mt-4 text-left"
						>
							Country
						</label>
						<div className="relative">
							<select
								id="country"
								value={country}
								onChange={handleInputChange(setCountry)}
								className="w-full p-2 border rounded-md appearance-none bg-white cursor-pointer"
								disabled={isProcessing}
								required
							>
								<option value="Philippines">Philippines</option>
								<option value="United States">United States</option>
								<option value="Canada">Canada</option>
								{/* Add other countries as needed */}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
								<svg
									className="fill-current h-4 w-4"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
								>
									<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
								</svg>
							</div>
						</div>

						<label
							htmlFor="zipCode"
							className="block text-sm font-medium mt-2 text-left"
						>
							Zip Code
						</label>
						<input
							id="zipCode"
							type="text"
							placeholder="Zip Code"
							value={zipCode}
							onChange={handleInputChange(setZipCode)}
							className="w-full p-2 border rounded-md"
							disabled={isProcessing}
							required
							maxLength={4}
						/>
					</div>
					{/* Subscription Type */}
					<div className="flex flex-col">
						<label className="block text-sm font-medium">
							Subscription Type
						</label>
						<div className="border p-4 rounded-md mt-1 flex-grow flex flex-col justify-center">
							<label
								className={`flex items-center space-x-3 border p-2 rounded-md cursor-pointer hover:bg-blue-50 mb-2 ${
									subscriptionPlan === "one-time" ? "bg-blue-100" : "bg-gray-50"
								}`}
							>
								<input
									type="radio"
									name="subscriptionPlan"
									value="one-time"
									checked={subscriptionPlan === "one-time"}
									onChange={() => {
										setSubscriptionPlan("one-time");
										if (error) setError("");
									}}
									className="form-radio"
									disabled={isProcessing}
								/>
								<div>
									<p className="font-medium">Premium Version (One-time ₱349)</p>
									<p className="text-sm text-gray-500">
										✔ Additional Vehicle Add-On
									</p>
									<p className="text-sm text-gray-500">✔ Go Ads Free</p>
								</div>
							</label>
						</div>
					</div>
				</div>
			</div>

			{/* Actions and Summary at the bottom */}
			<div className="mt-auto pt-4">
				<p className="text-xs text-gray-500 mt-2">
					By continuing you agree to our{" "}
					<a href="#" className="text-blue-500 hover:underline">
						terms and conditions
					</a>
					.
				</p>
				<button
					onClick={handleProceedClick}
					disabled={isProcessing}
					className={`w-full text-white py-3 rounded-md mt-3 font-semibold transition-colors ${
						isProcessing
							? "bg-indigo-400 cursor-not-allowed"
							: "bg-[#1A4D2E] cursor-pointer hover:bg-gray-500"
					}`}
				>
					{isProcessing ? "Processing..." : "Subscribe"}
				</button>
			</div>

			{/* Success Modal */}
			{showSuccessModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-sm z-50">
					<div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
						<div className="text-green-600 text-4xl mb-2">✔</div>
						<h2 className="text-xl font-semibold">Success</h2>
						<p className="text-sm text-gray-500 mt-1">
							Your subscription has been successfully submitted.
						</p>
						<button
							onClick={handleCloseSuccessModalAndPanel}
							className="mt-4 text-white py-2 px-6 rounded-md bg-[#1A4D2E] cursor-pointer hover:bg-gray-500"
						>
							Ok
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
