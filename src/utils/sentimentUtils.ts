
import { toast } from 'sonner';
import { getAllFeedbackFromStorage, deleteFeedbackByIdFromStorage, deleteAllFeedbackFromStorage } from './qrCode/storageUtils';

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
}

// Function to get all feedback from localStorage
export const getAllFeedback = (): Feedback[] => {
  try {
    // Use the storageUtils function to get all feedback but ensure it returns an array directly
    const storedFeedback = localStorage.getItem('feedback');
    return storedFeedback ? JSON.parse(storedFeedback) : [];
  } catch (error) {
    console.error('Error getting feedback from localStorage:', error);
    return [];
  }
};

// Delete all feedback (from localStorage)
export const deleteAllFeedback = async (): Promise<boolean> => {
  try {
    // Use the storageUtils function to delete all feedback
    const success = await deleteAllFeedbackFromStorage();
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

// Update to directly use storageUtils
export const saveFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Promise<Feedback | null> => {
  try {
    // Add sentiment based on rating
    const sentiment = analyzeSentiment(feedback.rating as number);
    
    // Create the complete feedback object
    const feedbackWithSentiment = { 
      id: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      ...feedback,
      sentiment,
      createdAt: new Date().toISOString(),
      // Add empty message if not provided (for compatibility)
      message: feedback.message || feedback.comment || ''
    };
    
    // Store to localStorage
    const success = await import('./qrCode/storageUtils').then(module => 
      module.storeFeedbackToStorage(feedbackWithSentiment)
    );
    
    if (success) {
      return feedbackWithSentiment;
    }
    return null;
  } catch (error) {
    console.error('Error saving feedback:', error);
    toast.error('Failed to save feedback');
    return null;
  }
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    // Use the storageUtils function to delete feedback by id
    return await deleteFeedbackByIdFromStorage(id);
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
