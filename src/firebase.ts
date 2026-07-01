import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-4a1d43fd-7ed0-46ae-b3cb-73b1fd53c118');
export const auth = getAuth(app);
