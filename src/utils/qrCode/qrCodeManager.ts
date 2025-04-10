
import { v4 as uuidv4 } from 'uuid';
import type { QRCodeContext } from './types';
import { loadStoredQRCodes, saveQRCodesToStorage, testLocalStorage } from './storageUtils';
import { 
  storeQRCodeToFirestore, 
  getQRCodeFromFirestore, 
  getAllQRCodesFromFirestore,
  updateQRCodeInFirestore,
  deleteQRCodeFromFirestore
} from './firestoreUtils';

// Run a test when the module loads
const localStorageAvailable = testLocalStorage();
console.log('LocalStorage availability test:', localStorageAvailable);

// Initialize stored QR codes from localStorage
let storedQRCodes: Record<string, QRCodeContext> = loadStoredQRCodes();

export const generateQRCodeData = (
  context: string, 
  expiryHours: number = 24, 
  maxScans: number = 100
): QRCodeContext => {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
  
  return {
    id,
    context,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    maxScans,
    currentScans: 0,
    isActive: true
  };
};

export const storeQRCode = async (qrCode: QRCodeContext): Promise<void> => {
  // Store in both localStorage and Firestore
  console.log('Storing QR code:', qrCode);
  
  // Local storage for offline capability
  storedQRCodes[qrCode.id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  // Cloud storage for cross-device sync
  try {
    await storeQRCodeToFirestore(qrCode);
  } catch (error) {
    console.error('Failed to store QR code in Firestore, but saved in localStorage:', error);
  }
};

export const getQRCode = async (id: string): Promise<QRCodeContext | null> => {
  console.log('Retrieving QR code with ID:', id);
  
  try {
    // First try to get from Firestore (for most up-to-date data)
    const firestoreQRCode = await getQRCodeFromFirestore(id);
    if (firestoreQRCode) {
      // Update localStorage with the latest data
      storedQRCodes[id] = firestoreQRCode;
      saveQRCodesToStorage(storedQRCodes);
      return firestoreQRCode;
    }
  } catch (error) {
    console.error('Error fetching from Firestore, falling back to localStorage:', error);
  }
  
  // If not found in Firestore or there was an error, try localStorage
  storedQRCodes = loadStoredQRCodes();
  const localQRCode = storedQRCodes[id] || null;
  
  if (localQRCode && !await getQRCodeFromFirestore(id)) {
    // If found in localStorage but not in Firestore, sync it up
    try {
      await storeQRCodeToFirestore(localQRCode);
    } catch (e) {
      console.error('Failed to sync localStorage QR code to Firestore:', e);
    }
  }
  
  return localQRCode;
};

export const getAllQRCodes = async (): Promise<QRCodeContext[]> => {
  try {
    // Get all QR codes from Firestore
    const firestoreQRCodes = await getAllQRCodesFromFirestore();
    
    // Update localStorage with Firestore data
    const qrCodesMap: Record<string, QRCodeContext> = {};
    firestoreQRCodes.forEach(qrCode => {
      qrCodesMap[qrCode.id] = qrCode;
    });
    
    // Also include any codes that might only exist in localStorage
    const localQRCodes = loadStoredQRCodes();
    Object.values(localQRCodes).forEach(qrCode => {
      if (!qrCodesMap[qrCode.id]) {
        qrCodesMap[qrCode.id] = qrCode;
        // Try to sync to Firestore
        storeQRCodeToFirestore(qrCode).catch(err => 
          console.error('Error syncing local QR code to Firestore:', err)
        );
      }
    });
    
    return Object.values(qrCodesMap);
  } catch (error) {
    console.error('Error getting QR codes from Firestore, falling back to localStorage:', error);
    // Fallback to localStorage
    return Object.values(loadStoredQRCodes());
  }
};

export const incrementScan = async (id: string): Promise<QRCodeContext | null> => {
  // Try to get the most up-to-date version
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  
  // Update both localStorage and Firestore
  storedQRCodes[id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  try {
    await updateQRCodeInFirestore(id, { currentScans: qrCode.currentScans });
  } catch (error) {
    console.error('Failed to update scan count in Firestore:', error);
  }
  
  return qrCode;
};

export const updateQRCode = async (id: string, updates: Partial<QRCodeContext>): Promise<QRCodeContext | null> => {
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  // Update the QR code with the provided updates
  const updatedQRCode = { ...qrCode, ...updates };
  
  // Update both localStorage and Firestore
  storedQRCodes[id] = updatedQRCode;
  saveQRCodesToStorage(storedQRCodes);
  
  try {
    await updateQRCodeInFirestore(id, updates);
  } catch (error) {
    console.error('Failed to update QR code in Firestore:', error);
  }
  
  return updatedQRCode;
};

export const deleteQRCode = async (id: string): Promise<boolean> => {
  let success = true;
  
  // Delete from localStorage
  storedQRCodes = loadStoredQRCodes();
  if (storedQRCodes[id]) {
    delete storedQRCodes[id];
    saveQRCodesToStorage(storedQRCodes);
  }
  
  // Delete from Firestore
  try {
    await deleteQRCodeFromFirestore(id);
  } catch (error) {
    console.error('Failed to delete QR code from Firestore:', error);
    success = false;
  }
  
  return success;
};
