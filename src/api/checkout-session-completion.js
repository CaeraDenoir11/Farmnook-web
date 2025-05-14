import Stripe from "stripe";
import admin from "firebase-admin";

// Stripe Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Firebase Admin SDK Initialization
if (!admin.apps.length) {
	admin.initializeApp();
}
const db = admin.firestore();

export default async function handler(req, res) {
	if (req.method === "POST") {
		const {sessionId} = req.body;

		if (!sessionId) {
			return res.status(400).json({error: "Session ID is required."});
		}

		try {
			const session = await stripe.checkout.sessions.retrieve(sessionId, {
				expand: ["line_items", "payment_intent", "customer"],
			});

			if (session.payment_status === "paid") {
				const businessId = session.client_reference_id;
				const paymentIntentId =
					typeof session.payment_intent === "string"
						? session.payment_intent
						: session.payment_intent?.id;
				const customerId =
					typeof session.customer === "string"
						? session.customer
						: session.customer?.id;

				if (!businessId) {
					return res
						.status(500)
						.json({error: "Business ID missing from session."});
				}

				const paymentData = {
					businessId: businessId,
					stripeSessionId: session.id,
					stripePaymentIntentId: paymentIntentId,
					stripeCustomerId: customerId,
					status: "active",
					dateTimeAvailment: admin.firestore.FieldValue.serverTimestamp(),
					lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
					amountPaid: session.amount_total / 100,
					currency: session.currency.toLowerCase(),
					productName:
						session.line_items?.data[0]?.description || "Subscription",
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

				await db
					.collection("subscriptions")
					.doc(businessId)
					.set(paymentData, {merge: true});

				res
					.status(200)
					.json({success: true, message: "Payment processed and data saved."});
			} else {
				res.status(200).json({
					success: false,
					message: `Payment not completed. Status: ${session.payment_status}`,
				});
			}
		} catch (error) {
			res.status(500).json({
				error: "Failed to process payment completion",
				details: error.message,
			});
		}
	} else {
		res.setHeader("Allow", "POST");
		res.status(405).json({error: "Method Not Allowed"});
	}
}
