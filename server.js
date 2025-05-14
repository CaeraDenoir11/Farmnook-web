// server.js
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import "dotenv/config"; // Ensures .env variables are loaded

import admin from "firebase-admin";

// ---- ES Module way to load JSON ----
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import path, {dirname} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// ---- End ES Module way to load JSON ----

// --- Firebase Admin Setup ---
try {
	if (!admin.apps.length) {
		// Initialize only if not already initialized
		// OPTION 1: Using a service account key file (RECOMMENDED FOR LOCAL DEV)
		// IMPORTANT:
		// 1. Your serviceAccountKey.json is in the project root as shown in your screenshot.
		// 2. Ensure "serviceAccountKey.json" IS IN YOUR .gitignore FILE !!!

		// Construct the path to the service account key file
		const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
		// Read and parse the JSON file
		const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

		admin.initializeApp({
			credential: admin.credential.cert(serviceAccount),
			// Optionally, you can specify the databaseURL if you have multiple databases
			// or if it's not correctly inferred from the service account.
			// databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
		});
		console.log(
			"EXPRESS_SERVER: Firebase Admin SDK initialized with service account key."
		);
	} else {
		console.log("EXPRESS_SERVER: Firebase Admin SDK already initialized.");
	}
} catch (error) {
	console.error(
		"EXPRESS_SERVER_ERROR: Failed to initialize Firebase Admin SDK:",
		error
	);
	console.error(
		"Ensure your serviceAccountKey.json is in the project root (or the path is correct) " +
			"and valid, OR that GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set."
	);
	process.exit(1); // Critical error, exit
}

const db = admin.firestore(); // Get Firestore instance from Admin SDK
// --- End Firebase Admin Setup ---

// ... (rest of your server.js code remains the same)
const app = express();
const port = process.env.PORT || 4242;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
	console.error(
		"FATAL_ERROR: STRIPE_SECRET_KEY is not set. Please check your .env file."
	);
	process.exit(1);
}
const stripe = new Stripe(stripeSecretKey);

app.use(
	cors({
		origin: process.env.VITE_APP_FRONTEND_URL || "http://localhost:5173",
	})
);
app.use(express.json());

// Create Stripe Checkout Session
app.post("/api/create-checkout-session", async (req, res) => {
	console.log("EXPRESS_API /api/create-checkout-session: Received request.");
	const {businessId} = req.body;

	if (!businessId) {
		console.error(
			"EXPRESS_API /api/create-checkout-session: Missing businessId."
		);
		return res.status(400).json({error: "Business ID is required"});
	}

	const frontendBaseUrl =
		process.env.VITE_APP_FRONTEND_URL || "http://localhost:5173";

	try {
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			mode: "payment",
			line_items: [
				{
					price_data: {
						currency: "php",
						product_data: {
							name: "One-time Subscription",
						},
						unit_amount: 150000, // 1500 php
					},
					quantity: 1,
				},
			],
			success_url: `${frontendBaseUrl}/profile?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${frontendBaseUrl}/subscribe`,
			client_reference_id: businessId,
		});
		console.log(
			"EXPRESS_API /api/create-checkout-session: Stripe session created:",
			session.id
		);
		res.json({id: session.id});
	} catch (error) {
		console.error(
			"EXPRESS_API /api/create-checkout-session Stripe Error:",
			error.message
		);
		res
			.status(500)
			.json({error: "Failed to create Stripe session", details: error.message});
	}
});

// Handle Stripe Checkout Session Completion and Write to DB
app.post("/api/checkout-session-completion", async (req, res) => {
	console.log(
		"EXPRESS_API /api/checkout-session-completion: Received request."
	);
	const {sessionId, businessId: clientBusinessId} = req.body;

	if (!sessionId) {
		console.error(
			"EXPRESS_API /api/checkout-session-completion: Missing sessionId."
		);
		return res
			.status(400)
			.json({success: false, error: "Session ID is required"});
	}
	if (!clientBusinessId) {
		console.error(
			"EXPRESS_API /api/checkout-session-completion: Missing clientBusinessId for verification."
		);
		return res.status(400).json({
			success: false,
			error: "Client Business ID is required for verification",
		});
	}

	try {
		console.log(
			`EXPRESS_API /api/checkout-session-completion: Retrieving session '${sessionId}'`
		);
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: [
				"line_items",
				"payment_intent.payment_method",
				"customer_details", // Ensure customer_details is expanded
			],
		});
		console.log(
			"EXPRESS_API /api/checkout-session-completion: Stripe session status:",
			session.payment_status
		);

		const stripeBusinessId = session.client_reference_id;
		if (stripeBusinessId !== clientBusinessId) {
			console.error(
				`EXPRESS_API /api/checkout-session-completion: Business ID mismatch. Stripe: ${stripeBusinessId}, Client: ${clientBusinessId}`
			);
			return res.status(400).json({
				success: false,
				error: "Business ID mismatch. Potential tampering.",
			});
		}

		if (session.payment_status === "paid") {
			console.log(
				`EXPRESS_API /api/checkout-session-completion: Payment successful for businessId: ${stripeBusinessId}.`
			);

			const subscriptionRef = db
				.collection("subscriptions")
				.doc(stripeBusinessId);

			const subscriptionData = {
				businessId: stripeBusinessId,
				stripeSessionId: session.id,
				stripePaymentIntentId: session.payment_intent?.id || null,
				stripeCustomerId: session.customer || null,
				status: "active",
				dateTimeAvailment: admin.firestore.FieldValue.serverTimestamp(),
				lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
				amountPaid: session.amount_total / 100,
				currency: session.currency.toLowerCase(),
				productName:
					session.line_items?.data[0]?.description || "One-time Subscription",
				billingDetails: {
					name: session.customer_details?.name || null,
					email: session.customer_details?.email || null,
				},
				cardDetails: session.payment_intent?.payment_method?.card
					? {
							brand: session.payment_intent.payment_method.card.brand,
							last4: session.payment_intent.payment_method.card.last4,
							exp_month: session.payment_intent.payment_method.card.exp_month,
							exp_year: session.payment_intent.payment_method.card.exp_year,
					  }
					: null,
			};

			const loggableSubscriptionData = {
				...subscriptionData,
				dateTimeAvailment: "FieldValue.serverTimestamp()",
				lastPaymentDate: "FieldValue.serverTimestamp()",
			};
			console.log(
				"EXPRESS_API /api/checkout-session-completion: Writing to Firestore:",
				JSON.stringify(loggableSubscriptionData, null, 2)
			);

			await subscriptionRef.set(subscriptionData, {merge: true});
			console.log(
				`EXPRESS_API /api/checkout-session-completion: Firestore updated for businessId: ${stripeBusinessId}`
			);

			res.json({
				success: true,
				message: "Subscription activated and recorded.",
			});
		} else {
			console.warn(
				`EXPRESS_API /api/checkout-session-completion: Payment not successful for session ${sessionId}. Status: ${session.payment_status}`
			);
			res.status(400).json({
				success: false,
				error: `Payment not successful. Status: ${session.payment_status}`,
			});
		}
	} catch (error) {
		console.error(
			"EXPRESS_API /api/checkout-session-completion Stripe/DB Error:",
			error.message
		);
		if (error.stack) console.error(error.stack); // Log stack trace for better debugging
		res.status(500).json({
			success: false,
			error: "Failed to process session completion",
			details: error.message,
		});
	}
});

app.get("/api/test", (req, res) => {
	res.json({message: "Express API test endpoint is working!"});
});

app.listen(port, () => {
	console.log(`EXPRESS_SERVER: Server running at http://localhost:${port}`);
	console.log(
		`EXPRESS_SERVER: CORS enabled for origin: ${
			process.env.VITE_APP_FRONTEND_URL || "http://localhost:5173"
		}`
	);
	console.log(`EXPRESS_SERVER: Waiting for requests...`);
});
