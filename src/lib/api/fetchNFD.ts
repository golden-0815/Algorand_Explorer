import { NFDResponse } from '../../types/nfd';
import { retryWithBackoff, formatErrorMessage } from '../utils';

// NFD API caching
const nfdCache = new Map<string, { data: NFDResponse | null; timestamp: number }>();
const nfdNameCache = new Map<string, { data: string | null; timestamp: number }>();
const NFD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (NFD data changes less frequently)

export async function fetchNFD(
  address: string,
  accessToken?: string
): Promise<NFDResponse | null> {
  // Check cache first
  const cacheKey = `nfd-${address}`;
  const cached = nfdCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < NFD_CACHE_DURATION) {
    return cached.data;
  }

  const performFetch = async (): Promise<NFDResponse | null> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `https://api.nf.domains/nfd/lookup?address=${address}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No NFD found for this address
      }
      throw new Error(`NFD API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
      const result = Object.keys(data).length > 0 ? data : null;
      
      // Cache the result
      nfdCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
  } catch (error) {
      // Cache null results for a shorter time to avoid repeated failed requests
      nfdCache.set(cacheKey, { data: null, timestamp: Date.now() - (NFD_CACHE_DURATION * 0.5) });
    return null;
  }
  };

  return retryWithBackoff(performFetch, 2, 1000); // Shorter retry for NFD
}

export async function resolveNFDName(
  nfdName: string,
  accessToken?: string
): Promise<string | null> {
  // Check cache first
  const cacheKey = `nfd-name-${nfdName}`;
  const cached = nfdNameCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < NFD_CACHE_DURATION) {
    return cached.data;
  }

  const performResolve = async (): Promise<string | null> => {
    try {
      // Clean the NFD name - ensure it ends with .algo and convert to lowercase
      const cleanName = nfdName.toLowerCase().endsWith('.algo') ? nfdName.toLowerCase() : `${nfdName.toLowerCase()}.algo`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `https://api.nf.domains/nfd/${cleanName}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // NFD not found
        }
        throw new Error(`NFD API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return the owner address if found
      const result = data && data.owner ? data.owner : null;
      
      // Cache the result
      nfdNameCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      // Cache null results for a shorter time
      nfdNameCache.set(cacheKey, { data: null, timestamp: Date.now() - (NFD_CACHE_DURATION * 0.5) });
      return null;
    }
  };

  return retryWithBackoff(performResolve, 2, 1000);
}

// Cache management utilities
export function clearNFDCache(): void {
  nfdCache.clear();
  nfdNameCache.clear();
}

export function getNFDCacheStats(): { nfdEntries: number; nfdNameEntries: number } {
  return {
    nfdEntries: nfdCache.size,
    nfdNameEntries: nfdNameCache.size
  };
}