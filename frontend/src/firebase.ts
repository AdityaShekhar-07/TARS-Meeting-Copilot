import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace this entire object with your actual Firebase config keys!
const firebaseConfig = {
  apiKey: "AIzaSyCG989-BAOgb_th8NVpl5NpCYzwFFSyG6Q",
  authDomain: "tars-copilot.firebaseapp.com",
  projectId: "tars-copilot",
  storageBucket: "tars-copilot.firebasestorage.app",
  messagingSenderId: "455955013347",
  appId: "1:455955013347:web:fce24549bff315561a6fd6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it so we can use it in our login page
export const auth = getAuth(app);