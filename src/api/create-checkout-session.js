// src/api/create-checkout-session.js

import Stripe from "stripe";

// !! CRITICAL !!: Use your ONE correct Stripe secret key.
// This key was taken from your original create-checkout-session.js. VERIFY IT.
const stripe = new Stripe("sk_test_51RMVxWP4B6nwn7Gt1Y0ThooxhpBNgawJ7Sa9Ic7KuNncHEg8V0LxhGSYFOZSmkhslSa4MNWZyDQ7XGw7WkONEyN500j1hLrNYb");

// Ensure this is correctly set in your .env file (e.g., VITE_BASE_URL=http://localhost:5173)
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000"; // Fallback for safety, but VITE_BASE_URL should be set

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({ error: "Business ID is required." });
      }

      // You might want to fetch product/price ID from Stripe or a config
      // instead of hardcoding price details here for more flexibility.
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Standard Subscription`, // Generic name
                description: `Monthly access for business ${businessId}`,
              },
              unit_amount: 5000, // Price in cents ($50.00)
            },
            quantity: 1,
          },
        ],
        mode: "payment", // For one-time payment. Change to "subscription" for recurring.
        success_url: `${BASE_URL}/profile?session_id={CHECKOUT_SESSION_ID}`, // Redirect to a page that can handle this. /profile is an example.
        cancel_url: `${BASE_URL}/subscribe- Kündigung`, // Or your subscription page
        client_reference_id: businessId, // Pass businessId to identify user post-payment
        // To collect billing address if needed:
        // billing_address_collection: 'required',
        // To prefill email if you have it:
        // customer_email: userEmail, // Get user's email if available
      });

      res.status(200).json({ id: session.id });
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      res.status(500).json({ error: "Failed to create checkout session", details: error.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
  }
}