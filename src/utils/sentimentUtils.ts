
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

// Mock data store for feedback
const feedbackStore: Feedback[] = [];

export const storeFeedback = (feedback: Feedback): void => {
  feedbackStore.push(feedback);
};

export const getFeedbackById = (id: string): Feedback | undefined => {
  return feedbackStore.find(f => f.id === id);
};

export const getFeedbackByQRCodeId = (qrCodeId: string): Feedback[] => {
  return feedbackStore.filter(f => f.qrCodeId === qrCodeId);
};

export const getAllFeedback = (): Feedback[] => {
  return [...feedbackStore];
};
