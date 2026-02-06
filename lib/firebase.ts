import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from user's provided config
const firebaseConfig = {
  apiKey: "AIzaSyC1Rr9u5X26t55UduNJ5vdKnzikZMJuMIk",
  authDomain: "fitguide-b0a78.firebaseapp.com",
  projectId: "fitguide-b0a78",
  storageBucket: "fitguide-b0a78.firebasestorage.app",
  messagingSenderId: "307516186740",
  appId: "1:307516186740:web:427bc51f9139ca439bf121",
  measurementId: "G-WL34DBL2GH"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
