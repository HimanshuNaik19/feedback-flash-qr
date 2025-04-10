
export type QRCodeContext = {
  id: string;
  context: string;
  createdAt: string;
  expiresAt: string;
  maxScans: number;
  currentScans: number;
  isActive: boolean;
};

// Use a consistent storage key prefix for all QR codes
export const STORAGE_KEY = 'qrCodes_v2';
