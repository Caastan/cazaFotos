// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDmmKFq6T8o63RhpOdpEOM09DsG5RkVGDk",
  authDomain: "rallyfotografico-2a1c8.firebaseapp.com",
  projectId: "rallyfotografico-2a1c8",
  storageBucket: "rallyfotografico-2a1c8.firebasestorage.app",
  messagingSenderId: "546209658852",
  appId: "1:546209658852:web:8f4ba32c37a92e99de39f1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);