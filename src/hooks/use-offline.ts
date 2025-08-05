import { useState, useEffect } from 'react';
import { networkManager, offlineStorage } from '@/lib/offline-storage';

// Hook for online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(networkManager.getStatus());

  useEffect(() => {
    const unsubscribe = networkManager.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
};

// Hook for offline-capable operations
export const useOfflineCapableOperations = () => {
  const isOnline = useOnlineStatus();
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Initialize offline storage in background without blocking UI
    offlineStorage.init()
      .then(() => {
        setIsOfflineReady(true);
        console.log('Offline storage ready');
      })
      .catch(error => {
        console.error('Offline storage failed to initialize:', error);
        // Continue without offline storage
        setIsOfflineReady(false);
      });
  }, []);

  const storeOfflineTransaction = async (transaction: any) => {
    if (isOnline) {
      // Normal online operation
      return transaction;
    } else if (isOfflineReady) {
      // Store for later sync
      try {
        const offlineId = await offlineStorage.storeOfflineTransaction(transaction);
        return { ...transaction, id: offlineId, offline: true };
      } catch (error) {
        console.error('Failed to store offline transaction:', error);
        return { ...transaction, id: `local_${Date.now()}`, offline: true };
      }
    } else {
      // Fallback without offline storage
      return { ...transaction, id: `temp_${Date.now()}`, offline: true };
    }
  };

  const storeOfflineProduct = async (product: any, action: 'create' | 'update' | 'delete') => {
    if (isOnline) {
      return product;
    } else if (isOfflineReady) {
      try {
        await offlineStorage.storeOfflineProduct({ ...product, action });
        return { ...product, offline: true };
      } catch (error) {
        console.error('Failed to store offline product:', error);
        return { ...product, offline: true };
      }
    } else {
      return { ...product, offline: true };
    }
  };

  return {
    isOnline,
    isOfflineReady,
    storeOfflineTransaction,
    storeOfflineProduct
  };
};