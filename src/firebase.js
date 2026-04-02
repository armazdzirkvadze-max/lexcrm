import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaiQx-zIjfkSGMyIyvroQwRD-zzTePyes",
  authDomain: "lexcrm-affde.firebaseapp.com",
  projectId: "lexcrm-affde",
  storageBucket: "lexcrm-affde.firebasestorage.app",
  messagingSenderId: "232922204519",
  appId: "1:232922204519:web:7642b5898d14a799a8c7c2",
  measurementId: "G-BNHG6CGS0R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);