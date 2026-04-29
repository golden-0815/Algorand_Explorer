// Cache management utilities for better performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    if (this.cache.size === 0) {
      return { size: 0, keys: [], oldestEntry: null, newestEntry: null };
    }

    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
    const oldest = Math.min(...timestamps);
    const newest = Math.max(...timestamps);

    return {
      size: this.cache.size,
      keys,
      oldestEntry: oldest,
      newestEntry: newest
    };
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Specialized caches
export const apiCache = new CacheManager();
export const imageCache = new CacheManager();
export const searchCache = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
  ASA_STATS: (address: string) => `asa-stats-${address}`,
  NFD_LOOKUP: (address: string) => `nfd-lookup-${address}`,
  NFD_RESOLVE: (name: string) => `nfd-resolve-${name}`,
  SEARCH_HISTORY: 'search-history',
  RECENT_SEARCHES: 'recent-searches',
  IMAGE_PRELOAD: (url: string) => `image-preload-${url}`,
} as const;

// Cache utilities
export function getCachedData<T>(key: string): T | null {
  return cacheManager.get<T>(key);
}

export function setCachedData<T>(key: string, data: T, ttl?: number): void {
  cacheManager.set(key, data, ttl);
}

export function clearAllCaches(): void {
  cacheManager.clear();
  apiCache.clear();
  imageCache.clear();
  searchCache.clear();
}

export function getCacheStats(): {
  global: ReturnType<typeof cacheManager.getStats>;
  api: ReturnType<typeof apiCache.getStats>;
  image: ReturnType<typeof imageCache.getStats>;
  search: ReturnType<typeof searchCache.getStats>;
} {
  return {
    global: cacheManager.getStats(),
    api: apiCache.getStats(),
    image: imageCache.getStats(),
    search: searchCache.getStats()
  };
}

// Auto-cleanup expired entries
setInterval(() => {
  cacheManager.cleanup();
  apiCache.cleanup();
  imageCache.cleanup();
  searchCache.cleanup();
}, 60000); // Clean up every minute 