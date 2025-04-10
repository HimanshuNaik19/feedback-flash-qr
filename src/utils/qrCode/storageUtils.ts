
import { STORAGE_KEY } from './types';
import type { QRCodeContext } from './types';

// Enhanced localStorage compatibility for different browsers and contexts
export const getStorageData = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return null;
  }
};

export const setStorageData = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('Error writing to localStorage:', e);
    return false;
  }
};

// Create a test entry to verify localStorage works
export const testLocalStorage = (): boolean => {
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

// Load stored QR codes from localStorage with error handling
export const loadStoredQRCodes = (): Record<string, QRCodeContext> => {
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
export const saveQRCodesToStorage = (qrCodes: Record<string, QRCodeContext>) => {
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
