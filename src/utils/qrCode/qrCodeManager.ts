
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

// Cache for QR codes to reduce network requests
let qrCodeCache: Record<string, {
  data: QRCodeContext;
  timestamp: number;
}> = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

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
  
  // Update cache
  qrCodeCache[qrCode.id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  // Cloud storage for cross-device sync
  try {
    await storeQRCodeToFirestore(qrCode);
  } catch (error) {
    console.error('Failed to store QR code in Firestore, but saved in localStorage:', error);
  }
};

export const getQRCode = async (id: string): Promise<QRCodeContext | null> => {
  console.log('Retrieving QR code with ID:', id);
  
  // Check cache first
  if (
    qrCodeCache[id] && 
    (Date.now() - qrCodeCache[id].timestamp) < CACHE_EXPIRATION
  ) {
    console.log('Using cached QR code data');
    return qrCodeCache[id].data;
  }
  
  try {
    // First try to get from Firestore (for most up-to-date data)
    const firestoreQRCode = await getQRCodeFromFirestore(id);
    if (firestoreQRCode) {
      // Update cache
      qrCodeCache[id] = {
        data: firestoreQRCode,
        timestamp: Date.now()
      };
      
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
  
  if (localQRCode) {
    // Update cache
    qrCodeCache[id] = {
      data: localQRCode,
      timestamp: Date.now()
    };
    
    // If found in localStorage but not in Firestore, sync it up
    if (!await getQRCodeFromFirestore(id)) {
      try {
        await storeQRCodeToFirestore(localQRCode);
      } catch (e) {
        console.error('Failed to sync localStorage QR code to Firestore:', e);
      }
    }
  }
  
  return localQRCode;
};

// In-memory cache for all QR codes
let allQRCodesCache: QRCodeContext[] | null = null;
let allQRCodesCacheTimestamp = 0;

export const getAllQRCodes = async (): Promise<QRCodeContext[]> => {
  // Use cache if it's recent
  if (allQRCodesCache && (Date.now() - allQRCodesCacheTimestamp) < CACHE_EXPIRATION) {
    console.log('Using cached QR codes list');
    return allQRCodesCache;
  }
  
  try {
    // Get all QR codes from Firestore
    console.log('Fetching all QR codes from Firestore');
    const firestoreQRCodes = await getAllQRCodesFromFirestore();
    
    // Update localStorage with Firestore data
    const qrCodesMap: Record<string, QRCodeContext> = {};
    firestoreQRCodes.forEach(qrCode => {
      qrCodesMap[qrCode.id] = qrCode;
      
      // Update individual cache entries
      qrCodeCache[qrCode.id] = {
        data: qrCode,
        timestamp: Date.now()
      };
    });
    
    // Also include any codes that might only exist in localStorage
    const localQRCodes = loadStoredQRCodes();
    const localOnlyCodes: QRCodeContext[] = [];
    
    Object.values(localQRCodes).forEach(qrCode => {
      if (!qrCodesMap[qrCode.id]) {
        qrCodesMap[qrCode.id] = qrCode;
        localOnlyCodes.push(qrCode);
        
        // Update individual cache entries
        qrCodeCache[qrCode.id] = {
          data: qrCode,
          timestamp: Date.now()
        };
      }
    });
    
    // Save all QR codes to localStorage
    storedQRCodes = qrCodesMap;
    saveQRCodesToStorage(storedQRCodes);
    
    // Try to sync local-only codes to Firestore in the background
    if (localOnlyCodes.length > 0) {
      console.log(`Syncing ${localOnlyCodes.length} local-only QR codes to Firestore`);
      Promise.all(
        localOnlyCodes.map(qrCode => storeQRCodeToFirestore(qrCode))
      ).catch(err => 
        console.error('Error syncing local QR codes to Firestore:', err)
      );
    }
    
    // Update the cache
    allQRCodesCache = Object.values(qrCodesMap);
    allQRCodesCacheTimestamp = Date.now();
    
    return allQRCodesCache;
  } catch (error) {
    console.error('Error getting QR codes from Firestore, falling back to localStorage:', error);
    
    // Fallback to localStorage
    const localCodes = Object.values(loadStoredQRCodes());
    
    // Update the cache even with local data in case of failure
    allQRCodesCache = localCodes;
    allQRCodesCacheTimestamp = Date.now();
    
    return localCodes;
  }
};

export const incrementScan = async (id: string): Promise<QRCodeContext | null> => {
  // Try to get the most up-to-date version
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  
  // Update both cache, localStorage and Firestore
  qrCodeCache[id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  storedQRCodes[id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  try {
    await updateQRCodeInFirestore(id, { currentScans: qrCode.currentScans });
  } catch (error) {
    console.error('Failed to update scan count in Firestore:', error);
  }
  
  // Invalidate the all QR codes cache since we changed one
  allQRCodesCache = null;
  
  return qrCode;
};

export const updateQRCode = async (id: string, updates: Partial<QRCodeContext>): Promise<QRCodeContext | null> => {
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  // Update the QR code with the provided updates
  const updatedQRCode = { ...qrCode, ...updates };
  
  // Update cache
  qrCodeCache[id] = {
    data: updatedQRCode,
    timestamp: Date.now()
  };
  
  // Update localStorage
  storedQRCodes[id] = updatedQRCode;
  saveQRCodesToStorage(storedQRCodes);
  
  // Invalidate the all QR codes cache
  allQRCodesCache = null;
  
  try {
    await updateQRCodeInFirestore(id, updates);
  } catch (error) {
    console.error('Failed to update QR code in Firestore:', error);
  }
  
  return updatedQRCode;
};

export const deleteQRCode = async (id: string): Promise<boolean> => {
  let success = true;
  
  // Delete from cache
  delete qrCodeCache[id];
  
  // Invalidate the all QR codes cache
  allQRCodesCache = null;
  
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

// Clear cache function to force refresh data
export const clearCache = () => {
  qrCodeCache = {};
  allQRCodesCache = null;
  allQRCodesCacheTimestamp = 0;
  console.log('QR code cache cleared');
};
