import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy,
  writeBatch,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Feedback } from '../sentimentUtils';

const FEEDBACK_COLLECTION = 'feedback';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Helper function to retry a Firestore operation
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = MAX_RETRY_ATTEMPTS): Promise<T> => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed. ${attempt < maxRetries ? 'Retrying...' : 'Giving up.'}`);
      lastError = error;
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
      
      // On final attempt, try to reset network connection
      if (attempt === maxRetries - 1) {
        try {
          console.log('Resetting network connection...');
          await disableNetwork(db);
          await enableNetwork(db);
        } catch (e) {
          console.error('Failed to reset network:', e);
        }
      }
    }
  }
  throw lastError;
};

export const saveFeedbackToFirestore = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Promise<Feedback> => {
  return retryOperation(async () => {
    const feedbackWithTimestamp = {
      ...feedback,
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp() // Using server timestamp for more reliable time sorting
    };
    
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), feedbackWithTimestamp);
    console.log('Feedback saved to Firestore with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...feedbackWithTimestamp
    } as Feedback;
  });
};

export const getFeedbackFromFirestore = async (id: string): Promise<Feedback | null> => {
  return retryOperation(async () => {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, id);
    const feedbackSnap = await getDoc(feedbackRef);
    
    if (feedbackSnap.exists()) {
      return { 
        id: feedbackSnap.id, 
        ...feedbackSnap.data() 
      } as Feedback;
    }
    return null;
  });
};

export const getAllFeedbackFromFirestore = async (): Promise<Feedback[]> => {
  return retryOperation(async () => {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    // Improved query with proper indexes to speed up performance
    const q = query(
      feedbackCollection, 
      orderBy("createdAt", "desc"), 
      limit(100)
    );
    
    const feedbackSnapshot = await getDocs(q);
    console.log(`Retrieved ${feedbackSnapshot.size} feedback items from Firestore`);
    
    return feedbackSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as Feedback);
  });
};

export const getFeedbackByQRCodeId = async (qrCodeId: string): Promise<Feedback[]> => {
  return retryOperation(async () => {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const q = query(
      feedbackCollection, 
      where("qrCodeId", "==", qrCodeId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Retrieved ${querySnapshot.size} feedback items for QR code ID: ${qrCodeId}`);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as Feedback);
  });
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  return retryOperation(async () => {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, id);
    await deleteDoc(feedbackRef);
    console.log('Feedback deleted from Firestore:', id);
    return true;
  });
};

export const deleteFeedbackByQRCodeId = async (qrCodeId: string): Promise<boolean> => {
  return retryOperation(async () => {
    // Use batched writes for better performance and atomicity
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackCollection, where("qrCodeId", "==", qrCodeId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.size === 0) {
      console.log(`No feedback found for QR code ID: ${qrCodeId}`);
      return true;
    }
    
    // Firestore can only delete 500 documents in a batch
    // So we may need multiple batches
    const batches = [];
    const batchSize = 450; // Slightly less than the 500 limit
    
    for (let i = 0; i < querySnapshot.size; i += batchSize) {
      const batch = writeBatch(db);
      
      // Get a slice of documents for this batch
      const docSlice = querySnapshot.docs.slice(i, i + batchSize);
      
      docSlice.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batches.push(batch.commit());
    }
    
    // Execute all batches
    await Promise.all(batches);
    
    console.log(`Deleted ${querySnapshot.size} feedback items for QR code ID: ${qrCodeId}`);
    return true;
  });
};

// Add the missing function that's being imported in sentimentUtils.ts
export const deleteAllFeedbackFromFirestore = async (): Promise<boolean> => {
  return deleteAllFeedback();
};

export const deleteAllFeedback = async (): Promise<boolean> => {
  return retryOperation(async () => {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const querySnapshot = await getDocs(feedbackCollection);
    
    if (querySnapshot.size === 0) {
      console.log('No feedback to delete');
      return true;
    }
    
    // Use batched writes for better performance
    const batches = [];
    const batchSize = 450; // Firestore batch limit is 500
    
    for (let i = 0; i < querySnapshot.size; i += batchSize) {
      const batch = writeBatch(db);
      
      const docSlice = querySnapshot.docs.slice(i, i + batchSize);
      docSlice.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      batches.push(batch.commit());
    }
    
    await Promise.all(batches);
    console.log(`Deleted all ${querySnapshot.size} feedback items`);
    return true;
  });
};
