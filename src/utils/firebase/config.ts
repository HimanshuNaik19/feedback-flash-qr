
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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

// Enable offline persistence for better performance and offline access
try {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence.');
      }
    });
} catch (error) {
  console.error("Error enabling persistence:", error);
}

// Export Firebase app instance
export default app;
