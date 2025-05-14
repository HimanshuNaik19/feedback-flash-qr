
import { v4 as uuidv4 } from 'uuid';
import type { QRCodeContext } from './types';
import { getDb } from '../mongodb/config';
import { toast } from 'sonner';

// Constants
const QR_CODES_COLLECTION = 'qrCodes';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Cache for QR codes to reduce database reads
let qrCodeCache: Record<string, {
  data: QRCodeContext;
  timestamp: number;
}> = {};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Helper function to retry a MongoDB operation
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
    }
  }
  throw lastError;
};

// Helper function to convert MongoDB _id to string id
const convertMongoDocToQRCode = (doc: any): QRCodeContext => {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as QRCodeContext;
};

// Get QR codes collection reference
const getQRCodesCollection = async () => {
  const db = await getDb();
  return db.collection(QR_CODES_COLLECTION);
};

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
  return retryOperation(async () => {
    // Store in MongoDB
    console.log('Storing QR code:', qrCode);
    
    const collection = await getQRCodesCollection();
    const result = await collection.insertOne({
      _id: qrCode.id,  // Use the UUID as the MongoDB _id
      ...qrCode
    });
    
    console.log('QR code stored in MongoDB with ID:', result.insertedId);
    
    // Update cache
    qrCodeCache[qrCode.id] = {
      data: qrCode,
      timestamp: Date.now()
    };
    
    // Invalidate the all QR codes cache
    allQRCodesCache = null;
  });
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
  
  return retryOperation(async () => {
    const collection = await getQRCodesCollection();
    const qrCode = await collection.findOne({ _id: id });
    
    if (qrCode) {
      const formattedQRCode = convertMongoDocToQRCode(qrCode);
      
      // Update cache
      qrCodeCache[id] = {
        data: formattedQRCode,
        timestamp: Date.now()
      };
      
      return formattedQRCode;
    } else {
      console.warn(`QR code with ID ${id} not found in MongoDB`);
      return null;
    }
  });
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
  
  return retryOperation(async () => {
    const collection = await getQRCodesCollection();
    const cursor = collection.find().sort({ createdAt: -1 }).limit(100);
    
    const results = await cursor.toArray();
    console.log(`Retrieved ${results.length} QR codes from MongoDB`);
    
    const formattedResults = results.map(convertMongoDocToQRCode);
    
    // Update cache
    allQRCodesCache = formattedResults;
    allQRCodesCacheTimestamp = Date.now();
    
    return formattedResults;
  });
};

export const incrementScan = async (id: string): Promise<QRCodeContext | null> => {
  return retryOperation(async () => {
    const collection = await getQRCodesCollection();
    
    const result = await collection.updateOne(
      { _id: id },
      { $inc: { currentScans: 1 } }
    );
    
    if (result.modifiedCount === 0) {
      console.warn(`Failed to increment scan count for QR code ${id}`);
      return null;
    }
    
    // Invalidate both individual and all QR codes cache
    delete qrCodeCache[id];
    allQRCodesCache = null;
    
    // Get the updated QR code
    return await getQRCode(id);
  });
};

export const updateQRCode = async (id: string, updates: Partial<QRCodeContext>): Promise<QRCodeContext | null> => {
  return retryOperation(async () => {
    const collection = await getQRCodesCollection();
    
    const result = await collection.updateOne(
      { _id: id },
      { $set: updates }
    );
    
    if (result.modifiedCount === 0) {
      console.warn(`No QR code found with ID: ${id} or no changes made`);
      return null;
    }
    
    console.log(`Updated QR code ${id} in MongoDB`);
    
    // Invalidate both individual and all QR codes cache
    delete qrCodeCache[id];
    allQRCodesCache = null;
    
    // Get the updated QR code
    return await getQRCode(id);
  });
};

export const deleteQRCode = async (id: string): Promise<boolean> => {
  return retryOperation(async () => {
    const collection = await getQRCodesCollection();
    
    const result = await collection.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      console.warn(`No QR code found with ID: ${id}`);
      return false;
    }
    
    console.log(`Deleted QR code ${id} from MongoDB`);
    
    // Delete from cache
    delete qrCodeCache[id];
    
    // Invalidate the all QR codes cache
    allQRCodesCache = null;
    
    return true;
  });
};

// Clear cache function to force refresh data
export const clearCache = () => {
  qrCodeCache = {};
  allQRCodesCache = null;
  allQRCodesCacheTimestamp = 0;
  console.log('QR code cache cleared');
};

// Dummy function to satisfy imports in other files
export const syncPendingQRCodes = async (): Promise<number> => {
  console.log('MongoDB mode enabled, no syncing needed');
  return Promise.resolve(0);
};
