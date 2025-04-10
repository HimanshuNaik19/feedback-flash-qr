
import { collection, doc, addDoc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Feedback } from '../sentimentUtils';

const FEEDBACK_COLLECTION = 'feedback';

export const saveFeedbackToFirestore = async (feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback> => {
  try {
    const feedbackWithTimestamp = {
      ...feedback,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), feedbackWithTimestamp);
    
    return {
      id: docRef.id,
      ...feedbackWithTimestamp
    } as Feedback;
  } catch (error) {
    console.error('Error saving feedback to Firestore:', error);
    throw error;
  }
};

export const getFeedbackFromFirestore = async (id: string): Promise<Feedback | null> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, id);
    const feedbackSnap = await getDoc(feedbackRef);
    
    if (feedbackSnap.exists()) {
      return { 
        id: feedbackSnap.id, 
        ...feedbackSnap.data() 
      } as Feedback;
    }
    return null;
  } catch (error) {
    console.error('Error getting feedback from Firestore:', error);
    return null;
  }
};

export const getAllFeedbackFromFirestore = async (): Promise<Feedback[]> => {
  try {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const feedbackSnapshot = await getDocs(feedbackCollection);
    
    return feedbackSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as Feedback);
  } catch (error) {
    console.error('Error getting all feedback from Firestore:', error);
    return [];
  }
};

export const getFeedbackByQRCodeId = async (qrCodeId: string): Promise<Feedback[]> => {
  try {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackCollection, where("qrCodeId", "==", qrCodeId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }) as Feedback);
  } catch (error) {
    console.error('Error getting feedback by QR code ID:', error);
    return [];
  }
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    const feedbackRef = doc(db, FEEDBACK_COLLECTION, id);
    await deleteDoc(feedbackRef);
    console.log('Feedback deleted from Firestore:', id);
    return true;
  } catch (error) {
    console.error('Error deleting feedback from Firestore:', error);
    return false;
  }
};
