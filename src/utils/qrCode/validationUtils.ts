
import type { QRCodeContext } from './types';

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
