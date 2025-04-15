// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyDF4Y-Bdtur8lS2Nk6sTTDq4UQYIonh0u0",
  authDomain: "farmnook-database-4e0e8.firebaseapp.com",
  projectId: "farmnook-database-4e0e8",
  storageBucket: "farmnook-database-4e0e8.firebasestorage.app",
  messagingSenderId: "517240344964",
  appId: "1:517240344964:web:7fe737c45691710dc80dd1",
  measurementId: "G-KLPF2Y5LNL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

export const storage = getStorage(app);
