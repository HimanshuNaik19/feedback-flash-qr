
import { v4 as uuidv4 } from 'uuid';
import type { QRCodeContext } from './types';
import { 
  loadStoredQRCodes, 
  saveQRCodesToStorage, 
  testLocalStorage,
  storeFeedbackToStorage,
  getAllFeedbackFromStorage,
  getFeedbackByQRCodeIdFromStorage,
  deleteFeedbackByIdFromStorage,
  deleteFeedbackByQRCodeIdFromStorage,
  deleteAllFeedbackFromStorage
} from './storageUtils';

// Run a test when the module loads
const localStorageAvailable = testLocalStorage();
console.log('LocalStorage availability test:', localStorageAvailable);

// Cache for QR codes to reduce storage reads
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
  // Store in localStorage
  console.log('Storing QR code:', qrCode);
  
  storedQRCodes[qrCode.id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  // Update cache
  qrCodeCache[qrCode.id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  // Invalidate the all QR codes cache
  allQRCodesCache = null;
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
  
  // Use localStorage
  storedQRCodes = loadStoredQRCodes();
  const localQRCode = storedQRCodes[id] || null;
  
  if (localQRCode) {
    // Update cache
    qrCodeCache[id] = {
      data: localQRCode,
      timestamp: Date.now()
    };
  } else {
    console.warn(`QR code with ID ${id} not found in cache or localStorage`);
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
  
  // Use localStorage
  const result = Object.values(loadStoredQRCodes());
  
  // Update cache
  allQRCodesCache = result;
  allQRCodesCacheTimestamp = Date.now();
  
  return result;
};

export const incrementScan = async (id: string): Promise<QRCodeContext | null> => {
  // Try to get the most up-to-date version
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  
  // Update both cache and localStorage
  qrCodeCache[id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  storedQRCodes[id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
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
  
  return updatedQRCode;
};

export const deleteQRCode = async (id: string): Promise<boolean> => {
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
  
  return true;
};

// Clear cache function to force refresh data
export const clearCache = () => {
  qrCodeCache = {};
  allQRCodesCache = null;
  allQRCodesCacheTimestamp = 0;
  console.log('QR code cache cleared');
};

// Expose the local storage feedback functions
export const storeFeedback = storeFeedbackToStorage;
export const getAllFeedback = getAllFeedbackFromStorage;
export const getFeedbackByQRCodeId = getFeedbackByQRCodeIdFromStorage;
export const deleteFeedbackById = deleteFeedbackByIdFromStorage;
export const deleteFeedbackByQRCodeId = deleteFeedbackByQRCodeIdFromStorage;
export const deleteAllFeedback = deleteAllFeedbackFromStorage;

// Dummy function to satisfy imports in other files
export const syncPendingQRCodes = async (): Promise<number> => {
  console.log('Local-only mode enabled, no syncing needed');
  return Promise.resolve(0);
};
