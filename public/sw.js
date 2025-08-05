const CACHE_NAME = 'bentamate-v2';
const API_CACHE = 'bentamate-api-v1';
const OFFLINE_URL = '/';

// Assets to cache for offline use
const urlsToCache = [
  '/',
  '/auth',
  '/manifest.json',
  // Add common routes
  '/static/css/main.css',
  '/static/js/bundle.js',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[ServiceWorker] Caching app shell');
      await cache.addAll(urlsToCache);
      // Skip waiting to activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            await caches.delete(cacheName);
          }
        })
      );
      // Take control of all pages
      self.clients.claim();
    })()
  );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle other requests (CSS, JS, images)
  event.respondWith(handleResourceRequest(request));
});

// Strategy for API requests - Network First with Cache Fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Network unavailable',
        offline: true 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Strategy for navigation - Cache First with Network Fallback
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first for navigation
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return main app shell for offline navigation
    return cache.match(OFFLINE_URL);
  }
}

// Strategy for resources - Cache First
async function handleResourceRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Failed to fetch resource:', request.url);
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'offline-transactions') {
    event.waitUntil(syncOfflineTransactions());
  }
  
  if (event.tag === 'offline-products') {
    event.waitUntil(syncOfflineProducts());
  }
});

// Sync offline transactions when back online
async function syncOfflineTransactions() {
  try {
    // This would sync any stored offline transactions
    console.log('[ServiceWorker] Syncing offline transactions...');
    // Implementation would depend on your offline storage strategy
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync transactions:', error);
  }
}

// Sync offline products when back online
async function syncOfflineProducts() {
  try {
    console.log('[ServiceWorker] Syncing offline products...');
    // Implementation would depend on your offline storage strategy
  } catch (error) {
    console.error('[ServiceWorker] Failed to sync products:', error);
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});