
// Re-export everything from the utility files
export type { QRCodeContext } from './types';
export { STORAGE_KEY } from './types';
export { isQRCodeValid, getQRCodeUrl } from './validationUtils';
export { 
  generateQRCodeData,
  storeQRCode,
  getQRCode,
  getAllQRCodes,
  incrementScan,
  updateQRCode,
  deleteQRCode
} from './qrCodeManager';
