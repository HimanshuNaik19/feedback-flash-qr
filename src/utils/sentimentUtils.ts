
import { toast } from 'sonner';
import { deleteAllFeedbackFromFirestore, deleteFeedback as deleteFirestoreFeedback } from './feedback/feedbackFirestore';

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

// Delete all feedback (both from localStorage and Firestore)
export const deleteAllFeedback = async (): Promise<boolean> => {
  try {
    // First try to delete from Firestore
    const firestoreSuccess = await deleteAllFeedbackFromFirestore();
    
    // Then delete from localStorage
    localStorage.removeItem('feedback');
    
    return firestoreSuccess;
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
      // Add empty message if not provided (to satisfy the Firestore expectations)
      message: feedback.message || feedback.comment || ''
    };
    
    // Save to Firestore
    const firestoreFeedback = await import('./feedback/feedbackFirestore').then(module => 
      module.saveFeedbackToFirestore({ ...feedbackWithSentiment, sentiment })
    );
    
    return firestoreFeedback;
  } catch (error) {
    console.error('Error saving feedback:', error);
    toast.error('Failed to save feedback');
    return null;
  }
};

export const deleteFeedback = async (id: string): Promise<boolean> => {
  try {
    return await deleteFirestoreFeedback(id);
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
