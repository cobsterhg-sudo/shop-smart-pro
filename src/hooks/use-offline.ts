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

  const storeOfflineTransaction = async (transaction: any) => {
    if (isOnline) {
      // Normal online operation
      return transaction;
    } else {
      // Store for later sync
      const offlineId = await offlineStorage.storeOfflineTransaction(transaction);
      return { ...transaction, id: offlineId, offline: true };
    }
  };

  const storeOfflineProduct = async (product: any, action: 'create' | 'update' | 'delete') => {
    if (isOnline) {
      return product;
    } else {
      await offlineStorage.storeOfflineProduct({ ...product, action });
      return { ...product, offline: true };
    }
  };

  return {
    isOnline,
    storeOfflineTransaction,
    storeOfflineProduct
  };
};