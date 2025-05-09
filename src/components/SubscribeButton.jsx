import {useState, useEffect} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {loadStripe} from "@stripe/stripe-js";
import {db} from "../../configs/firebase.js";
import {collection, query, where, getDocs} from "firebase/firestore";

const stripePromise = loadStripe(
	"pk_test_51RMVxWP4B6nwn7GtUiFPkgFP6dhXQVIb0q4cRL6vRQUa1LpxZCh1F3hwSm4epLnsl6t2TDVfEamUKngOGUilN3U200CQNm0Hh2"
);

export default function SubscribeButton() {
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [processingPayment, setProcessingPayment] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();
	const auth = getAuth();

	useEffect(() => {
		console.log("SUBSCRIBE_BUTTON: Auth effect running.");
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			console.log(
				"SUBSCRIBE_BUTTON: Auth state changed. User:",
				user ? user.uid : null
			);
			setCurrentUser(user);
			setLoadingUser(false);
		});
		return () => {
			console.log("SUBSCRIBE_BUTTON: Unsubscribing from auth state changes.");
			unsubscribe();
		};
	}, [auth]);

	useEffect(() => {
		const checkSubscription = async () => {
			if (!currentUser) {
				console.log(
					"SUBSCRIBE_BUTTON_CHECK_SUB: No current user, setting isSubscribed to false."
				);
				setIsSubscribed(false);
				return;
			}
			console.log(
				"SUBSCRIBE_BUTTON_CHECK_SUB: Checking subscription for user:",
				currentUser.uid
			);
			try {
				if (!db) {
					console.error(
						"SUBSCRIBE_BUTTON_CHECK_SUB_ERROR: Firebase 'db' instance is NOT INITIALIZED! Check import path for checkSubscription."
					);
					setIsSubscribed(false);
					return;
				}
				const subscriptionsRef = collection(db, "subscriptions");
				const q = query(
					subscriptionsRef,
					where("businessId", "==", currentUser.uid),
					where("status", "==", "active")
				);
				const querySnapshot = await getDocs(q);

				if (!querySnapshot.empty) {
					console.log(
						"SUBSCRIBE_BUTTON_CHECK_SUB: Active subscription found for user:",
						currentUser.uid
					);
					setIsSubscribed(true);
				} else {
					console.log(
						"SUBSCRIBE_BUTTON_CHECK_SUB: No active subscription found for user:",
						currentUser.uid
					);
					setIsSubscribed(false);
				}
			} catch (error) {
				console.error(
					"SUBSCRIBE_BUTTON_CHECK_SUB_ERROR: Error checking subscription:",
					error
				);
				setIsSubscribed(false);
			}
		};

		if (!loadingUser && currentUser) {
			checkSubscription();
		} else if (!loadingUser && !currentUser) {
			console.log(
				"SUBSCRIBE_BUTTON_CHECK_SUB: User loaded but not logged in, setting isSubscribed to false."
			);
			setIsSubscribed(false);
		}
	}, [currentUser, loadingUser]);

	const createCheckoutSessionOnFrontend = async () => {
		if (!currentUser) {
			alert("Please log in to subscribe!");
			return;
		}
		if (isSubscribed) {
			alert("You are already subscribed.");
			return;
		}

		setProcessingPayment(true);
		console.log(
			"SUBSCRIBE_BUTTON_CREATE_CHECKOUT: Initiating payment for user:",
			currentUser.uid
		);
		try {
			console.log(
				"SUBSCRIBE_BUTTON_CREATE_CHECKOUT: Calling POST /api/create-checkout-session"
			);
			// --- FETCH CALL CORRECTED ---
			const res = await fetch("/api/create-checkout-session", {
				method: "POST", // Specify POST method
				headers: {
					"Content-Type": "application/json", // Tell server we're sending JSON
				},
				body: JSON.stringify({businessId: currentUser.uid}), // Send data as JSON string
			});
			// --- END OF CORRECTION ---

			console.log(
				"SUBSCRIBE_BUTTON_CREATE_CHECKOUT: Response status from /api/create-checkout-session:",
				res.status
			);
			const responseText = await res.text(); // Get raw text first to handle both JSON and HTML errors
			console.log(
				"SUBSCRIBE_BUTTON_CREATE_CHECKOUT: Raw response from /api/create-checkout-session:",
				responseText
			);

			let sessionData;
			try {
				sessionData = JSON.parse(responseText); // Try to parse as JSON
			} catch (e) {
				console.error(
					"SUBSCRIBE_BUTTON_CREATE_CHECKOUT_ERROR: Failed to parse session creation response as JSON. Raw text was:",
					responseText,
					"Error:",
					e
				);
				// If parsing fails AND response was not ok, it's likely an HTML error page from server
				if (!res.ok) {
					throw new Error(
						`Server responded with ${
							res.status
						} (Content might be HTML or non-JSON error). Response snippet: ${responseText.substring(
							0,
							200
						)}...`
					);
				}
				// If parsing fails but response was ok (e.g. 200 but empty or malformed JSON)
				throw new Error(
					"Invalid JSON response received from server when creating session, though status was OK."
				);
			}

			// Now check if the response status was actually OK (e.g., 200-299)
			if (!res.ok) {
				console.error(
					"SUBSCRIBE_BUTTON_CREATE_CHECKOUT_ERROR: Server responded with non-OK status:",
					res.status,
					"Parsed or raw response data:",
					sessionData || responseText
				);
				// Use error message from parsed JSON if available, otherwise indicate status code
				throw new Error(
					sessionData?.error ||
						sessionData?.details ||
						`Failed to create checkout session (status ${res.status})`
				);
			}

			// If response was OK, sessionData should have an 'id'
			if (!sessionData || !sessionData.id) {
				console.error(
					"SUBSCRIBE_BUTTON_CREATE_CHECKOUT_ERROR: Session ID missing in successful server response. Response:",
					sessionData
				);
				throw new Error("Session ID was not found in the server response.");
			}

			const {id: sessionId} = sessionData;
			console.log(
				"SUBSCRIBE_BUTTON_CREATE_CHECKOUT: Stripe session ID received:",
				sessionId,
				". Redirecting to Stripe."
			);
			const stripe = await stripePromise;
			const {error: stripeRedirectError} = await stripe.redirectToCheckout({
				sessionId,
			}); // Renamed 'error' to avoid conflict

			if (stripeRedirectError) {
				console.error(
					"SUBSCRIBE_BUTTON_CREATE_CHECKOUT_ERROR: Stripe redirectToCheckout error:",
					stripeRedirectError
				);
				throw new Error(stripeRedirectError.message);
			}
			// If redirectToCheckout is successful, the page will navigate away, so code below might not run.
		} catch (error) {
			// Catch errors from fetch, JSON parsing, or Stripe redirect
			console.error(
				"SUBSCRIBE_BUTTON_CREATE_CHECKOUT_ERROR: Full checkout process error:",
				error.message
			);
			alert(
				`Failed to start checkout: ${error.message}. Please try again or contact support.`
			);
		} finally {
			setProcessingPayment(false);
		}
	};

	useEffect(() => {
		const handleSuccessRedirect = async () => {
			const urlParams = new URLSearchParams(location.search);
			const sessionId = urlParams.get("session_id");

			if (!sessionId) {
				// console.log("SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: No session_id in URL.");
				return;
			}

			if (loadingUser || !currentUser) {
				console.log(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Waiting for user data (loadingUser or !currentUser). sessionId:",
					sessionId
				);
				return;
			}

			// A simple flag to try and prevent reprocessing.
			// For more robustness, consider storing processed session IDs in localStorage or a component state.
			if (isSubscribed && location.state?.processedSessionId === sessionId) {
				console.log(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Already processed this session or user is marked subscribed. SessionId:",
					sessionId
				);
				if (urlParams.has("session_id")) {
					navigate(location.pathname, {replace: true, state: {}}); // Clean URL and state
				}
				return;
			}

			console.log(
				"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Found session_id in URL:",
				sessionId,
				"for user:",
				currentUser.uid
			);
			setProcessingPayment(true);

			try {
				console.log(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Calling POST /api/checkout-session-completion with sessionId:",
					sessionId,
					"and businessId:",
					currentUser.uid
				);
				const res = await fetch("/api/checkout-session-completion", {
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({
						sessionId: sessionId,
						businessId: currentUser.uid,
					}),
				});

				console.log(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Response status from /api/checkout-session-completion:",
					res.status
				);
				const responseText = await res.text();
				console.log(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Raw response text from /api/checkout-session-completion:",
					responseText
				);

				let data;
				try {
					data = JSON.parse(responseText);
					console.log(
						"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Parsed JSON data from /api/checkout-session-completion:",
						data
					);
				} catch (parseError) {
					console.error(
						"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT_ERROR: Failed to parse response as JSON:",
						parseError,
						"Raw text:",
						responseText
					);
					if (!res.ok) {
						throw new Error(
							`Server error during completion (${
								res.status
							}). Response snippet: ${responseText.substring(0, 200)}`
						);
					}
					throw new Error(
						"Invalid JSON response from server during completion."
					);
				}

				if (res.ok && data.success) {
					console.log(
						"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT: Subscription successfully processed by backend.",
						data
					);
					setIsSubscribed(true);
					navigate("/profile", {
						replace: true,
						state: {processedSessionId: sessionId},
					});
				} else {
					console.error(
						"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT_ERROR: Backend reported failure or non-OK response.",
						{status: res.status, data}
					);
					navigate(location.pathname, {replace: true, state: {}}); // Clean URL and state
				}
			} catch (error) {
				console.error(
					"SUBSCRIBE_BUTTON_SUCCESS_REDIRECT_ERROR: Network or other error calling /api/checkout-session-completion:",
					error
				);
				navigate(location.pathname, {replace: true, state: {}}); // Clean URL and state
			} finally {
				setProcessingPayment(false);
			}
		};

		if (
			!loadingUser &&
			currentUser &&
			new URLSearchParams(location.search).has("session_id")
		) {
			handleSuccessRedirect();
		}
		// Added location.state to dependencies for the processedSessionId check, though it might cause re-runs if not careful.
		// Primary dependencies are for triggering the effect when user/session is ready.
	}, [
		loadingUser,
		currentUser,
		location.search,
		navigate,
		isSubscribed,
		location.state,
	]);

	if (loadingUser) {
		return (
			<button
				className="w-full font-semibold py-2 mt-6 rounded-lg shadow-md bg-gray-300 text-white cursor-wait"
				disabled
			>
				Loading User...
			</button>
		);
	}

	return (
		<>
			<button
				className={`w-full font-semibold py-2 mt-6 rounded-lg shadow-md transition-all duration-300 ${
					isSubscribed || !currentUser || processingPayment
						? "bg-gray-400 text-white cursor-not-allowed"
						: "bg-white text-[#a63f3a] hover:bg-gray-300 cursor-pointer"
				}`}
				onClick={createCheckoutSessionOnFrontend}
				disabled={isSubscribed || !currentUser || processingPayment}
			>
				{processingPayment
					? "PROCESSING..."
					: isSubscribed
					? "SUBSCRIBED"
					: !currentUser
					? "LOGIN TO SUBSCRIBE"
					: "SUBSCRIBE NOW"}
			</button>
		</>
	);
}
