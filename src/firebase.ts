import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
      apiKey: "AIzaSyAF7uTeTeh-cSj5QrEAdO0ooaGmjaCNTbo",
  authDomain: "pdf-convertor-77c34.firebaseapp.com",
  projectId: "pdf-convertor-77c34",
  storageBucket: "pdf-convertor-77c34.firebasestorage.app",
  messagingSenderId: "374106482474",
  appId: "1:374106482474:web:9e0026ff7a6742bf992053",
  measurementId: "G-FRB7YHPQJP"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
