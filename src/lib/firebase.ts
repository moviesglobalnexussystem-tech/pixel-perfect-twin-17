import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB_ofBGMVg3xwSkvsl0FO9XPaPxR5zxFSE",
  authDomain: "luo-film.firebaseapp.com",
  projectId: "luo-film",
  storageBucket: "luo-film.firebasestorage.app",
  messagingSenderId: "273478932519",
  appId: "1:273478932519:web:9a21063adcb63e6c411602",
  measurementId: "G-HG60VRE1RY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics - only in browser
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    // analytics may fail in some environments
  }
}
export { analytics };
export default app;
