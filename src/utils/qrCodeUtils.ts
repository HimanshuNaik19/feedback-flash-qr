
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

// Use a consistent storage prefix for all QR codes
const STORAGE_KEY = 'qrCodes_v2';

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
  // Clean any trailing slashes from the baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Create a proper absolute URL
  let url = `${cleanBaseUrl}/feedback/${qrCodeId}`;
  
  // Make sure the URL is properly formatted
  try {
    // This will throw if the URL is invalid
    new URL(url);
  } catch (e) {
    console.error('Invalid URL generated:', url, e);
    // Fallback to a simpler approach if there's an issue
    url = window.location.origin + '/feedback/' + qrCodeId;
  }
  
  console.log('Generated QR code URL:', url);
  return url;
};

// Enhanced localStorage compatibility for different browsers and contexts
const getStorageData = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

const setStorageData = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('Error writing to localStorage:', e);
    return false;
  }
};

// Load stored QR codes from localStorage with error handling
const loadStoredQRCodes = (): Record<string, QRCodeContext> => {
  try {
    const storedData = getStorageData(STORAGE_KEY);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('Successfully loaded QR codes from storage:', Object.keys(parsed).length);
      return parsed;
    }
  } catch (error) {
    console.error('Error loading stored QR codes:', error);
    
    // Try to recover corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Removed potentially corrupted QR codes data');
    } catch (e) {
      console.error('Failed to remove corrupted data:', e);
    }
  }
  return {};
};

// Save QR codes to localStorage with enhanced error handling
const saveQRCodesToStorage = (qrCodes: Record<string, QRCodeContext>) => {
  try {
    const jsonString = JSON.stringify(qrCodes);
    setStorageData(STORAGE_KEY, jsonString);
    console.log('QR codes saved to storage:', {
      count: Object.keys(qrCodes).length,
      size: jsonString.length + ' bytes',
      storageKey: STORAGE_KEY
    });
    
    // Verify the save was successful
    const verification = getStorageData(STORAGE_KEY);
    if (!verification) {
      console.error('Verification failed: QR codes not found after saving');
    }
  } catch (error) {
    console.error('Error saving QR codes to storage:', error);
    
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.error('LocalStorage quota exceeded. Try removing old QR codes.');
    }
  }
};

// Create a test entry to verify localStorage works
const testLocalStorage = () => {
  try {
    const testKey = 'test-storage-' + Date.now();
    localStorage.setItem(testKey, 'test');
    const testValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return testValue === 'test';
  } catch (e) {
    console.error('LocalStorage test failed:', e);
    return false;
  }
};

// Run a test when the module loads
const localStorageAvailable = testLocalStorage();
console.log('LocalStorage availability test:', localStorageAvailable);

// Initialize stored QR codes from localStorage
let storedQRCodes: Record<string, QRCodeContext> = loadStoredQRCodes();

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

