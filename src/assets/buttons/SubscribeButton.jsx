import {useState, useEffect} from "react";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {db} from "/configs/firebase";
import {
	collection,
	query,
	where,
	getDocs,
	addDoc,
	updateDoc,
	doc,
	serverTimestamp,
} from "firebase/firestore";
import BusinessSubscriptionPayment from "../../business-components/Business-Subscription-Payment";

export default function SubscribeButton() {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);

	const auth = getAuth();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setCurrentUser(user);
			setLoadingUser(false);
		});
		return () => unsubscribe();
	}, [auth]);

	useEffect(() => {
		const checkSubscription = async () => {
			if (!currentUser) {
				setIsSubscribed(false);
				return;
			}

			try {
				const subscriptionsRef = collection(db, "subscriptions");
				const q = query(
					subscriptionsRef,
					where("businessId", "==", currentUser.uid)
				);
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					setIsSubscribed(true);
				} else {
					setIsSubscribed(false);
				}
			} catch (error) {
				console.error("Error checking subscription:", error);
				setIsSubscribed(false);
			}
		};

		if (!loadingUser) {
			checkSubscription();
		}
	}, [currentUser, loadingUser]);

	const handleActualSubscription = async (paymentDetails) => {
		if (!currentUser) {
			throw new Error("User not logged in");
		}
		if (isSubscribed) {
			throw new Error("Already subscribed");
		}

		try {
			const subscriptionsRef = collection(db, "subscriptions");
			const subscriptionData = {
				businessId: currentUser.uid,
				dateTimeAvailment: serverTimestamp(),
				billingInfo: {
					billedTo: paymentDetails.billedTo,
					cardLast4: paymentDetails.cardLast4,
					expiry: paymentDetails.expiry,
					country: paymentDetails.country,
					zipCode: paymentDetails.zipCode,
				},
				subscriptionType: paymentDetails.subscriptionType,
				status: "active",
			};

			const subscriptionRef = await addDoc(subscriptionsRef, subscriptionData);

			await updateDoc(doc(db, "subscriptions", subscriptionRef.id), {
				subscriptionId: subscriptionRef.id,
			});

			setIsSubscribed(true);
			console.log(
				"Subscription Activated! Firestore updated with payment details."
			);
		} catch (error) {
			console.error("Error saving subscription:", error);
			alert("Failed to activate subscription. Please try again.");
			throw error;
		}
	};

	const openPaymentModal = () => {
		if (loadingUser) {
			alert("Authentication status is loading, please wait a moment.");
			return;
		}
		if (!currentUser) {
			alert("Please log in to subscribe!");
			return;
		}
		if (isSubscribed) {
			alert("You are already subscribed.");
			return;
		}
		setShowPaymentModal(true);
	};

	const closePaymentModal = () => {
		setShowPaymentModal(false);
	};

	if (loadingUser) {
		return (
			<button
				className="w-full font-semibold py-2 mt-6 rounded-lg shadow-md bg-gray-300 text-white cursor-wait"
				disabled
			>
				Loading...
			</button>
		);
	}

	return (
		<>
			<button
				className={`w-full font-semibold py-2 mt-6 rounded-lg shadow-md transition-all duration-300 ${
					isSubscribed || !currentUser
						? "bg-gray-400 text-white cursor-not-allowed"
						: "bg-white text-[#a63f3a] hover:bg-gray-200 cursor-pointer"
				}`}
				onClick={openPaymentModal}
				disabled={isSubscribed || !currentUser}
			>
				{isSubscribed
					? "SUBSCRIBED"
					: !currentUser
					? "LOGIN TO SUBSCRIBE"
					: "SUBSCRIBE"}
			</button>

			{showPaymentModal && currentUser && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-40 p-4">
					{/* Container for the payment modal content */}
					<div
						className="relative bg-transparent rounded-lg w-full max-w-2xl md:max-w-3xl lg:max-w-4xl"
						style={{maxHeight: "90vh"}}
					>
						<BusinessSubscriptionPayment
							onClose={closePaymentModal}
							onProceed={handleActualSubscription} // Passes the payment details
						/>
					</div>
				</div>
			)}
		</>
	);
}
