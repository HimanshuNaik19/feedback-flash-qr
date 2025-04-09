
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

// Enhanced sentiment analysis using both ratings and keywords
export const analyzeSentiment = (text: string, rating: number): SentimentType => {
  // First determine sentiment based on rating
  let ratingBasedSentiment: SentimentType = 'neutral';
  if (rating >= 4) ratingBasedSentiment = 'positive';
  else if (rating <= 2) ratingBasedSentiment = 'negative';
  
  // If no comment was provided, use rating-based sentiment only
  if (!text || text.trim() === '') {
    return ratingBasedSentiment;
  }
  
  // Expanded list of positive words
  const positiveWords = [
    'good', 'great', 'excellent', 'awesome', 'amazing', 'love', 'enjoy',
    'fantastic', 'happy', 'best', 'perfect', 'recommend', 'satisfied', 'helpful',
    'outstanding', 'superb', 'wonderful', 'delightful', 'pleasant', 'impressive',
    'exceptional', 'marvelous', 'brilliant', 'stellar', 'terrific', 'splendid',
    'first-rate', 'top-notch', 'superior', 'incredible', 'fabulous', 'flawless',
    'efficient', 'prompt', 'reliable', 'friendly', 'responsive', 'comfortable',
    'beautiful', 'convenient', 'clean', 'innovative', 'valuable', 'intuitive',
    'easy', 'smooth', 'fast', 'quick', 'inspiring', 'remarkable', 'impressive',
    'thankful', 'grateful', 'pleased', 'delighted', 'thrilled', 'excited', 'glad',
    'appreciative', 'refreshing', 'inviting', 'satisfying', 'appealing'
  ];
  
  // Expanded list of negative words
  const negativeWords = [
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'hate', 'dislike',
    'worst', 'disappointed', 'slow', 'expensive', 'rude', 'dirty', 'broken',
    'frustrating', 'annoying', 'unpleasant', 'mediocre', 'inadequate', 'faulty',
    'defective', 'subpar', 'useless', 'disappointing', 'dissatisfied', 'mess',
    'problem', 'issue', 'inconvenient', 'uncomfortable', 'unhelpful', 'difficult',
    'confusing', 'complicated', 'unreliable', 'buggy', 'glitchy', 'error',
    'failure', 'failed', 'lacking', 'missing', 'overpriced', 'waste', 'inefficient',
    'unsatisfactory', 'inferior', 'unacceptable', 'dreadful', 'pathetic', 'appalling',
    'atrocious', 'abysmal', 'lousy', 'shoddy', 'sloppy', 'worthless', 'regret',
    'bothered', 'upset', 'angry', 'furious', 'irritated', 'troubled', 'displeased',
    'unfortunate', 'unwanted', 'offensive', 'sketchy', 'questionable'
  ];
  
  // Expanded list of neutral words
  const neutralWords = [
    'okay', 'ok', 'fine', 'average', 'decent', 'satisfactory', 'fair',
    'adequate', 'acceptable', 'standard', 'normal', 'regular', 'ordinary',
    'moderate', 'mediocre', 'passable', 'tolerable', 'unexceptional',
    'so-so', 'neither', 'mixed', 'balanced', 'typical', 'common',
    'usual', 'expected', 'conventional', 'plain', 'vanilla', 'middle-of-the-road',
    'intermediate', 'run-of-the-mill'
  ];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  neutralWords.forEach(word => {
    if (lowerText.includes(word)) neutralCount++;
  });
  
  // Determine sentiment based on the word counts
  let textBasedSentiment: SentimentType = 'neutral';
  if (positiveCount > negativeCount) textBasedSentiment = 'positive';
  else if (negativeCount > positiveCount) textBasedSentiment = 'negative';
  
  // Combine rating-based and text-based sentiment
  // Give more weight to explicit text if there are significant keyword matches
  const significantTextMatches = positiveCount > 2 || negativeCount > 2;
  
  if (significantTextMatches) {
    return textBasedSentiment;
  } else {
    // Default to rating-based sentiment if text isn't strongly indicating otherwise
    return ratingBasedSentiment;
  }
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
