
import { db } from './config';
import { enableNetwork, disableNetwork, waitForPendingWrites } from 'firebase/firestore';

// Network status monitoring and management
export type NetworkStatus = 'online' | 'offline' | 'syncing';

let isNetworkEnabled = true;
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
  
  try {
    // Check if there are pending writes
    await waitForPendingWrites(db);
    return 'online';
  } catch (error) {
    console.error('Error checking pending writes:', error);
    return 'syncing';
  }
};

// Toggle network connectivity (for testing or manually managing connections)
export const toggleNetworkConnectivity = async (enable: boolean): Promise<boolean> => {
  try {
    if (enable && !isNetworkEnabled) {
      await enableNetwork(db);
      isNetworkEnabled = true;
      console.log('Network connectivity enabled');
    } else if (!enable && isNetworkEnabled) {
      await disableNetwork(db);
      isNetworkEnabled = false;
      console.log('Network connectivity disabled');
    }
    return true;
  } catch (error) {
    console.error('Failed to toggle network connectivity:', error);
    return false;
  }
};

// Function to manually force resynchronization
export const forceSynchronization = async (): Promise<boolean> => {
  try {
    pendingSyncOperations++;
    
    // Temporarily disable and then re-enable the network to force a refresh
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
    await enableNetwork(db);
    
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
  window.addEventListener('online', () => {
    console.log('Browser went online, reconnecting to Firestore...');
    enableNetwork(db).catch(err => console.error('Error reconnecting to Firestore:', err));
  });
  
  window.addEventListener('offline', () => {
    console.log('Browser went offline, disabling Firestore network...');
    // Optionally, you can disable the network when offline to save resources
    // disableNetwork(db).catch(err => console.error('Error disabling Firestore network:', err));
  });
}
