import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your verified web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkIjofK6W9gr-CpuKfXftiLp_5abzYZPs",
  authDomain: "social-tracker-d3355.firebaseapp.com",
  projectId: "social-tracker-d3355",
  storageBucket: "social-tracker-d3355.firebasestorage.app",
  messagingSenderId: "493004497723",
  appId: "1:493004497723:web:476389a473e5046afd0d1e",
  measurementId: "G-Z4ZN1KBYJ1"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
export const db = getFirestore(app);