
// Network status monitoring and management
export type NetworkStatus = 'online' | 'offline' | 'syncing';

let pendingSyncOperations = 0;

// Check if the browser has an internet connection
export const isBrowserOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Get the current synchronization status
export const getSynchronizationStatus = async (): Promise<NetworkStatus> => {
  if (!isBrowserOnline()) {
    return 'offline';
  }
  
  if (pendingSyncOperations > 0) {
    return 'syncing';
  }
  
  return 'online';
};

// Function to manually force resynchronization
export const forceSynchronization = async (): Promise<boolean> => {
  try {
    pendingSyncOperations++;
    
    // Clear local caches
    const { clearCache } = await import('../qrCode/qrCodeManager');
    clearCache();

    // Check for pending QR codes to sync
    const { syncPendingQRCodes } = await import('../qrCode/qrCodeManager');
    await syncPendingQRCodes();
    
    // Intentional delay to simulate backend sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    pendingSyncOperations--;
    return true;
  } catch (error) {
    pendingSyncOperations--;
    console.error('Failed to force synchronization:', error);
    return false;
  }
};

// Monitor online/offline status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('Browser went online');
    // Attempt to sync pending operations when coming back online
    try {
      const { syncPendingQRCodes } = await import('../qrCode/qrCodeManager');
      await syncPendingQRCodes();
    } catch (error) {
      console.error('Failed to sync pending operations:', error);
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser went offline');
  });
}
