import { getDb } from '../mongodb/config';
import type { QRCodeContext } from './types';
import { deleteFeedbackByQRCodeId } from '../feedback/feedbackMongodb';

// Collection reference
const QR_CODES_COLLECTION = 'qrCodes';

// Timeout promise for MongoDB operations
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

// Retry logic for MongoDB operations
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelayMs: number = 1500
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

// Get QR codes collection
const getQRCodesCollection = async () => {
  const db = await getDb();
  return db.collection(QR_CODES_COLLECTION);
};

// Helper to convert MongoDB documents to QRCodeContext
const convertMongoDocToQRCode = (doc: any): QRCodeContext => {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: doc.id || _id.toString() // Use existing id or convert _id
  } as QRCodeContext;
};

// QR Code Operations
export const storeQRCodeToMongoDB = async (qrCode: QRCodeContext): Promise<void> => {
  return withRetry(async () => {
    const qrCodeWithTimestamp = {
      ...qrCode,
      timestamp: new Date() // For sorting
    };
    
    const collection = await getQRCodesCollection();
    
    // Use the QRCode id as the document id for easier retrieval
    await withTimeout(collection.updateOne(
      { id: qrCode.id }, 
      { $set: qrCodeWithTimestamp },
      { upsert: true }
    ));
    
    console.log('QR code saved to MongoDB:', qrCode.id);
  });
};

export const getQRCodeFromMongoDB = async (id: string): Promise<QRCodeContext | null> => {
  return withRetry(async () => {
    const collection = await getQRCodesCollection();
    const qrCode = await withTimeout(collection.findOne({ id }));
    
    if (qrCode) {
      return convertMongoDocToQRCode(qrCode);
    }
    return null;
  });
};

export const getAllQRCodesFromMongoDB = async (): Promise<QRCodeContext[]> => {
  return withRetry(async () => {
    const collection = await getQRCodesCollection();
    const qrCodes = await withTimeout(collection.find({}).toArray());
    
    console.log(`Retrieved ${qrCodes.length} QR codes from MongoDB`);
    return qrCodes.map(convertMongoDocToQRCode);
  });
};

// Subscribe function using polling (MongoDB doesn't have built-in real-time updates)
export const subscribeToQRCodes = (callback: (qrCodes: QRCodeContext[]) => void): () => void => {
  const intervalId = setInterval(async () => {
    try {
      const qrCodes = await getAllQRCodesFromMongoDB();
      callback(qrCodes);
    } catch (error) {
      console.error('Error in QR codes polling:', error);
    }
  }, 5000); // Poll every 5 seconds
  
  // Return unsubscribe function
  return () => clearInterval(intervalId);
};

export const updateQRCodeInMongoDB = async (id: string, updates: Partial<QRCodeContext>): Promise<void> => {
  return withRetry(async () => {
    const collection = await getQRCodesCollection();
    
    // Add update timestamp
    const updatesWithTimestamp = {
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    await withTimeout(collection.updateOne(
      { id },
      { $set: updatesWithTimestamp }
    ));
    
    console.log('QR code updated in MongoDB:', id);
  });
};

export const deleteQRCodeFromMongoDB = async (id: string): Promise<boolean> => {
  return withRetry(async () => {
    try {
      const collection = await getQRCodesCollection();
      
      // Delete the QR code
      await collection.deleteOne({ id });
      
      // Delete associated feedback
      await deleteFeedbackByQRCodeId(id);
      
      console.log('QR code and associated feedback deleted from MongoDB:', id);
      return true;
    } catch (error) {
      console.error('Delete operation failure:', error);
      return false;
    }
  });
};
