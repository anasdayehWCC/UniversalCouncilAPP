/// <reference lib="webworker" />

/**
 * Universal Council App - Progressive Web App Service Worker
 * 
 * Features:
 * - Static asset caching with versioning
 * - Runtime API response caching with TTL
 * - Offline fallback page
 * - Background sync for offline operations
 * - Multiple caching strategies (cache-first, network-first, stale-while-revalidate)
 * - Cache warming for critical resources
 * - Request coalescing for duplicate requests
 * - Cache size management
 */

// ============================================================================
// Cache Configuration
// ============================================================================

/** Cache version - increment to invalidate all caches */
const CACHE_VERSION = 2;

/** Cache names */
const CACHE_NAMES = {
  static: `council-static-v${CACHE_VERSION}`,
  runtime: `council-runtime-v${CACHE_VERSION}`,
  api: `council-api-v${CACHE_VERSION}`,
  images: `council-images-v${CACHE_VERSION}`,
  fonts: `council-fonts-v${CACHE_VERSION}`,
};

/** All cache names for cleanup */
const ALL_CACHES = Object.values(CACHE_NAMES);

/** Offline fallback URL */
const OFFLINE_URL = '/offline.html';

/** Maximum cache sizes per type */
const MAX_CACHE_SIZE = {
  api: 100,      // Number of API responses to cache
  images: 200,   // Number of images to cache
  runtime: 50,   // Number of runtime assets
};

/** TTL for different cache types (in milliseconds) */
const CACHE_TTL = {
  api: 5 * 60 * 1000,         // 5 minutes for API responses
  apiLong: 15 * 60 * 1000,    // 15 minutes for slow-changing API data
  static: 7 * 24 * 60 * 60 * 1000,  // 7 days for static assets
  images: 30 * 24 * 60 * 60 * 1000, // 30 days for images
};

/** Static assets to precache on install */
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-96x96.png',
];

/** API endpoints with longer cache TTL */
const LONG_CACHE_API_PATTERNS = [
  /\/api\/config\/.*/,
  /\/api\/templates\/.*/,
  /\/api\/modules\/.*/,
];

/** API endpoints to never cache */
const NO_CACHE_API_PATTERNS = [
  /\/api\/auth\/.*/,
  /\/api\/transcriptions\/.*\/upload/,
  /\/api\/health/,
];

/** Caching strategy patterns */
const CACHE_PATTERNS = {
  // Cache-first: static assets served from cache, update in background
  cacheFirst: [
    /\/_next\/static\/.*/,
    /\.(?:js|css)$/,
    /\/icons\/.*/,
  ],
  // Network-first: Fresh data preferred, cache as fallback
  networkFirst: [
    /\/api\/minutes\/.*/,
    /\/api\/transcriptions\/.*/,
    /\/api\/review\/.*/,
    /\/api\/insights\/.*/,
    /\/_next\/data\/.*/,
  ],
  // Stale-while-revalidate: Serve cache immediately, update in background
  staleWhileRevalidate: [
    /\/api\/config\/.*/,
    /\/api\/templates\/.*/,
    /\/api\/users\/me/,
    /^\/(?!api|_next|icons)[^.]*$/,  // Pages without extensions
  ],
  // Cache-only: Never fetch from network (for offline-only resources)
  cacheOnly: [],
  // Network-only: Never cache (for sensitive/real-time data)
  networkOnly: [
    /\/api\/auth\/.*/,
    /\/api\/push\/.*/,
  ],
  // Images: Long-lived cache with lazy loading
  images: [
    /\.(?:png|jpg|jpeg|gif|webp|avif|svg)$/,
  ],
  // Fonts: Very long-lived cache
  fonts: [
    /\.(?:woff2?|ttf|otf|eot)$/,
  ],
};

// ============================================================================
// Request Coalescing (prevent duplicate fetches)
// ============================================================================

/** Map of pending requests for deduplication */
const pendingRequests = new Map();

// ============================================================================
// Install Event
// ============================================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Open static cache
      const staticCache = await caches.open(CACHE_NAMES.static);
      
      // Precache static assets
      await staticCache.addAll(PRECACHE_ASSETS);
      
      // Skip waiting to activate immediately
      await self.skipWaiting();
      
      console.log(`[SW] Installed v${CACHE_VERSION}, precached ${PRECACHE_ASSETS.length} assets`);
    })()
  );
});

// ============================================================================
// Activate Event
// ============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Get all existing cache names
      const cacheNames = await caches.keys();
      
      // Delete old caches that don't match current version
      await Promise.all(
        cacheNames
          .filter((name) => !ALL_CACHES.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      
      // Claim all clients immediately
      await self.clients.claim();
      
      // Clean up expired entries in API cache
      await cleanupExpiredEntries();
      
      console.log(`[SW] Activated v${CACHE_VERSION}, claimed clients`);
    })()
  );
});

// ============================================================================
// Fetch Event
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests and development resources
  if (url.pathname.startsWith('/_') && !url.pathname.startsWith('/_next')) {
    return;
  }
  
  // Determine caching strategy based on request type
  const strategy = getStrategy(request, url);
  
  event.respondWith(handleRequest(request, strategy, url));
});

/**
 * Main request handler that routes to appropriate strategy
 */
async function handleRequest(request, strategy, url) {
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request, url);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request, url);
      case 'cache-only':
        return await cacheOnly(request);
      case 'network-only':
        return await fetch(request);
      case 'images':
        return await imageCache(request);
      case 'fonts':
        return await fontCache(request);
      default:
        return await networkFirst(request, url);
    }
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAMES.static);
      const offlinePage = await cache.match(OFFLINE_URL);
      if (offlinePage) return offlinePage;
    }
    
    // Return error response
    return new Response(JSON.stringify({ 
      error: 'Network unavailable',
      offline: true,
      timestamp: Date.now(),
    }), { 
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

// ============================================================================
// Push Notifications
// ============================================================================

// Notification type icons (emoji fallback for badge)
const NOTIFICATION_BADGES = {
  approval_needed: '⚠️',
  minute_approved: '✅',
  minute_rejected: '❌',
  assignment: '👤',
  mention: '@',
  reminder: '⏰',
  comment: '💬',
  export_ready: '📥',
  system: '🔔',
};

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[SW] Push event with no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
    data = { title: 'New Notification', body: event.data.text() };
  }
  
  const notificationType = data.type || 'system';
  const badge = NOTIFICATION_BADGES[notificationType] || '🔔';
  
  // Build notification options
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag || data.id || `notification-${Date.now()}`,
    data: {
      id: data.id,
      type: notificationType,
      url: data.data?.url || data.url || '/',
      entityId: data.data?.entityId,
      entityType: data.data?.entityType,
      timestamp: data.createdAt || new Date().toISOString(),
    },
    // Notification behavior
    requireInteraction: data.priority === 'high' || data.priority === 'urgent',
    silent: data.silent || false,
    renotify: true,
    // Vibration pattern: [vibrate, pause, vibrate]
    vibrate: data.priority === 'urgent' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    // Actions based on notification type
    actions: data.actions || getDefaultActions(notificationType, data),
    // Timestamp for ordering
    timestamp: new Date(data.createdAt || Date.now()).getTime(),
  };
  
  console.log('[SW] Showing notification:', data.title, options);
  
  event.waitUntil(
    Promise.all([
      // Show the notification
      self.registration.showNotification(data.title || 'Council Minutes', options),
      // Notify open clients about the new notification
      notifyClients({
        type: 'notification:new',
        payload: {
          id: data.id,
          type: notificationType,
          title: data.title,
          body: data.body,
          data: data.data,
          read: false,
          createdAt: data.createdAt || new Date().toISOString(),
          priority: data.priority || 'normal',
          dismissible: true,
        },
        timestamp: new Date().toISOString(),
      }),
    ])
  );
});

// Generate default actions based on notification type
function getDefaultActions(type, data) {
  switch (type) {
    case 'approval_needed':
      return [
        { action: 'view', title: 'Review' },
        { action: 'dismiss', title: 'Later' },
      ];
    case 'assignment':
      return [
        { action: 'view', title: 'View Case' },
      ];
    case 'minute_approved':
    case 'minute_rejected':
      return [
        { action: 'view', title: 'View Details' },
      ];
    case 'mention':
    case 'comment':
      return [
        { action: 'view', title: 'View' },
        { action: 'reply', title: 'Reply' },
      ];
    case 'export_ready':
      return [
        { action: 'download', title: 'Download' },
      ];
    default:
      return [
        { action: 'view', title: 'View' },
      ];
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  console.log('[SW] Notification clicked:', { action, data });
  
  notification.close();
  
  // Determine URL based on action
  let urlToOpen = data.url || '/';
  
  if (action === 'dismiss') {
    // Just close the notification, don't navigate
    return;
  }
  
  if (action === 'download' && data.entityType === 'export') {
    urlToOpen = `/exports/${data.entityId}`;
  } else if (action === 'reply' && data.entityId) {
    urlToOpen = `${data.url || '/'}#reply`;
  }
  
  event.waitUntil(
    (async () => {
      // Mark as read via API (if we have the notification ID)
      if (data.id) {
        try {
          // We can't easily make authenticated requests from SW,
          // so we'll notify the client to handle it
          await notifyClients({
            type: 'notification:read',
            payload: { id: data.id },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('[SW] Error marking notification as read:', error);
        }
      }
      
      // Find an existing window or open a new one
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      
      // Try to find and focus an existing window
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === location.origin) {
          // Navigate the existing window and focus it
          await client.navigate(urlToOpen);
          await client.focus();
          return;
        }
      }
      
      // Open a new window if none exists
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Notification close handler (user dismissed)
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data || {};
  console.log('[SW] Notification dismissed:', data.id);
  
  // Could track dismissals for analytics
});

// Helper: Notify all open clients about events
async function notifyClients(message) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_NOTIFICATION_STATUS':
      event.ports[0]?.postMessage({
        permission: Notification.permission,
      });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((n) => n.close());
      });
      break;
      
    case 'CLEAR_NOTIFICATION':
      if (payload?.tag) {
        self.registration.getNotifications({ tag: payload.tag }).then((notifications) => {
          notifications.forEach((n) => n.close());
        });
      }
      break;
      
    case 'CACHE_WARM':
      // Warm cache with provided URLs
      if (payload?.urls && Array.isArray(payload.urls)) {
        warmCache(payload.urls);
      }
      break;
      
    case 'CACHE_CLEAR':
      // Clear specific cache or all
      if (payload?.cacheName) {
        caches.delete(payload.cacheName);
      } else {
        caches.keys().then((names) => {
          Promise.all(names.map((name) => caches.delete(name)));
        });
      }
      break;
      
    case 'CACHE_INVALIDATE':
      // Invalidate by pattern
      if (payload?.pattern) {
        invalidateByPattern(new RegExp(payload.pattern));
      }
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0]?.postMessage(stats);
      });
      break;
  }
});

// ============================================================================
// Strategy Determination
// ============================================================================

/**
 * Determine caching strategy based on request URL and type
 */
function getStrategy(request, url) {
  const pathname = url.pathname;
  
  // Check network-only patterns first (auth, push, etc.)
  for (const pattern of CACHE_PATTERNS.networkOnly) {
    if (pattern.test(pathname)) return 'network-only';
  }
  
  // Check if should never cache certain API endpoints
  for (const pattern of NO_CACHE_API_PATTERNS) {
    if (pattern.test(pathname)) return 'network-only';
  }
  
  // Check font patterns (very long cache)
  for (const pattern of CACHE_PATTERNS.fonts) {
    if (pattern.test(pathname)) return 'fonts';
  }
  
  // Check image patterns (long cache)
  for (const pattern of CACHE_PATTERNS.images) {
    if (pattern.test(pathname)) return 'images';
  }
  
  // Check cache-first patterns
  for (const pattern of CACHE_PATTERNS.cacheFirst) {
    if (pattern.test(pathname)) return 'cache-first';
  }
  
  // Check stale-while-revalidate patterns
  for (const pattern of CACHE_PATTERNS.staleWhileRevalidate) {
    if (pattern.test(pathname)) return 'stale-while-revalidate';
  }
  
  // Check network-first patterns
  for (const pattern of CACHE_PATTERNS.networkFirst) {
    if (pattern.test(pathname)) return 'network-first';
  }
  
  // Default to network-first for unknown patterns
  return 'network-first';
}

// ============================================================================
// Caching Strategy Implementations
// ============================================================================

/**
 * Cache-first strategy: Serve from cache, fallback to network
 * Best for: Static assets that rarely change
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background for next time
    updateCacheInBackground(request, cache);
    return cached;
  }
  
  // Not in cache, fetch from network
  const response = await coalescedFetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Network-first strategy: Try network, fallback to cache
 * Best for: API data that should be fresh
 */
async function networkFirst(request, url) {
  const cacheName = url.pathname.startsWith('/api') ? CACHE_NAMES.api : CACHE_NAMES.runtime;
  const cache = await caches.open(cacheName);
  
  try {
    const response = await coalescedFetch(request);
    
    if (response.ok) {
      // Clone and add metadata before caching
      const responseToCache = await addCacheMetadata(response.clone());
      cache.put(request, responseToCache);
      
      // Limit cache size
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.api);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    
    if (cached) {
      // Add header indicating stale data
      const headers = new Headers(cached.headers);
      headers.set('X-SW-Cache-Status', 'stale');
      headers.set('X-SW-Cached-At', cached.headers.get('X-SW-Cached-At') || 'unknown');
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    
    throw error;
  }
}

/**
 * Stale-while-revalidate: Return cache immediately, update in background
 * Best for: Data that can be slightly stale (config, user profile)
 */
async function staleWhileRevalidate(request, url) {
  const cacheName = url.pathname.startsWith('/api') ? CACHE_NAMES.api : CACHE_NAMES.runtime;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Revalidate in background
  const fetchPromise = coalescedFetch(request).then(async (response) => {
    if (response.ok) {
      const responseToCache = await addCacheMetadata(response.clone());
      cache.put(request, responseToCache);
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.api);
    }
    return response;
  }).catch((error) => {
    console.warn('[SW] SWR background fetch failed:', error);
    return null;
  });
  
  // Return cached response if available
  if (cached) {
    // Check if cached response is still valid (not expired)
    const isExpired = isCacheExpired(cached, url);
    
    if (!isExpired) {
      // Add cache status header
      const headers = new Headers(cached.headers);
      headers.set('X-SW-Cache-Status', 'hit');
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
  }
  
  // No valid cache, wait for network
  const response = await fetchPromise;
  if (response) return response;
  
  // If all else fails and we have stale cache, use it
  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set('X-SW-Cache-Status', 'stale');
    
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers,
    });
  }
  
  throw new Error('No cached response available');
}

/**
 * Cache-only strategy: Only serve from cache, never fetch
 */
async function cacheOnly(request) {
  const cache = await caches.open(CACHE_NAMES.static);
  const cached = await cache.match(request);
  
  if (!cached) {
    return new Response('Not found in cache', { status: 404 });
  }
  
  return cached;
}

/**
 * Image caching with long TTL
 */
async function imageCache(request) {
  const cache = await caches.open(CACHE_NAMES.images);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await coalescedFetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
    await limitCacheSize(CACHE_NAMES.images, MAX_CACHE_SIZE.images);
  }
  
  return response;
}

/**
 * Font caching with very long TTL
 */
async function fontCache(request) {
  const cache = await caches.open(CACHE_NAMES.fonts);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await coalescedFetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Coalesced fetch - prevents duplicate in-flight requests
 */
async function coalescedFetch(request) {
  const key = request.url;
  
  // Check if there's already a pending request
  if (pendingRequests.has(key)) {
    const response = await pendingRequests.get(key);
    return response.clone();
  }
  
  // Create new request and track it
  const fetchPromise = fetch(request).then((response) => {
    pendingRequests.delete(key);
    return response;
  }).catch((error) => {
    pendingRequests.delete(key);
    throw error;
  });
  
  pendingRequests.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Add metadata to cached response
 */
async function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('X-SW-Cached-At', Date.now().toString());
  headers.set('X-SW-Cache-Version', CACHE_VERSION.toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Check if cached response is expired
 */
function isCacheExpired(response, url) {
  const cachedAt = response.headers.get('X-SW-Cached-At');
  if (!cachedAt) return true;
  
  const age = Date.now() - parseInt(cachedAt, 10);
  
  // Check if this is a long-cache API endpoint
  for (const pattern of LONG_CACHE_API_PATTERNS) {
    if (pattern.test(url.pathname)) {
      return age > CACHE_TTL.apiLong;
    }
  }
  
  // Default API TTL
  if (url.pathname.startsWith('/api')) {
    return age > CACHE_TTL.api;
  }
  
  // Static assets have longer TTL
  return age > CACHE_TTL.static;
}

/**
 * Update cache in background without blocking
 */
function updateCacheInBackground(request, cache) {
  fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response);
    }
  }).catch(() => {
    // Ignore background update failures
  });
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length <= maxSize) return;
  
  // Get entries with their timestamps
  const entries = await Promise.all(
    keys.map(async (key) => {
      const response = await cache.match(key);
      const cachedAt = response?.headers.get('X-SW-Cached-At');
      return { key, cachedAt: cachedAt ? parseInt(cachedAt, 10) : 0 };
    })
  );
  
  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.cachedAt - b.cachedAt);
  
  // Remove oldest entries until we're under limit
  const toDelete = entries.slice(0, keys.length - maxSize);
  await Promise.all(toDelete.map(({ key }) => cache.delete(key)));
  
  console.log(`[SW] Removed ${toDelete.length} entries from ${cacheName}`);
}

/**
 * Clean up expired entries across all API caches
 */
async function cleanupExpiredEntries() {
  const cache = await caches.open(CACHE_NAMES.api);
  const keys = await cache.keys();
  let cleaned = 0;
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response && isCacheExpired(response, new URL(key.url))) {
      await cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[SW] Cleaned up ${cleaned} expired API cache entries`);
  }
}

/**
 * Warm cache with provided URLs
 */
async function warmCache(urls) {
  const cache = await caches.open(CACHE_NAMES.runtime);
  
  for (const url of urls) {
    try {
      const request = new Request(url);
      const response = await fetch(request);
      if (response.ok) {
        const responseToCache = await addCacheMetadata(response);
        await cache.put(request, responseToCache);
      }
    } catch (error) {
      console.warn(`[SW] Failed to warm cache for ${url}:`, error);
    }
  }
  
  console.log(`[SW] Warmed cache with ${urls.length} URLs`);
}

/**
 * Invalidate cache entries matching a pattern
 */
async function invalidateByPattern(pattern) {
  let invalidated = 0;
  
  for (const cacheName of ALL_CACHES) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const key of keys) {
      if (pattern.test(key.url)) {
        await cache.delete(key);
        invalidated++;
      }
    }
  }
  
  console.log(`[SW] Invalidated ${invalidated} entries matching ${pattern}`);
  return invalidated;
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const stats = {};
  
  for (const [name, cacheName] of Object.entries(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[name] = {
      count: keys.length,
      maxSize: MAX_CACHE_SIZE[name] || 'unlimited',
    };
  }
  
  return {
    version: CACHE_VERSION,
    caches: stats,
    timestamp: Date.now(),
  };
}

// ============================================================================
// Offline Sync Functions
// ============================================================================

/**
 * Sync offline data to server
 */
async function syncOfflineData() {
  console.log('[SW] Syncing offline data...');
  
  try {
    const db = await openDatabase();
    const offlineData = await getOfflineData(db);
    
    for (const item of offlineData) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.body),
        });
        
        if (response.ok) {
          await deleteOfflineData(db, item.id);
          console.log('[SW] Synced item:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    console.log('[SW] Offline sync complete');
  } catch (error) {
    console.error('[SW] Offline sync error:', error);
  }
}

/**
 * Sync recordings to server
 */
async function syncRecordings() {
  console.log('[SW] Syncing recordings...');
  
  try {
    const db = await openDatabase();
    // Implementation depends on how recordings are stored
    // This would iterate through offline-recordings store
    // and upload each to the server
    
    console.log('[SW] Recording sync complete');
  } catch (error) {
    console.error('[SW] Recording sync error:', error);
  }
}

// ============================================================================
// IndexedDB Helpers
// ============================================================================

/**
 * Open the offline database
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('council-minutes-offline', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offline-recordings')) {
        db.createObjectStore('offline-recordings', { keyPath: 'id', autoIncrement: true });
      }
      
      // Add cache metadata store for SW
      if (!db.objectStoreNames.contains('cache-meta')) {
        const store = db.createObjectStore('cache-meta', { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }
    };
  });
}

/**
 * Get all pending offline data
 */
function getOfflineData(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Delete synced offline data
 */
function deleteOfflineData(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-queue', 'readwrite');
    const store = tx.objectStore('offline-queue');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log(`[SW] Service worker v${CACHE_VERSION} loaded`);
