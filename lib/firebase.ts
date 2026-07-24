import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5D7pbJDmZK7rva2_iQlPjARhyczHDYyk",
  authDomain: "vocab-app-c8613.firebaseapp.com",
  projectId: "vocab-app-c8613",
  storageBucket: "vocab-app-c8613.firebasestorage.app",
  messagingSenderId: "833768299962",
  appId: "1:833768299962:web:590a6e49b9934d6be25183",
  measurementId: "G-CZP3DPQX0M"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
