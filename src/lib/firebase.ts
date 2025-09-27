import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIzvybojTPGSHJmJyWuRkiD6NbSPRCpqQ",
  authDomain: "eventsorganizze.firebaseapp.com",
  projectId: "eventsorganizze",
  storageBucket: "eventsorganizze.firebasestorage.app",
  messagingSenderId: "822700253419",
  appId: "1:822700253419:web:81f2c283502d6e04fc9eae",
  measurementId: "G-C3MSPT4MG1"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;