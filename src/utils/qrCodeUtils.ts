
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
  // If QR code is marked as inactive, it's invalid
  if (!qrCode.isActive) return false;
  
  // Parse expiration date from ISO string
  const now = new Date();
  const expiresAt = new Date(qrCode.expiresAt);
  
  // Debug information
  console.log('QR Code validation:', {
    now: now.toISOString(),
    expiresAt: qrCode.expiresAt,
    timeRemaining: (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60) + ' hours',
    maxScans: qrCode.maxScans,
    currentScans: qrCode.currentScans
  });
  
  // Check if expired
  if (now > expiresAt) {
    console.log('QR Code expired');
    return false;
  }
  
  // Check if max scans reached
  if (qrCode.currentScans >= qrCode.maxScans) {
    console.log('QR Code max scans reached');
    return false;
  }
  
  return true;
};

export const getQRCodeUrl = (baseUrl: string, qrCodeId: string): string => {
  return `${baseUrl}/feedback/${qrCodeId}`;
};

// Load stored QR codes from localStorage
const loadStoredQRCodes = (): Record<string, QRCodeContext> => {
  try {
    const storedData = localStorage.getItem('qrCodes');
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error loading stored QR codes:', error);
  }
  return {};
};

// Save QR codes to localStorage
const saveQRCodesToStorage = (qrCodes: Record<string, QRCodeContext>) => {
  try {
    localStorage.setItem('qrCodes', JSON.stringify(qrCodes));
  } catch (error) {
    console.error('Error saving QR codes to storage:', error);
  }
};

// Initialize stored QR codes from localStorage
let storedQRCodes: Record<string, QRCodeContext> = loadStoredQRCodes();

export const storeQRCode = (qrCode: QRCodeContext): void => {
  // Add logging to debug storage
  console.log('Storing QR code:', qrCode);
  storedQRCodes[qrCode.id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  console.log('Current stored QR codes:', Object.keys(storedQRCodes));
};

export const getQRCode = (id: string): QRCodeContext | null => {
  // Reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  // Add logging to debug retrieval
  console.log('Retrieving QR code with ID:', id);
  const qrCode = storedQRCodes[id] || null;
  console.log('Retrieved QR code:', qrCode);
  return qrCode;
};

export const getAllQRCodes = (): QRCodeContext[] => {
  // Reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  return Object.values(storedQRCodes);
};

export const incrementScan = (id: string): QRCodeContext | null => {
  // Reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  const qrCode = storedQRCodes[id];
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  saveQRCodesToStorage(storedQRCodes);
  return qrCode;
};
