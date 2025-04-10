
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { QRCodeContext } from './types';

// Collection references
const QR_CODES_COLLECTION = 'qrCodes';
const FEEDBACK_COLLECTION = 'feedback';

// QR Code Operations
export const storeQRCodeToFirestore = async (qrCode: QRCodeContext): Promise<void> => {
  try {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, qrCode.id);
    await setDoc(qrCodeRef, qrCode);
    console.log('QR code saved to Firestore:', qrCode.id);
  } catch (error) {
    console.error('Error saving QR code to Firestore:', error);
    throw error;
  }
};

export const getQRCodeFromFirestore = async (id: string): Promise<QRCodeContext | null> => {
  try {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
    const qrCodeSnap = await getDoc(qrCodeRef);
    
    if (qrCodeSnap.exists()) {
      return qrCodeSnap.data() as QRCodeContext;
    }
    return null;
  } catch (error) {
    console.error('Error getting QR code from Firestore:', error);
    return null;
  }
};

export const getAllQRCodesFromFirestore = async (): Promise<QRCodeContext[]> => {
  try {
    const qrCodesCollection = collection(db, QR_CODES_COLLECTION);
    const qrCodesSnapshot = await getDocs(qrCodesCollection);
    
    return qrCodesSnapshot.docs.map(doc => doc.data() as QRCodeContext);
  } catch (error) {
    console.error('Error getting all QR codes from Firestore:', error);
    return [];
  }
};

export const updateQRCodeInFirestore = async (id: string, updates: Partial<QRCodeContext>): Promise<void> => {
  try {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
    await updateDoc(qrCodeRef, updates);
    console.log('QR code updated in Firestore:', id);
  } catch (error) {
    console.error('Error updating QR code in Firestore:', error);
    throw error;
  }
};

export const deleteQRCodeFromFirestore = async (id: string): Promise<boolean> => {
  try {
    const qrCodeRef = doc(db, QR_CODES_COLLECTION, id);
    await deleteDoc(qrCodeRef);
    console.log('QR code deleted from Firestore:', id);
    return true;
  } catch (error) {
    console.error('Error deleting QR code from Firestore:', error);
    return false;
  }
};

// Feedback Operations
export const deleteFeedbackByQRCodeId = async (qrCodeId: string): Promise<boolean> => {
  try {
    const feedbackCollection = collection(db, FEEDBACK_COLLECTION);
    const q = query(feedbackCollection, where("qrCodeId", "==", qrCodeId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${querySnapshot.size} feedback items for QR code ID: ${qrCodeId}`);
    return true;
  } catch (error) {
    console.error('Error deleting feedback by QR code ID:', error);
    return false;
  }
};
