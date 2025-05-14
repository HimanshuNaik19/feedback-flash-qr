
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../mongodb/config';
import { Feedback } from '../sentimentUtils';
import { toast } from 'sonner';

// Constants
const FEEDBACK_COLLECTION = 'feedback';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Helper function to convert DB doc to Feedback
const convertDocToFeedback = (doc: any): Feedback => {
  return {
    id: doc.id,
    qrCodeId: doc.qrCodeId,
    name: doc.name,
    phoneNumber: doc.phoneNumber,
    email: doc.email,
    sentiment: doc.sentiment,
    createdAt: doc.createdAt,
    message: doc.message || '',
    rating: doc.rating,
    comment: doc.comment,
    context: doc.context,
    customAnswers: doc.customAnswers
  } as Feedback;
};

// Helper function to retry an operation
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

// Get feedback collection reference
const getFeedbackCollection = async () => {
  const db = await getDb();
  return db.collection(FEEDBACK_COLLECTION);
};

export const saveFeedbackToMongoDB = async (feedback: Omit<Feedback, 'id' | 'createdAt'> & { sentiment: 'positive' | 'neutral' | 'negative' }): Promise<Feedback> => {
  return retryOperation(async () => {
    // Generate an ID for MySQL
    const feedbackId = uuidv4();
    
    const feedbackWithTimestamp = {
      id: feedbackId,
      ...feedback,
      createdAt: new Date().toISOString()
    };
    
    const collection = await getFeedbackCollection();
    const result = await collection.insertOne(feedbackWithTimestamp);
    console.log('Feedback saved to MySQL with ID:', feedbackId);
    
    // Return the saved feedback with proper id and all required fields
    const savedFeedback: Feedback = {
      id: feedbackId,
      qrCodeId: feedbackWithTimestamp.qrCodeId,
      name: feedbackWithTimestamp.name,
      phoneNumber: feedbackWithTimestamp.phoneNumber,
      email: feedbackWithTimestamp.email,
      sentiment: feedbackWithTimestamp.sentiment,
      createdAt: feedbackWithTimestamp.createdAt,
      message: feedbackWithTimestamp.message || '',
      rating: feedbackWithTimestamp.rating,
      comment: feedbackWithTimestamp.comment,
      context: feedbackWithTimestamp.context,
      customAnswers: feedbackWithTimestamp.customAnswers
    };
    
    return savedFeedback;
  });
};

export const getFeedbackFromMongoDB = async (id: string): Promise<Feedback | null> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      // Search by id
      const result = await collection.findOne({ id: id });
      
      if (result) {
        return convertDocToFeedback(result);
      }
      return null;
    } catch (error) {
      console.error('Error in getFeedbackFromMongoDB:', error);
      return null;
    }
  });
};

export const getAllFeedbackFromMongoDB = async (): Promise<Feedback[]> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    const cursor = collection.find().sort().limit(100);
    
    const results = await cursor.toArray();
    console.log(`Retrieved ${results.length} feedback items from MySQL`);
    
    return results.map(convertDocToFeedback);
  });
};

export const getFeedbackByQRCodeId = async (qrCodeId: string): Promise<Feedback[]> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    const cursor = collection.find({ qrCodeId }).sort().limit(50);
    
    const results = await cursor.toArray();
    console.log(`Retrieved ${results.length} feedback items for QR code ID: ${qrCodeId}`);
    
    return results.map(convertDocToFeedback);
  });
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      const result = await collection.deleteOne({ id: id });
      
      if (result.deletedCount > 0) {
        console.log('Feedback deleted from MySQL:', id);
        return true;
      }
      
      console.warn(`No feedback found with ID: ${id}`);
      return false;
    } catch (error) {
      console.error('Error in deleteFeedback:', error);
      return false;
    }
  });
};

export const deleteFeedbackByQRCodeId = async (qrCodeId: string): Promise<boolean> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      const result = await collection.deleteMany({ qrCodeId });
      console.log(`Deleted ${result.deletedCount} feedback items for QR code ID: ${qrCodeId}`);
      return true;
    } catch (error) {
      console.error('Error in deleteFeedbackByQRCodeId:', error);
      return false;
    }
  });
};

export const deleteAllFeedbackFromMongoDB = async (): Promise<boolean> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      await collection.deleteMany({});
      console.log('All feedback deleted from MySQL');
      return true;
    } catch (error) {
      console.error('Error in deleteAllFeedbackFromMongoDB:', error);
      return false;
    }
  });
};
