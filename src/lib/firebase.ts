import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCGJ9yRzzI-6m2iSgABGI7Am0jx9oRz1KY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "crorepixels.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "crorepixels",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "crorepixels.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "187412392167",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:187412392167:web:4f351a44b25715385c5a42",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-L41PE50EZT",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://crorepixels-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Realtime Database — used for live pixel event broadcasting across all clients
export const rtdb = (() => {
  try {
    return getDatabase(app);
  } catch (err) {
    console.warn("Firebase RTDB init warning:", err);
    return null;
  }
})();

// Analytics disabled to prevent installations API permission warnings (unused in codebase)
export let analytics: any = null;

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.warn("Firebase Google Auth popup fallback to local session:", error);
    return null;
  }
}

export async function logoutUser() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Firebase signout error:", error);
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    throw error;
  }
}
