import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// Your Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzwtpVEpNqKkb8HgV-p8hI4acsVMkDbpI",
  authDomain: "personal-expense-tracker-2342f.firebaseapp.com",
  projectId: "personal-expense-tracker-2342f",
  storageBucket: "personal-expense-tracker-2342f.firebasestorage.app",
  messagingSenderId: "75020304430",
  appId: "1:75020304430:web:37766d322b043c8cde5fbf",
  measurementId: "G-DXGXVGQWYN"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication

const auth = getAuth(app);


// Initialize Cloud Firestore

const db = getFirestore(app);


// Export Firebase services

export {
    auth,
    db
};