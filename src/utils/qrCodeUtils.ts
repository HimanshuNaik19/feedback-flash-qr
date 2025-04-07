
import { v4 as uuidv4 } from 'uuid';

export type QRCodeContext = {
  id: string;
  context: string;
  createdAt: string;
  expiresAt: string;
  maxScans: number;
  currentScans: number;
  isActive: boolean;
};

export const generateQRCodeData = (
  context: string, 
  expiryHours: number = 24, 
  maxScans: number = 100
): QRCodeContext => {
  const id = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
  
  return {
    id,
    context,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    maxScans,
    currentScans: 0,
    isActive: true
  };
};

export const isQRCodeValid = (qrCode: QRCodeContext): boolean => {
  if (!qrCode.isActive) return false;
  
  const now = new Date();
  const expiresAt = new Date(qrCode.expiresAt);
  
  if (now > expiresAt) return false;
  if (qrCode.currentScans >= qrCode.maxScans) return false;
  
  return true;
};

export const getQRCodeUrl = (baseUrl: string, qrCodeId: string): string => {
  return `${baseUrl}/feedback/${qrCodeId}`;
};

// Mock function to simulate storing QR codes (would be replaced by actual API calls)
const storedQRCodes: Record<string, QRCodeContext> = {};

export const storeQRCode = (qrCode: QRCodeContext): void => {
  storedQRCodes[qrCode.id] = qrCode;
};

export const getQRCode = (id: string): QRCodeContext | null => {
  return storedQRCodes[id] || null;
};

export const getAllQRCodes = (): QRCodeContext[] => {
  return Object.values(storedQRCodes);
};

export const incrementScan = (id: string): QRCodeContext | null => {
  const qrCode = storedQRCodes[id];
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  return qrCode;
};
