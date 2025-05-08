// src/api/checkout-session-completion.js
import Stripe from "stripe";
// IMPORTANT: Adjust path to your firebase.js config file
// If firebase.js is in src/configs/ and this file (checkout-session-completion.js) is in src/api/
import { db } from "../../configs/firebase.js"; // Or just `../configs/firebase` if .js is auto-resolved
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// !! CRITICAL !!: Use your ONE correct Stripe secret key. VERIFY IT.
const stripe = new Stripe("sk_test_51RMVxWP4B6nwn7Gt1Y0ThooxhpBNgawJ7Sa9Ic7KuNncHEg8V0LxhGSYFOZSmkhslSa4MNWZyDQ7XGw7WkONEyN500j1hLrNYb"); // REPLACE!

export default async function handler(req, res) {
  console.log("API_COMPLETE_SESSION: Request received. Method:", req.method);

  if (req.method === "POST") {
    console.log("API_COMPLETE_SESSION: Request body:", req.body); // Parsed by vite.config.js middleware
    const { sessionId, businessId: clientBusinessId } = req.body;

    if (!sessionId) {
      console.error("API_COMPLETE_SESSION_ERROR: Session ID is missing.");
      return res.status(400).json({ success: false, error: "Session ID is required." });
    }
    if (!clientBusinessId) {
      console.error("API_COMPLETE_SESSION_ERROR: Client Business ID is missing.");
      return res.status(400).json({ success: false, error: "Client Business ID is required." });
    }
    console.log(`API_COMPLETE_SESSION: Received sessionId: ${sessionId}, clientBusinessId: ${clientBusinessId}`);

    try {
      console.log(`API_COMPLETE_SESSION: Retrieving session '${sessionId}' from Stripe...`);
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'payment_intent.payment_method']
      });
      console.log("API_COMPLETE_SESSION: Stripe session retrieved. Payment Status:", session.payment_status);

      const stripeBusinessId = session.client_reference_id;
      console.log(`API_COMPLETE_SESSION: Stripe client_reference_id: ${stripeBusinessId}`);

      if (stripeBusinessId !== clientBusinessId) {
        console.error(`API_COMPLETE_SESSION_ERROR: Mismatch in businessId. Stripe: ${stripeBusinessId}, Client: ${clientBusinessId}`);
        return res.status(400).json({ success: false, error: "Business ID mismatch." });
      }

      if (session.payment_status === "paid") {
        console.log(`API_COMPLETE_SESSION: Payment successful for businessId: ${stripeBusinessId}. Preparing to write to Firestore.`);

        if (!db) {
            console.error("API_COMPLETE_SESSION_ERROR: Firebase 'db' instance is NOT INITIALIZED or undefined! Check import path for firebase.js in this file.");
            return res.status(500).json({ success: false, error: "Firestore database instance is not available." });
        }
        console.log("API_COMPLETE_SESSION: Firebase 'db' instance appears to be available.");

        const subscriptionRef = doc(db, "subscriptions", stripeBusinessId);
        console.log(`API_COMPLETE_SESSION: Firestore document reference created: subscriptions/${stripeBusinessId}`);

        const subscriptionData = {
          businessId: stripeBusinessId,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent?.id || null,
          stripeCustomerId: session.customer || null,
          status: "active",
          dateTimeAvailment: serverTimestamp(),
          lastPaymentDate: serverTimestamp(),
          amountPaid: session.amount_total / 100,
          currency: session.currency,
          productName: session.line_items?.data[0]?.description || "Subscription",
          billingDetails: { /* ... as before ... */ },
          cardDetails: { /* ... as before ... */ },
        };
        // Populate billingDetails and cardDetails as in the previous "full code" example
        subscriptionData.billingDetails = {
            name: session.customer_details?.name || null,
            email: session.customer_details?.email || null,
            phone: session.customer_details?.phone || null,
            address: session.customer_details?.address || null,
        };
        subscriptionData.cardDetails = session.payment_intent?.payment_method?.card ? {
            brand: session.payment_intent.payment_method.card.brand,
            last4: session.payment_intent.payment_method.card.last4,
            exp_month: session.payment_intent.payment_method.card.exp_month,
            exp_year: session.payment_intent.payment_method.card.exp_year,
        } : null;

        console.log("API_COMPLETE_SESSION: Subscription data to be written:", JSON.stringify(subscriptionData, null, 2));

        console.log("API_COMPLETE_SESSION: Attempting setDoc to Firestore...");
        await setDoc(subscriptionRef, subscriptionData, { merge: true });
        console.log(`API_COMPLETE_SESSION: Firestore setDoc successful for subscriptions/${stripeBusinessId}`);

        return res.status(200).json({
          success: true,
          message: "Subscription activated and recorded.",
          subscriptionId: stripeBusinessId, // Or however you identify it
        });

      } else {
        console.warn(`API_COMPLETE_SESSION_WARN: Payment status for session ${sessionId} is not 'paid'. Status: ${session.payment_status}`);
        return res.status(400).json({ success: false, error: `Payment not successful. Status: ${session.payment_status}` });
      }
    } catch (error) {
      console.error(`API_COMPLETE_SESSION_ERROR: Error processing session ${sessionId}:`, error);
      if (error.stack) console.error("API_COMPLETE_SESSION_ERROR_STACK:", error.stack);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return res.status(500).json({ success: false, error: "Failed to complete checkout session", details: errorMessage });
    }
  } else {
    console.log(`API_COMPLETE_SESSION: Method ${req.method} not allowed.`);
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}