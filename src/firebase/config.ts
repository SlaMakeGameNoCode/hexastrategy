import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Default Firebase Configuration (Can be overridden via window.FIREBASE_CONFIG or process.env)
const firebaseConfig = (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) || {
  apiKey: "AIzaSyDemoHexStrategyKeyForAuthPvP",
  authDomain: "hex-strategy-pvp.firebaseapp.com",
  projectId: "hex-strategy-pvp",
  storageBucket: "hex-strategy-pvp.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:hexstrategypvpdemo"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
