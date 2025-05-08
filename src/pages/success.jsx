// src/pages/success.jsx

import { useEffect } from "react";
import { useRouter } from "next/router";

const SuccessPage = () => {
  const router = useRouter();

  useEffect(() => {
    const handleSuccessRedirect = async () => {
      const { session_id } = router.query;

      if (!session_id) return;

      try {
        const res = await fetch("/api/checkout-session-completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session_id }),
        });

        const data = await res.json();
        if (data.success) {
          // Redirect to a profile or dashboard page after successful subscription
          router.push("/profile");
        } else {
          alert("Payment failed or session incomplete.");
        }
      } catch (error) {
        console.error("Error processing session:", error);
        alert("There was an error completing your payment. Please try again.");
      }
    };

    handleSuccessRedirect();
  }, [router]);

  return (
    <div>
      <h1>Thank you for your payment!</h1>
      <p>Your subscription is now active.</p>
    </div>
  );
};

export default SuccessPage;
