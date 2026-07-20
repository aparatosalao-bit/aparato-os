import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDGcktjwgEIFfqf2p4Afs2Zxggm0T9Xtuw",
  authDomain: "aparatomarketing-a579f.firebaseapp.com",
  projectId: "aparatomarketing-a579f",
  storageBucket: "aparatomarketing-a579f.firebasestorage.app",
  messagingSenderId: "873200916736",
  appId: "1:873200916736:web:26079a167f9eba775e7be5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-aparatoos-17fc628c-c3dd-4921-9497-b8a1cd883813");
export const auth = getAuth(app);
