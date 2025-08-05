// Offline storage management for BentaMate
interface OfflineTransaction {
  id: string;
  items: any[];
  total: number;
  amount_received: number;
  change_amount: number;
  user_id: string;
  timestamp: string;
  synced: boolean;
}

interface OfflineProduct {
  id: string;
  name: string;
  barcode: string;
  capital: number;
  selling: number;
  stock: number;
  category: string;
  description?: string;
  user_id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete';
  synced: boolean;
}

class OfflineStorageManager {
  private dbName = 'BentaMateOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create offline transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('timestamp', 'timestamp');
          transactionStore.createIndex('synced', 'synced');
        }

        // Create offline products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('timestamp', 'timestamp');
          productStore.createIndex('synced', 'synced');
        }

        // Create cached data store
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  // Store offline transaction
  async storeOfflineTransaction(transaction: Omit<OfflineTransaction, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    if (!this.db) await this.init();

    const offlineTransaction: OfflineTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction_db = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction_db.objectStore('transactions');
      const request = store.add(offlineTransaction);

      request.onsuccess = () => resolve(offlineTransaction.id);
      request.onerror = () => reject(request.error);
    });
  }

  // Store offline product action
  async storeOfflineProduct(product: Omit<OfflineProduct, 'timestamp' | 'synced'>): Promise<void> {
    if (!this.db) await this.init();

    const offlineProduct: OfflineProduct = {
      ...product,
      timestamp: new Date().toISOString(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const request = store.put(offlineProduct); // Use put to allow updates

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced transactions
  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get unsynced products
  async getUnsyncedProducts(): Promise<OfflineProduct[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Mark transaction as synced
  async markTransactionSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Already removed or doesn't exist
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Mark product as synced
  async markProductSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['products'], 'readwrite');
      const store = transaction.objectStore('products');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Cache data for offline use
  async cacheData(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        key,
        data,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    if (!this.db) await this.init();

    const storeNames = ['transactions', 'products', 'cache'];
    
    return Promise.all(storeNames.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    })).then(() => {});
  }
}

// Global instance
export const offlineStorage = new OfflineStorageManager();

// Online/Offline detection
export class NetworkManager {
  private isOnline = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  private updateStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.listeners.forEach(listener => listener(isOnline));
    
    // Trigger background sync when coming back online
    if (isOnline && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Background sync is not universally supported, so we'll handle this differently
        console.log('Back online, checking for pending offline data...');
        // The service worker will handle this via the sync event
      }).catch(console.error);
    }
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const networkManager = new NetworkManager();