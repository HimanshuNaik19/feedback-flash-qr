
import { toast } from 'sonner';
import { deleteAllFeedbackFromMongoDB, deleteFeedback as deleteMongoDBFeedback } from './feedback/feedbackMongodb';

export interface Feedback {
  id: string;
  qrCodeId: string;
  comment?: string;     // Make comment optional
  rating?: number;      // User rating
  context?: string;     // Context of the feedback
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  message?: string;     // Make message optional since we're using comment instead
}

// Function to get all feedback from localStorage
export const getAllFeedback = (): Feedback[] => {
  try {
    const feedback = localStorage.getItem('feedback');
    return feedback ? JSON.parse(feedback) : [];
  } catch (error) {
    console.error('Error getting feedback from localStorage:', error);
    return [];
  }
};

// Delete all feedback (both from localStorage and MongoDB)
export const deleteAllFeedback = async (): Promise<boolean> => {
  try {
    // First try to delete from MongoDB
    const mongoDBSuccess = await deleteAllFeedbackFromMongoDB();
    
    // Then delete from localStorage
    localStorage.removeItem('feedback');
    
    return mongoDBSuccess;
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

// Update the type to make message optional
export const saveFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Promise<Feedback | null> => {
  try {
    // Add sentiment based on rating
    const sentiment = analyzeSentiment(feedback.rating as number);
    
    // Create a new object with the sentiment property
    const feedbackWithSentiment = { 
      ...feedback,
      // Add empty message if not provided (to satisfy the MongoDB expectations)
      message: feedback.message || feedback.comment || ''
    };
    
    // Save to MongoDB
    const mongoDBFeedback = await import('./feedback/feedbackMongodb').then(module => 
      module.saveFeedbackToMongoDB({ ...feedbackWithSentiment, sentiment })
    );
    
    return mongoDBFeedback;
  } catch (error) {
    console.error('Error saving feedback:', error);
    toast.error('Failed to save feedback');
    return null;
  }
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    return await deleteMongoDBFeedback(id);
  } catch (error) {
    console.error('Error deleting feedback:', error);
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
