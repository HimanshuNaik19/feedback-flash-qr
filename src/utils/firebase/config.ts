
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqy5_zLwTeCxHIFCKbW9-vTH0dXKzYVDI",
  authDomain: "feedback-flash-qr.firebaseapp.com",
  projectId: "feedback-flash-qr",
  storageBucket: "feedback-flash-qr.appspot.com",
  messagingSenderId: "548462706175",
  appId: "1:548462706175:web:3b82e494fbaa96a2caf7bc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Export Firebase app instance
export default app;
