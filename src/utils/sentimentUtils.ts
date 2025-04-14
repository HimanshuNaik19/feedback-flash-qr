
import { toast } from 'sonner';
import { deleteAllFeedbackFromFirestore } from './feedback/feedbackFirestore';

export interface Feedback {
  id: string;
  qrCodeId: string;
  message: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
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
