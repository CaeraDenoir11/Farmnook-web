import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

export default async function handler(req, res) {
	if (req.method === "POST") {
		try {
			const {businessId} = req.body;

			if (!businessId) {
				return res.status(400).json({error: "Business ID is required."});
			}

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: [
					{
						price_data: {
							currency: "php",
							product_data: {
								name: `One-time Subscription`,
								description: `One-time Subscription for hauler business admin ${businessId}`,
							},
							unit_amount: 150000, // 1500 php
						},
						quantity: 1,
					},
				],
				mode: "payment",
				success_url: `${BASE_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${BASE_URL}/profile`,
				client_reference_id: businessId,
			});

			res.status(200).json({id: session.id});
		} catch (error) {
			console.error("Error creating Stripe session:", error);
			res.status(500).json({
				error: "Failed to create checkout session",
				details: error.message,
			});
		}
	} else {
		res.setHeader("Allow", "POST");
		res.status(405).json({error: "Method Not Allowed"});
	}
}
