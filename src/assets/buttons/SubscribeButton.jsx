import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "/configs/firebase";
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

export default function SubscribeButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(subscriptionsRef, where("businessId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setIsSubscribed(true); // User is already subscribed
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [user]);

  const handleSubscription = async () => {
    if (!user) {
      alert("User not logged in!");
      return;
    }

    if (isSubscribed) {
      return; // Prevents additional clicks
    }

    try {
      const subscriptionsRef = collection(db, "subscriptions");
      const subscriptionRef = await addDoc(subscriptionsRef, {
        businessId: user.uid,
        dateTimeAvailment: serverTimestamp(),
      });

      await updateDoc(doc(db, "subscriptions", subscriptionRef.id), {
        subscriptionId: subscriptionRef.id,
      });

      setIsSubscribed(true); // Update state to disable button
      alert("Subscription Activated!");
    } catch (error) {
      console.error("Error saving subscription:", error);
      alert("Failed to activate subscription. Try again.");
    }
  };

  return (
    <button
      className={`w-full font-semibold py-2 mt-6 rounded-lg shadow-md transition-all duration-300 ${
        isSubscribed
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-white text-[#a63f3a] hover:bg-gray-200"
      }`}
      onClick={handleSubscription}
      disabled={isSubscribed} // Prevents clicking when already subscribed
    >
      {isSubscribed ? "SUBSCRIBED" : "SUBSCRIBE"}
    </button>
  );
}