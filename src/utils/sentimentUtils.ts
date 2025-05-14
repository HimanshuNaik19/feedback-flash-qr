
import { toast } from 'sonner';
import { 
  saveFeedbackToMongoDB, 
  getAllFeedbackFromMongoDB, 
  deleteFeedback, 
  deleteAllFeedbackFromMongoDB, 
  getFeedbackByQRCodeId
} from './feedback/feedbackMongodb';
import { CustomQuestionAnswer } from './qrCode/types';

export interface Feedback {
  id: string;
  qrCodeId: string;
  name: string;          // Add name field
  phoneNumber: string;   // Add phone number field
  email?: string;        // Add optional email field
  comment: string;       // Comment is now required
  rating?: number;       // User rating
  context?: string;      // Context of the feedback
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  message?: string;     // Make message optional since we're using comment instead
  customAnswers?: CustomQuestionAnswer[]; // Add custom answers field
}

// Function to get all feedback from MongoDB
export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    return await getAllFeedbackFromMongoDB();
  } catch (error) {
    console.error('Error getting feedback from MongoDB:', error);
    toast.error('Failed to fetch feedback data');
    return [];
  }
};

// Delete all feedback (from MongoDB)
export const deleteAllFeedback = async (): Promise<boolean> => {
  try {
    const success = await deleteAllFeedbackFromMongoDB();
    if (success) {
      toast.success('All feedback deleted successfully');
    }
    return success;
  } catch (error) {
    console.error('Error deleting all feedback:', error);
    toast.error('An error occurred while deleting feedback');
    return false;
  }
};

// Add the missing functions that are needed by FeedbackForm.tsx and FeedbackList.tsx
export const analyzeSentiment = (rating: number): 'positive' | 'neutral' | 'negative' => {
  if (rating >= 4) return 'positive';
  if (rating >= 2) return 'neutral';
  return 'negative';
};

// Update to use MongoDB
export const saveFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Promise<Feedback | null> => {
  try {
    // Add sentiment based on rating
    const sentiment = analyzeSentiment(feedback.rating as number);
    
    // Create the complete feedback object
    const feedbackWithSentiment = { 
      ...feedback,
      sentiment,
      // Add empty message if not provided (for compatibility)
      message: feedback.message || feedback.comment || ''
    };
    
    // Store to MongoDB
    return await saveFeedbackToMongoDB(feedbackWithSentiment);
  } catch (error) {
    console.error('Error saving feedback:', error);
    toast.error('Failed to save feedback');
    return null;
  }
};

// Update deleteFeedback to use MongoDB
export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    return await deleteFeedback(id);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    toast.error('Failed to delete feedback');
    return false;
  }
};

export const getRatingEmoji = (rating?: number): string => {
  if (!rating) return '😐';
  
  switch (rating) {
    case 5: return '😁';
    case 4: return '🙂';
    case 3: return '😐';
    case 2: return '🙁';
    case 1: return '😞';
    default: return '😐';
  }
};

// Get appropriate color class for each sentiment
export const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-500';
    case 'neutral':
      return 'bg-amber-500';
    case 'negative':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
};
