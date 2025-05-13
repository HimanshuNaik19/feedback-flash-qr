
export type QRCodeContext = {
  id: string;
  context: string;
  createdAt: string;
  expiresAt: string;
  maxScans: number;
  currentScans: number;
  isActive: boolean;
  customQuestions?: CustomQuestion[]; // Add custom questions to QR code context
};

// Custom question types
export type CustomQuestion = {
  id: string;
  questionText: string;
  required: boolean;
  type: CustomQuestionType;
  options?: string[]; // For multiple choice questions
};

// Types of custom questions that can be added
export enum CustomQuestionType {
  TEXT = 'text',
  MULTIPLE_CHOICE = 'multiple_choice',
  YES_NO = 'yes_no',
  RATING = 'rating'
}

// Custom question answer type
export type CustomQuestionAnswer = {
  questionId: string;
  answer: string; // Store all answers as strings for simplicity
};

// Use a consistent storage key prefix for all QR codes
export const STORAGE_KEY = 'qrCodes_v2';
