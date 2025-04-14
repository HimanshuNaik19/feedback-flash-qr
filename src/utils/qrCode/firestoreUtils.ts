
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch,
  runTransaction,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { QRCodeContext } from './types';
import { deleteFeedbackByQRCodeId } from '../feedback/feedbackFirestore';

// Collection references
const QR_CODES_COLLECTION = 'qrCodes';
const FEEDBACK_COLLECTION = 'feedback';

// Timeout promise for Firestore operations - increasing timeout to 15 seconds
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  let timeoutId: number;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }).catch(error => {
      clearTimeout(timeoutId);
      throw error;
    }),
    timeoutPromise
  ]);
};

// Retry logic for Firestore operations - improved with more retries and longer delays
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,  // Increased from 3 to 5
  baseDelayMs: number = 1500  // Increased from 1000 to 1500
): Promise<T> => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      if (attempt < maxRetries - 1) {
        // Wait with exponential backoff before retrying
        const delayMs = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

// QR Code Operations
export const storeQRCodeToFirestore = async (qrCode: QRCodeContext): Promise<void> => {
  return withRetry(async () => {
    const qrCodeWithServerTimestamp = {
      ...qrCode,
      serverCreatedAt: serverTimestamp()
    };
    
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, qrCode.id);
    await withTimeout(setDoc(qrCodeRef, qrCodeWithServerTimestamp));
    console.log('QR code saved to Firestore:', qrCode.id);
  });
};

export const getQRCodeFromFirestore = async (id: string): Promise<QRCodeContext | null> => {
  return withRetry(async () => {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
    const qrCodeSnap = await withTimeout(getDoc(qrCodeRef));
    
    if (qrCodeSnap.exists()) {
      return qrCodeSnap.data() as QRCodeContext;
    }
    return null;
  });
};

export const getAllQRCodesFromFirestore = async (): Promise<QRCodeContext[]> => {
  return withRetry(async () => {
    const qrCodesCollection = collection(db, QR_CODES_COLLECTION);
    const qrCodesSnapshot = await withTimeout(getDocs(qrCodesCollection));
    
    console.log(`Retrieved ${qrCodesSnapshot.docs.length} QR codes from Firestore`);
    return qrCodesSnapshot.docs.map(doc => doc.data() as QRCodeContext);
  });
};

// Function to subscribe to real-time QR code updates
export const subscribeToQRCodes = (callback: (qrCodes: QRCodeContext[]) => void): () => void => {
  const qrCodesCollection = collection(db, QR_CODES_COLLECTION);
  
  // Create a real-time listener
  const unsubscribe = onSnapshot(
    qrCodesCollection,
    (snapshot) => {
      const qrCodes = snapshot.docs.map(doc => doc.data() as QRCodeContext);
      console.log(`Real-time update: Retrieved ${qrCodes.length} QR codes`);
      callback(qrCodes);
    },
    (error) => {
      console.error('Error in QR codes real-time listener:', error);
    }
  );
  
  // Return the unsubscribe function
  return unsubscribe;
};

export const updateQRCodeInFirestore = async (id: string, updates: Partial<QRCodeContext>): Promise<void> => {
  return withRetry(async () => {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
    
    // Add server timestamp for the update
    const updatesWithTimestamp = {
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    await withTimeout(updateDoc(qrCodeRef, updatesWithTimestamp));
    console.log('QR code updated in Firestore:', id);
  });
};

export const deleteQRCodeFromFirestore = async (id: string): Promise<boolean> => {
  return withRetry(async () => {
    try {
      // Use a transaction to ensure atomicity when deleting QR code and related feedback
      await runTransaction(db, async (transaction) => {
        // Delete the QR code
        const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
        transaction.delete(qrCodeRef);
        
        // We don't delete feedback here as that would make the transaction too large
        // Instead we'll do it separately after the transaction completes
      });
      
      // Now delete the associated feedback
      await deleteFeedbackByQRCodeId(id);
      
      console.log('QR code and associated feedback deleted from Firestore:', id);
      return true;
    } catch (error) {
      console.error('Transaction failure:', error);
      return false;
    }
  });
};
