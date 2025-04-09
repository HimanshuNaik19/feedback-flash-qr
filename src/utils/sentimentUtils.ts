
export type SentimentType = 'positive' | 'neutral' | 'negative';

export type Feedback = {
  id: string;
  qrCodeId: string;
  rating: number; // 1-5
  comment: string;
  sentiment: SentimentType;
  createdAt: string;
  context: string;
};

// Basic sentiment analysis using keywords (in a real app, use NLP APIs)
export const analyzeSentiment = (text: string): SentimentType => {
  const positiveWords = [
    'good', 'great', 'excellent', 'awesome', 'amazing', 'love', 'enjoy',
    'fantastic', 'happy', 'best', 'perfect', 'recommend', 'satisfied', 'helpful'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'hate', 'dislike',
    'worst', 'disappointed', 'slow', 'expensive', 'rude', 'dirty', 'broken'
  ];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Determine color based on sentiment
export const getSentimentColor = (sentiment: SentimentType): string => {
  switch (sentiment) {
    case 'positive': return 'bg-feedback-positive';
    case 'negative': return 'bg-feedback-negative';
    case 'neutral': return 'bg-feedback-neutral';
    default: return 'bg-gray-300';
  }
};

// Determine emoji based on rating
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

// Load saved feedback from localStorage
const loadStoredFeedback = (): Feedback[] => {
  try {
    const storedData = localStorage.getItem('feedback');
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading stored feedback:', error);
  }
  return [];
};

// Save feedback to localStorage
const saveFeedbackToStorage = (feedback: Feedback[]) => {
  try {
    localStorage.setItem('feedback', JSON.stringify(feedback));
    console.log('Feedback saved to storage, count:', feedback.length);
  } catch (error) {
    console.error('Error saving feedback to storage:', error);
  }
};

// Initialize feedback array from localStorage
let feedbackStore: Feedback[] = loadStoredFeedback();

export const storeFeedback = (feedback: Feedback): void => {
  console.log('Storing feedback:', feedback);
  // Always reload from localStorage first to ensure we have the latest data
  feedbackStore = loadStoredFeedback();
  feedbackStore.push(feedback);
  saveFeedbackToStorage(feedbackStore);
};

export const getFeedbackById = (id: string): Feedback | undefined => {
  // Always reload from localStorage first to ensure we have the latest data
  feedbackStore = loadStoredFeedback();
  return feedbackStore.find(f => f.id === id);
};

export const getFeedbackByQRCodeId = (qrCodeId: string): Feedback[] => {
  // Always reload from localStorage first to ensure we have the latest data
  feedbackStore = loadStoredFeedback();
  return feedbackStore.filter(f => f.qrCodeId === qrCodeId);
};

export const getAllFeedback = (): Feedback[] => {
  // Always reload from localStorage first to ensure we have the latest data
  feedbackStore = loadStoredFeedback();
  console.log('Getting all feedback, count:', feedbackStore.length);
  return [...feedbackStore];
};
