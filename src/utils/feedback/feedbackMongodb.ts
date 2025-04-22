import { getDb } from '../mongodb/config';
import { Feedback } from '../sentimentUtils';
import { toast } from 'sonner';

// Constants
const FEEDBACK_COLLECTION = 'feedback';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// Helper function to convert MongoDB _id to string id
const convertMongoDocToFeedback = (doc: any): Feedback => {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest
  } as Feedback;
};

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

// Get feedback collection reference
const getFeedbackCollection = async () => {
  const db = await getDb();
  return db.collection(FEEDBACK_COLLECTION);
};

export const saveFeedbackToMongoDB = async (feedback: Omit<Feedback, 'id' | 'createdAt'> & { sentiment: 'positive' | 'neutral' | 'negative' }): Promise<Feedback> => {
  return retryOperation(async () => {
    const feedbackWithTimestamp = {
      ...feedback,
      createdAt: new Date().toISOString(),
      timestamp: new Date() // Using timestamp for sorting
    };
    
    const collection = await getFeedbackCollection();
    const result = await collection.insertOne(feedbackWithTimestamp);
    console.log('Feedback saved to MongoDB with ID:', result.insertedId);
    
    // Return the saved feedback with proper id
    const savedFeedback: Feedback = {
      id: result.insertedId.toString(),
      qrCodeId: feedbackWithTimestamp.qrCodeId,
      sentiment: feedbackWithTimestamp.sentiment,
      createdAt: feedbackWithTimestamp.createdAt,
      message: feedbackWithTimestamp.message || '',
      rating: feedbackWithTimestamp.rating,
      comment: feedbackWithTimestamp.comment,
      context: feedbackWithTimestamp.context
    };
    
    return savedFeedback;
  });
};

export const getFeedbackFromMongoDB = async (id: string): Promise<Feedback | null> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      const result = await collection.findOne({ _id: new ObjectId(id) });
      
      if (result) {
        return convertMongoDocToFeedback(result);
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
    const cursor = collection.find().sort({ timestamp: -1 }).limit(100);
    
    const results = await cursor.toArray();
    console.log(`Retrieved ${results.length} feedback items from MongoDB`);
    
    return results.map(convertMongoDocToFeedback);
  });
};

export const getFeedbackByQRCodeId = async (qrCodeId: string): Promise<Feedback[]> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    const cursor = collection.find({ qrCodeId }).sort({ timestamp: -1 }).limit(50);
    
    const results = await cursor.toArray();
    console.log(`Retrieved ${results.length} feedback items for QR code ID: ${qrCodeId}`);
    
    return results.map(convertMongoDocToFeedback);
  });
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  return retryOperation(async () => {
    const collection = await getFeedbackCollection();
    
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount > 0) {
        console.log('Feedback deleted from MongoDB:', id);
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
      console.log('All feedback deleted from MongoDB');
      return true;
    } catch (error) {
      console.error('Error in deleteAllFeedbackFromMongoDB:', error);
      return false;
    }
  });
};
