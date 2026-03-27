import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const certificateFirebaseConfig = {
  apiKey: "AIzaSyAf-3rsizupyZ5Tv6diIK-EgLuxhKW6Rc0",
  authDomain: "dextra26-certificate.firebaseapp.com",
  projectId: "dextra26-certificate",
  storageBucket: "dextra26-certificate.firebasestorage.app",
  messagingSenderId: "544159430542",
  appId: "1:544159430542:web:b63c8c4b725d4f99c216df",
  measurementId: "G-FB2566250Z"
};

// Use a unique name so it doesn't conflict with the main Firebase app
const certApp =
  getApps().find((a) => a.name === "certificates") ??
  initializeApp(certificateFirebaseConfig, "certificates");

export const certDb = getFirestore(certApp);
