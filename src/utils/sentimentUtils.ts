
// Adding feedback deletion functionality to sentimentUtils.ts

export interface Feedback {
  id: string;
  qrCodeId: string;
  context: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
}

const FEEDBACK_STORAGE_KEY = 'feedbackItems';

export const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-500';
    case 'neutral':
      return 'bg-blue-500';
    case 'negative':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getRatingEmoji = (rating: number): string => {
  switch (rating) {
    case 1: return '😠';
    case 2: return '😟';
    case 3: return '😐';
    case 4: return '🙂';
    case 5: return '😁';
    default: return '❓';
  }
};

export const analyzeSentiment = (rating: number): 'positive' | 'neutral' | 'negative' => {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
};

export const saveFeedback = (feedback: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Feedback => {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const sentiment = analyzeSentiment(feedback.rating);
  
  const newFeedback: Feedback = {
    id,
    createdAt,
    sentiment,
    ...feedback
  };
  
  // Get existing feedback
  const existingFeedback = getAllFeedback();
  const updatedFeedback = [...existingFeedback, newFeedback];
  
  // Save to localStorage
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedFeedback));
  
  return newFeedback;
};

export const getAllFeedback = (): Feedback[] => {
  try {
    const storedFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (storedFeedback) {
      const parsedFeedback = JSON.parse(storedFeedback);
      console.log('Getting all feedback, count:', parsedFeedback.length);
      return parsedFeedback;
    }
  } catch (error) {
    console.error('Error getting feedback from storage:', error);
  }
  return [];
};

export const deleteFeedback = (id: string): boolean => {
  try {
    const existingFeedback = getAllFeedback();
    const updatedFeedback = existingFeedback.filter(item => item.id !== id);
    
    // If no items were removed, return false
    if (updatedFeedback.length === existingFeedback.length) {
      return false;
    }
    
    // Save updated list to localStorage
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedFeedback));
    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
};

export const deleteAllFeedback = (): boolean => {
  try {
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting all feedback:', error);
    return false;
  }
};
