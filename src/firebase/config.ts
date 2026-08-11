import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Your Real Firebase App Configuration (Project: chess-780ea)
const firebaseConfig = (typeof window !== 'undefined' && (window as any).FIREBASE_CONFIG) || {
  apiKey: "AIzaSyAuLfa1iA1QttbsMi8qYgwr0bsvoFPSE4s",
  authDomain: "chess-780ea.firebaseapp.com",
  projectId: "chess-780ea",
  storageBucket: "chess-780ea.firebasestorage.app",
  messagingSenderId: "826100527837",
  appId: "1:826100527837:web:189ecdcf9b6f82864f6134",
  measurementId: "G-MP9LV5NTGB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
