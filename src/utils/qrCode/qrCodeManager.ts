
import { v4 as uuidv4 } from 'uuid';
import type { QRCodeContext } from './types';
import { loadStoredQRCodes, saveQRCodesToStorage, testLocalStorage } from './storageUtils';

// Run a test when the module loads
const localStorageAvailable = testLocalStorage();
console.log('LocalStorage availability test:', localStorageAvailable);

// Initialize stored QR codes from localStorage
let storedQRCodes: Record<string, QRCodeContext> = loadStoredQRCodes();

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

export const storeQRCode = (qrCode: QRCodeContext): void => {
  // Add logging to debug storage
  console.log('Storing QR code:', qrCode);
  storedQRCodes[qrCode.id] = qrCode;
  saveQRCodesToStorage(storedQRCodes);
  console.log('Current stored QR codes:', Object.keys(storedQRCodes));
  
  // Verify the QR code was stored
  const verification = getQRCode(qrCode.id);
  if (!verification) {
    console.error('Failed to verify QR code storage for ID:', qrCode.id);
  } else {
    console.log('Successfully verified QR code storage');
  }
};

export const getQRCode = (id: string): QRCodeContext | null => {
  // Always reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  console.log('Retrieving QR code with ID:', id);
  console.log('Available QR codes:', Object.keys(storedQRCodes));
  
  const qrCode = storedQRCodes[id] || null;
  console.log('Retrieved QR code:', qrCode);
  return qrCode;
};

export const getAllQRCodes = (): QRCodeContext[] => {
  // Always reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  return Object.values(storedQRCodes);
};

export const incrementScan = (id: string): QRCodeContext | null => {
  // Always reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  const qrCode = storedQRCodes[id];
  if (!qrCode) return null;
  
  qrCode.currentScans += 1;
  saveQRCodesToStorage(storedQRCodes);
  return qrCode;
};

export const updateQRCode = (id: string, updates: Partial<QRCodeContext>): QRCodeContext | null => {
  // Always reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  const qrCode = storedQRCodes[id];
  if (!qrCode) return null;
  
  // Update the QR code with the provided updates
  const updatedQRCode = { ...qrCode, ...updates };
  storedQRCodes[id] = updatedQRCode;
  saveQRCodesToStorage(storedQRCodes);
  
  return updatedQRCode;
};

export const deleteQRCode = (id: string): boolean => {
  // Always reload from localStorage to ensure we have the latest data
  storedQRCodes = loadStoredQRCodes();
  
  if (!storedQRCodes[id]) return false;
  
  delete storedQRCodes[id];
  saveQRCodesToStorage(storedQRCodes);
  
  return true;
};
