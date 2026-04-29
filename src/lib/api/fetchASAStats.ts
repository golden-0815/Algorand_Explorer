import { EvaluatedAccount } from '../../types/asastats';
import { retryWithBackoff, safeParseFloat, formatErrorMessage } from '../utils';

// Token management
const ACCESS_TOKEN = import.meta.env.VITE_ASA_STATS_TOKEN || 'hardcoded-fallback-token';

let currentAccessToken = ACCESS_TOKEN;

// Enhanced caching with localStorage persistence
const CACHE_KEY = 'asastats_cache';
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute - aligns with ASA Stats update frequency
const MAX_CACHE_SIZE = 50; // Maximum number of cached entries

interface CacheEntry {
  data: EvaluatedAccount;
  timestamp: number;
  address: string;
}

// Load cache from localStorage on startup
let cache = new Map<string, CacheEntry>();

// Initialize cache from localStorage
try {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    cache = new Map(Object.entries(parsed));
    
    // Clean expired entries
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
  }
} catch (error) {
  // If localStorage is corrupted, start fresh
  cache = new Map();
}

// Save cache to localStorage
function saveCacheToStorage(): void {
  try {
    const cacheObj = Object.fromEntries(cache);
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
  } catch (error) {
    // If localStorage is full, clear old entries
    const entries = Array.from(cache.entries());
    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Keep only the newest entries
    const toKeep = sorted.slice(-Math.floor(MAX_CACHE_SIZE * 0.8));
    cache = new Map(toKeep);
    
    try {
      const cacheObj = Object.fromEntries(cache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      // If still failing, clear cache entirely
      cache.clear();
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

// Simple input processing
function processAddress(address: string): string {
  return address.trim();
}

// Data validation function
function validateASAStatsResponse(data: any): EvaluatedAccount {
  // Ensure required arrays exist
  if (!data.asaitems) {
    console.warn('ASA Stats response missing asaitems array, initializing empty array');
    data.asaitems = [];
  }
  if (!data.nftcollections) {
    console.warn('ASA Stats response missing nftcollections array, initializing empty array');
    data.nftcollections = [];
  }
  if (!data.notevals) {
    console.warn('ASA Stats response missing notevals array, initializing empty array');
    data.notevals = [];
  }
  
  // Ensure total object exists
  if (!data.total) {
    console.warn('ASA Stats response missing total object, initializing default values');
    data.total = {
      algo: '0',
      asa: '0',
      nft: '0',
      total: '0',
      totalusdc: '0',
      priceusdc: '1',
      pricealgo: '1',
      noteval: 0,
      totalwonft: '0',
      totalwonftusdc: '0'
    };
  }
  
  // Ensure account_info exists
  if (!data.account_info) {
    console.warn('ASA Stats response missing account_info, initializing default values');
    data.account_info = {
      addresses: [],
      bundle: null,
      values_in: 'ALGO',
      online: null
    };
  }
  
  return data as EvaluatedAccount;
}

export async function fetchASAStats(
  address: string,
  useAuth: boolean = true
): Promise<EvaluatedAccount> {
  // Simple input processing
  const processedAddress = processAddress(address);
  
  // Check cache first
  const cacheKey = `${processedAddress}-${useAuth}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const performFetch = async (): Promise<EvaluatedAccount> => {
    try {
      // Use the Vite proxy to avoid CORS issues
      const url = `${import.meta.env.PROD ? 'https://gqquapapoxtuptuffryx.functions.supabase.co/asastats-proxy?address=' : '/api/asastats/'}${processedAddress}`;
      
      // For production (Edge Functions), send anon key as authorization header
      // For development (direct API calls), send ASA Stats token
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (import.meta.env.PROD) {
        // Send Supabase anon key for Edge Function authentication
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      } else if (useAuth) {
        // Send ASA Stats token for direct API calls in development
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
      }

      const response = await fetch(
        url,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`ASA Stats API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // Validate and normalize the response data
      const validatedResult = validateASAStatsResponse(result);
      // Cache the successful result
      cache.set(cacheKey, { data: validatedResult, timestamp: Date.now(), address: processedAddress });
      saveCacheToStorage();
      return validatedResult;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  };

  return retryWithBackoff(performFetch);
}

// Cache management utilities
export function clearASACache(): void {
  cache.clear();
  localStorage.removeItem(CACHE_KEY);
}

export function getASACacheStats(): { 
  entries: number; 
  oldestEntry: number | null; 
  newestEntry: number | null;
  cacheSize: string;
} {
  if (cache.size === 0) {
    return { entries: 0, oldestEntry: null, newestEntry: null, cacheSize: '0 B' };
  }

  const timestamps = Array.from(cache.values()).map(entry => entry.timestamp);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);

  // Calculate cache size
  try {
    const cacheObj = Object.fromEntries(cache);
    const cacheString = JSON.stringify(cacheObj);
    const sizeInBytes = new Blob([cacheString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    const cacheSize = `${sizeInKB} KB`;
    return { entries: cache.size, oldestEntry: oldest, newestEntry: newest, cacheSize };
  } catch {
    return { entries: cache.size, oldestEntry: oldest, newestEntry: newest, cacheSize: 'Unknown' };
  }
}

export function cleanupExpiredCache(): number {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    saveCacheToStorage();
  }
  
  return cleanedCount;
}