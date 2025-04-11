
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqy5_zLwTeCxHIFCKbW9-vTH0dXKzYVDI",
  authDomain: "feedback-flash-qr.firebaseapp.com",
  projectId: "feedback-flash-qr",
  storageBucket: "feedback-flash-qr.appspot.com",
  messagingSenderId: "548462706175",
  appId: "1:548462706175:web:3b82e494fbaa96a2caf7bc"
};

// Initialize Firebase with improved settings
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for performance
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Try to enable offline persistence with better error handling
const enableOfflineCapabilities = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('✅ Offline persistence enabled successfully');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser does not support IndexedDB, falling back to memory cache');
    } else {
      console.error('❌ Error enabling persistence:', err);
    }
  }
};

// Call asynchronously to avoid blocking initial load
enableOfflineCapabilities().catch(err => {
  console.error('Failed to initialize offline capabilities:', err);
});

// Use Firestore emulator in development if needed
if (window.location.hostname === 'localhost') {
  // Uncomment the line below to use the emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// Export Firebase app instance
export default app;
