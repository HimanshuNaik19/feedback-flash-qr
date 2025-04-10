
import { v4 as uuidv4 } from 'uuid';

// Define the types for analysis results
export type SentimentLabel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

export type Feedback = {
  id: string;
  qrCodeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  context: string;
  createdAt: string;
  sentiment: SentimentLabel;
};

// Keep existing local storage implementation for backup
const STORAGE_KEY = 'feedback_data';

export const loadStoredFeedback = (): Feedback[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading stored feedback:', error);
  }
  return [];
};

export const saveStoredFeedback = (feedback: Feedback[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback));
  } catch (error) {
    console.error('Error saving feedback to storage:', error);
  }
};

// Analyze sentiment based on rating
export const analyzeSentiment = (rating: 1 | 2 | 3 | 4 | 5): SentimentLabel => {
  switch (rating) {
    case 1: return 'very_negative';
    case 2: return 'negative';
    case 3: return 'neutral';
    case 4: return 'positive';
    case 5: return 'very_positive';
  }
};

// Save feedback to localStorage
export const saveFeedback = (feedbackData: Omit<Feedback, 'id' | 'createdAt' | 'sentiment'>): Feedback => {
  const sentiment = analyzeSentiment(feedbackData.rating);
  
  // Create a new feedback object with the sentiment analysis
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const newFeedback: Feedback = {
    id,
    ...feedbackData,
    createdAt,
    sentiment
  };
  
  // Save to localStorage
  const storedFeedback = loadStoredFeedback();
  storedFeedback.push(newFeedback);
  saveStoredFeedback(storedFeedback);
  
  return newFeedback;
};

// Get all feedback from localStorage
export const getAllFeedback = (): Feedback[] => {
  return loadStoredFeedback();
};

// Delete feedback from localStorage
export const deleteFeedback = (id: string): boolean => {
  const storedFeedback = loadStoredFeedback();
  const updatedFeedback = storedFeedback.filter(feedback => feedback.id !== id);
  
  if (updatedFeedback.length === storedFeedback.length) {
    return false; // No feedback was deleted
  }
  
  saveStoredFeedback(updatedFeedback);
  return true;
};

// Delete all feedback from localStorage (New function)
export const deleteAllFeedback = (): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error deleting all feedback:', error);
    return false;
  }
};

// Helper function to get emoji for rating
export const getRatingEmoji = (rating: number): string => {
  switch (rating) {
    case 1: return '😡';
    case 2: return '😕';
    case 3: return '😐';
    case 4: return '🙂';
    case 5: return '😄';
    default: return '❓';
  }
};

// Helper function to get color for sentiment (New function)
export const getSentimentColor = (sentiment: SentimentLabel | string): string => {
  switch (sentiment) {
    case 'very_positive':
    case 'positive':
      return 'bg-green-500';
    case 'neutral':
      return 'bg-amber-400';
    case 'negative':
    case 'very_negative':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};
