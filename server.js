// server.js
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import 'dotenv/config'; // Make sure .env is in the root FARMOOK-WEB/ or adjust path if needed

// --- Firebase Setup ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Load Firebase config from .env (ensure these are in your FARMOOK-WEB/.env file)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY, // Prefix with VITE_ if also used by frontend
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  // measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

let db;
try {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  console.log("EXPRESS_SERVER: Firebase initialized successfully.");
} catch (error) {
  console.error("EXPRESS_SERVER_ERROR: Failed to initialize Firebase:", error);
  // Decide if you want the server to stop or continue without Firebase
  // For now, it will continue, but DB operations will fail.
}
// --- End Firebase Setup ---


const app = express();
const port = process.env.PORT || 4242; // Use PORT from .env if available

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    console.error("FATAL_ERROR: STRIPE_SECRET_KEY is not set. Please check your .env file in the project root.");
    process.exit(1); // Exit if Stripe key is missing
}
const stripe = new Stripe(stripeSecretKey);

// Middleware
app.use(cors({
    origin: process.env.VITE_APP_FRONTEND_URL || 'http://localhost:5173' // Allow requests from your Vite frontend
}));
app.use(express.json()); // To parse JSON request bodies

// API ROUTES (prefixed with /api)

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  console.log("EXPRESS_API /api/create-checkout-session: Received request.");
  const { businessId } = req.body;

  if (!businessId) {
    console.error("EXPRESS_API /api/create-checkout-session: Missing businessId.");
    return res.status(400).json({ error: 'Business ID is required' });
  }

  const frontendBaseUrl = process.env.VITE_APP_FRONTEND_URL || 'http://localhost:5173';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Business Subscription',
            },
            unit_amount: 5000, // $50
          },
          quantity: 1,
        },
      ],
      // Success URL should point to your frontend, where handleSuccessRedirect runs
      success_url: `${frontendBaseUrl}/profile?session_id={CHECKOUT_SESSION_ID}`, // Or whatever your success page is
      cancel_url: `${frontendBaseUrl}/subscribe`, // Or your cancel page
      client_reference_id: businessId, // Pass businessId to retrieve later
      // metadata: { // Alternative way to pass data, client_reference_id is often better for this
      //   businessId,
      // },
    });
    console.log("EXPRESS_API /api/create-checkout-session: Stripe session created:", session.id);
    res.json({ id: session.id });
  } catch (error) {
    console.error('EXPRESS_API /api/create-checkout-session Stripe Error:', error.message);
    res.status(500).json({ error: 'Failed to create Stripe session', details: error.message });
  }
});

// Handle Stripe Checkout Session Completion and Write to DB
app.post('/api/checkout-session-completion', async (req, res) => {
  console.log("EXPRESS_API /api/checkout-session-completion: Received request.");
  const { sessionId, businessId: clientBusinessId } = req.body; // businessId sent from frontend for verification

  if (!sessionId) {
    console.error("EXPRESS_API /api/checkout-session-completion: Missing sessionId.");
    return res.status(400).json({ success: false, error: 'Session ID is required' });
  }
  if (!clientBusinessId) {
    console.error("EXPRESS_API /api/checkout-session-completion: Missing clientBusinessId for verification.");
    return res.status(400).json({ success: false, error: 'Client Business ID is required for verification' });
  }

  try {
    console.log(`EXPRESS_API /api/checkout-session-completion: Retrieving session '${sessionId}'`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'payment_intent.payment_method']
    });
    console.log("EXPRESS_API /api/checkout-session-completion: Stripe session status:", session.payment_status);

    const stripeBusinessId = session.client_reference_id;
    if (stripeBusinessId !== clientBusinessId) {
        console.error(`EXPRESS_API /api/checkout-session-completion: Business ID mismatch. Stripe: ${stripeBusinessId}, Client: ${clientBusinessId}`);
        return res.status(400).json({ success: false, error: "Business ID mismatch. Potential tampering." });
    }

    if (session.payment_status === 'paid') {
      console.log(`EXPRESS_API /api/checkout-session-completion: Payment successful for businessId: ${stripeBusinessId}.`);
      if (!db) {
        console.error("EXPRESS_API /api/checkout-session-completion ERROR: Firebase DB not initialized!");
        return res.status(500).json({ success: false, error: "Internal server error (DB connection)." });
      }

      const subscriptionRef = doc(db, "subscriptions", stripeBusinessId); // Use businessId as doc ID
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
          productName: session.line_items?.data[0]?.description || "Business Subscription",
          billingDetails: {
            name: session.customer_details?.name || null,
            email: session.customer_details?.email || null,
            // ... other details if needed
          },
          cardDetails: session.payment_intent?.payment_method?.card ? {
            brand: session.payment_intent.payment_method.card.brand,
            last4: session.payment_intent.payment_method.card.last4,
            exp_month: session.payment_intent.payment_method.card.exp_month,
            exp_year: session.payment_intent.payment_method.card.exp_year,
          } : null,
      };

      console.log("EXPRESS_API /api/checkout-session-completion: Writing to Firestore:", JSON.stringify(subscriptionData));
      await setDoc(subscriptionRef, subscriptionData, { merge: true });
      console.log(`EXPRESS_API /api/checkout-session-completion: Firestore updated for businessId: ${stripeBusinessId}`);
      
      res.json({ success: true, message: 'Subscription activated and recorded.' });
    } else {
      console.warn(`EXPRESS_API /api/checkout-session-completion: Payment not successful for session ${sessionId}. Status: ${session.payment_status}`);
      res.status(400).json({ success: false, error: `Payment not successful. Status: ${session.payment_status}` });
    }
  } catch (error) {
    console.error('EXPRESS_API /api/checkout-session-completion Stripe/DB Error:', error.message);
    if (error.stack) console.error(error.stack);
    res.status(500).json({ success: false, error: 'Failed to process session completion', details: error.message });
  }
});


// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Express API test endpoint is working!' });
});

// Start the server
app.listen(port, () => {
  console.log(`EXPRESS_SERVER: Server running at http://localhost:${port}`);
  console.log(`EXPRESS_SERVER: CORS enabled for origin: ${process.env.VITE_APP_FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`EXPRESS_SERVER: Waiting for requests...`);
});