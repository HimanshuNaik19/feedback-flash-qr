
import { 
  saveFeedbackToMongoDB, 
  getAllFeedbackFromMongoDB, 
  deleteFeedbackFromMongoDB, 
  deleteAllFeedbackFromMongoDB, 
  getFeedbackByQRCodeId
} from './feedback/feedbackMongodb';

export interface Feedback {
  id: string;
  qrCodeId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  sentiment: 'negative' | 'neutral' | 'positive';
  createdAt: string;
  message: string;
  context: string;
  customAnswers?: { questionId: string; answer: string }[];
}

// Helper function to get emoji for rating
export const getRatingEmoji = (rating: number): string => {
  switch (rating) {
    case 1: return '😡';
    case 2: return '🙁';
    case 3: return '😐';
    case 4: return '🙂';
    case 5: return '😄';
    default: return '❓';
  }
};

// Function to analyze sentiment based on rating
export const analyzeSentiment = (rating: number): 'negative' | 'neutral' | 'positive' => {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
};

// Function to get sentiment color for UI
export const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'text-green-500';
    case 'negative': return 'text-red-500';
    case 'neutral': return 'text-amber-500';
    default: return 'text-gray-500';
  }
};

// Function to get background color for sentiment
export const getSentimentBgColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive': return 'bg-green-50 border-green-200';
    case 'negative': return 'bg-red-50 border-red-200';
    case 'neutral': return 'bg-amber-50 border-amber-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

// Function to get all feedback items
export const getAllFeedback = async (): Promise<Feedback[]> => {
  try {
    const data = await getAllFeedbackFromMongoDB();
    return data;
  } catch (error) {
    console.error('Error in getAllFeedback:', error);
    return [];
  }
};

// Update deleteFeedback to use MongoDB - renamed to avoid conflicts
export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    return await deleteFeedbackFromMongoDB(id);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
};

// Function to delete all feedback
export const deleteAllFeedback = async (): Promise<boolean> => {
  try {
    return await deleteAllFeedbackFromMongoDB();
  } catch (error) {
    console.error('Error in deleteAllFeedback:', error);
    return false;
  }
};
