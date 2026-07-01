import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5Hdu6qQUkqGj0Ae8iVPaSUa4QCEx4wvs",
  authDomain: "home-75c8e.firebaseapp.com",
  projectId: "home-75c8e",
  storageBucket: "home-75c8e.firebasestorage.app",
  messagingSenderId: "327145733890",
  appId: "1:327145733890:web:5235baa87082dab4e6cc1b",
  measurementId: "G-GZHZS76JPG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
