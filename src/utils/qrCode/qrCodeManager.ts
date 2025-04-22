import { v4 as uuidv4 } from 'uuid';
import type { QRCodeContext } from './types';
import { loadStoredQRCodes, saveQRCodesToStorage, testLocalStorage } from './storageUtils';
import { 
  storeQRCodeToMongoDB, 
  getQRCodeFromMongoDB, 
  getAllQRCodesFromMongoDB,
  updateQRCodeInMongoDB,
  deleteQRCodeFromMongoDB
} from './mongodbUtils';

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
  // Store in both localStorage and MongoDB
  console.log('Storing QR code:', qrCode);
  
  // Local storage for offline capability
  storedQRCodes[qrCode.id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  // Update cache
  qrCodeCache[qrCode.id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  // Invalidate the all QR codes cache
  allQRCodesCache = null;
  
  // Cloud storage for cross-device sync
  try {
    await Promise.race([
      storeQRCodeToMongoDB(qrCode),
      // Set a timeout of 10 seconds
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB operation timeout')), 10000))
    ]);
    console.log('QR code successfully stored in MongoDB');
  } catch (error) {
    console.error('Failed to store QR code in MongoDB:', error);
    // Mark the QR code as needing sync
    if (window && 'localStorage' in window) {
      try {
        const pendingSyncs = JSON.parse(localStorage.getItem('pendingSyncs') || '[]');
        pendingSyncs.push(qrCode.id);
        localStorage.setItem('pendingSyncs', JSON.stringify(pendingSyncs));
      } catch (e) {
        console.error('Failed to mark QR code for sync:', e);
      }
    }
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
  
  // Check network status
  const isOnline = navigator.onLine;
  
  // If we're online, try MongoDB first
  if (isOnline) {
    try {
      console.log('Fetching QR code from MongoDB');
      const mongoDBQRCode = await getQRCodeFromMongoDB(id);
      if (mongoDBQRCode) {
        // Update cache
        qrCodeCache[id] = {
          data: mongoDBQRCode,
          timestamp: Date.now()
        };
        
        // Update localStorage with the latest data
        storedQRCodes[id] = mongoDBQRCode;
        saveQRCodesToStorage(storedQRCodes);
        return mongoDBQRCode;
      }
    } catch (error) {
      console.error('Error fetching from MongoDB, falling back to localStorage:', error);
    }
  } else {
    console.log('Device is offline, using localStorage');
  }
  
  // If we're offline or MongoDB fetch failed, use localStorage
  storedQRCodes = loadStoredQRCodes();
  const localQRCode = storedQRCodes[id] || null;
  
  if (localQRCode) {
    // Update cache
    qrCodeCache[id] = {
      data: localQRCode,
      timestamp: Date.now()
    };
    
    // If found in localStorage but not in MongoDB (when online), schedule sync for later
    if (isOnline) {
      if (window && 'localStorage' in window) {
        try {
          const pendingSyncs = JSON.parse(localStorage.getItem('pendingSyncs') || '[]');
          if (!pendingSyncs.includes(id)) {
            pendingSyncs.push(id);
            localStorage.setItem('pendingSyncs', JSON.stringify(pendingSyncs));
          }
        } catch (e) {
          console.error('Failed to mark QR code for sync:', e);
        }
      }
    }
  }
  
  // If we still don't have a QR code, return null
  if (!localQRCode) {
    console.warn(`QR code with ID ${id} not found in cache, MongoDB, or localStorage`);
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
  
  // Check network status
  const isOnline = navigator.onLine;
  
  // Prepare result
  let result: QRCodeContext[] = [];
  
  // If online, try to get from MongoDB
  if (isOnline) {
    try {
      console.log('Fetching all QR codes from MongoDB');
      const mongoDBQRCodes = await getAllQRCodesFromMongoDB();
      
      // Update cache
      const qrCodesMap: Record<string, QRCodeContext> = {};
      mongoDBQRCodes.forEach(qrCode => {
        qrCodesMap[qrCode.id] = qrCode;
        
        // Update individual cache entries
        qrCodeCache[qrCode.id] = {
          data: qrCode,
          timestamp: Date.now()
        };
      });
      
      // Save to localStorage
      storedQRCodes = { ...storedQRCodes, ...qrCodesMap };
      saveQRCodesToStorage(storedQRCodes);
      
      // Set as result
      result = mongoDBQRCodes;
    } catch (error) {
      console.error('Error getting QR codes from MongoDB, falling back to localStorage:', error);
      // Fallback to localStorage
      result = Object.values(loadStoredQRCodes());
    }
  } else {
    console.log('Device is offline, using localStorage');
    // Use localStorage when offline
    result = Object.values(loadStoredQRCodes());
  }
  
  // Update cache
  allQRCodesCache = result;
  allQRCodesCacheTimestamp = Date.now();
  
  return result;
};

// Function to sync pending QR codes
export const syncPendingQRCodes = async (): Promise<number> => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return 0;
  }
  
  try {
    const pendingSyncs = JSON.parse(localStorage.getItem('pendingSyncs') || '[]');
    if (pendingSyncs.length === 0) {
      return 0;
    }
    
    console.log(`Attempting to sync ${pendingSyncs.length} pending QR codes`);
    let successCount = 0;
    
    for (const id of pendingSyncs) {
      const localQRCode = storedQRCodes[id];
      if (localQRCode) {
        try {
          await storeQRCodeToMongoDB(localQRCode);
          successCount++;
        } catch (e) {
          console.error(`Failed to sync QR code ${id}:`, e);
        }
      }
    }
    
    // Remove successfully synced QR codes from pending list
    if (successCount > 0) {
      // Create a new array for QR codes that still need syncing
      const newPendingSyncs = [];
      
      // Check each pending sync
      for (const id of pendingSyncs) {
        try {
          const mongoDBQRCode = await getQRCodeFromMongoDB(id);
          // Only keep in pending syncs if it's not found in MongoDB
          if (!mongoDBQRCode) {
            newPendingSyncs.push(id);
          }
        } catch (error) {
          // If there's an error checking, keep it in pending syncs
          console.error(`Error checking QR code ${id} in MongoDB:`, error);
          newPendingSyncs.push(id);
        }
      }
      
      localStorage.setItem('pendingSyncs', JSON.stringify(newPendingSyncs));
      console.log(`Successfully synced ${successCount} QR codes. ${newPendingSyncs.length} remaining.`);
    }
    
    return successCount;
  } catch (e) {
    console.error('Error syncing pending QR codes:', e);
    return 0;
  }
};

// Try to sync pending QR codes when the module loads
if (typeof window !== 'undefined') {
  // Wait a few seconds after page load to avoid performance impact
  setTimeout(() => {
    syncPendingQRCodes().catch(e => console.error('Failed initial sync attempt:', e));
  }, 5000);
}

export const incrementScan = async (id: string): Promise<QRCodeContext | null> => {
  // Try to get the most up-to-date version
  const qrCode = await getQRCode(id);
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  
  // Update both cache, localStorage and MongoDB
  qrCodeCache[id] = {
    data: qrCode,
    timestamp: Date.now()
  };
  
  storedQRCodes[id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  
  try {
    await updateQRCodeInMongoDB(id, { currentScans: qrCode.currentScans });
  } catch (error) {
    console.error('Failed to update scan count in MongoDB:', error);
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
    await updateQRCodeInMongoDB(id, updates);
  } catch (error) {
    console.error('Failed to update QR code in MongoDB:', error);
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
  
  // Delete from MongoDB
  try {
    await deleteQRCodeFromMongoDB(id);
  } catch (error) {
    console.error('Failed to delete QR code from MongoDB:', error);
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
