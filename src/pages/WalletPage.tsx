import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchASAStats } from '../lib/api/fetchASAStats';
import { fetchNFD, resolveNFDName } from '../lib/api/fetchNFD';
import { fetchVestigeWalletValue } from '../lib/api/fetchVestige';
import { ProfileSummary } from '../components/ProfileSummary';
import { EvaluatedAccount } from '../types/asastats';
import { PortfolioAssetsCard } from '../components/PortfolioAssetsCard';
import { PortfolioTreemapCard } from '../components/PortfolioTreemapCard';
import { ProfileSummarySkeleton, TreemapSkeleton, AssetCardSkeleton } from '../components/ui/skeleton';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { usePortfolioBreakdown } from '../hooks/usePortfolioBreakdown';
import { useVestige } from '../contexts/VestigeContext';
import { AssetCacheAPI } from '../lib/api/assetCache';
import { validateAndSanitizeInput } from '../lib/utils';

// Debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Debounced asset cache function (moved outside component)
const debouncedCacheAssets = debounce(async (assetsToCache: any[]) => {
  // Use bulk upsert to minimize requests
  const insertedCount = await AssetCacheAPI.bulkInsertAssets(assetsToCache);
  console.log(`💾 Debounced: Bulk upserted ${insertedCount}/${assetsToCache.length} assets from Vestige`);
}, 500);

// Error categorization
type ErrorType = 'validation' | 'network' | 'server' | 'unknown';

interface ErrorInfo {
  message: string;
  type: ErrorType;
  retryable: boolean;
}

function categorizeError(error: string): ErrorInfo {
  const lowerError = error.toLowerCase();
  
  // Validation errors (not retryable)
  if (lowerError.includes('nfd name') && lowerError.includes('not found')) {
    return {
      message: error,
      type: 'validation',
      retryable: false
    };
  }
  
  if (lowerError.includes('invalid') || lowerError.includes('not found')) {
    return {
      message: error,
      type: 'validation',
      retryable: false
    };
  }
  
  // Network errors (retryable)
  if (lowerError.includes('network') || lowerError.includes('timeout') || lowerError.includes('fetch')) {
    return {
      message: error,
      type: 'network',
      retryable: true
    };
  }
  
  // Server errors (retryable)
  if (lowerError.includes('500') || lowerError.includes('502') || lowerError.includes('503') || lowerError.includes('504')) {
    return {
      message: error,
      type: 'server',
      retryable: true
    };
  }
  
  // Default to unknown but retryable
  return {
    message: error,
    type: 'unknown',
    retryable: true
  };
}

export function WalletPage() {
  const { id } = useParams<{ id: string }>();
  const address = id;
  const [data, setData] = useState<EvaluatedAccount | null>(null);
  const [nfdData, setNfdData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { setVestigeData } = useVestige();
  
  // Ref to prevent duplicate calls in React StrictMode
  const isFetchingRef = useRef(false);
  
  const MAX_RETRIES = 3;

  const fetchData = useCallback(async (walletAddress: string) => {
    if (!walletAddress || isFetchingRef.current) {
      return;
    }
    
    // Sanitize the input first
    const validation = validateAndSanitizeInput(walletAddress);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid input');
      setErrorInfo({
        message: validation.error || 'Invalid input',
        type: 'validation',
        retryable: false
      });
      setRetryCount(0); // Don't increment retry count for validation errors
      setLoading(false);
      return;
    }
    
    const sanitizedAddress = validation.sanitized;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError('');
    setErrorInfo(null);
    setData(null);
    setNfdData(null);
    setVestigeData(null);
    
    try {
      // Check if input looks like an NFD name (contains .algo or doesn't look like an Algorand address)
      const isNFDName = sanitizedAddress.includes('.algo') || 
                       (!sanitizedAddress.match(/^[A-Z2-7]{58}$/) && sanitizedAddress.length < 58);
      
      let resolvedAddress = sanitizedAddress;
      
      if (isNFDName) {
        const resolved = await resolveNFDName(sanitizedAddress);
        if (resolved) {
          resolvedAddress = resolved;
        } else {
          throw new Error(`NFD name "${sanitizedAddress}" not found or invalid`);
        }
      }
      
      // Fetch ASA Stats data using the resolved address
      const res = await fetchASAStats(resolvedAddress);
      
      console.log('✅ ASA Stats data received:', {
        address: resolvedAddress,
        hasData: !!res,
        asaitemsCount: res?.asaitems?.length || 0,
        totalValue: res?.total?.algo || '0'
      });
      
      setData(res);
      
      // Fetch NFD and Vestige data in parallel using the resolved address
      const [nfdResponse, vestigeResponse] = await Promise.allSettled([
        fetchNFD(resolvedAddress),
        fetchVestigeWalletValue(resolvedAddress)
      ]);
      
      // Handle NFD response
      if (nfdResponse.status === 'fulfilled' && nfdResponse.value) {
        const firstNfd = Object.values(nfdResponse.value)[0] as any;
        if (firstNfd?.name) {
          setNfdData(firstNfd.name);
        }
      }
      
      // Handle Vestige response
      if (vestigeResponse.status === 'fulfilled') {
        setVestigeData(vestigeResponse.value);
        
        // Cache assets from Vestige response
        if (vestigeResponse.value?.assets) {
          try {
            const assetsToCache = Object.entries(vestigeResponse.value.assets).map(([assetId, asset]) => ({
              asset_id: parseInt(assetId),
              name: asset.name || `Asset ${assetId}`,
              ticker: asset.ticker || `ASA${assetId}`,
              decimals: asset.decimals || 0,
              vestige_image_url: asset.image || undefined,
              is_verified: false,
            }));
            
            // Debounced cache
            debouncedCacheAssets(assetsToCache);
          } catch (error) {
            console.error('Error caching assets:', error);
          }
        }
      }
      
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      const categorizedError = categorizeError(errorMessage);
      
      setError(errorMessage);
      setErrorInfo(categorizedError);
      // Only increment retry count for retryable errors
      if (categorizedError.retryable) {
        setRetryCount(prev => prev + 1);
      } else {
        setRetryCount(0); // Reset for non-retryable errors
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []); // Remove all dependencies to prevent infinite re-renders

  useEffect(() => {
    if (address && !isFetchingRef.current) {
      fetchData(address);
    }
  }, [address]); // Only depend on address, not fetchData

  const handleRetry = useCallback(() => {
    if (address && !isFetchingRef.current && retryCount < MAX_RETRIES) {
      fetchData(address);
    }
  }, [address, retryCount]); // Include retryCount in dependencies

  // Use real NFD data if available, or show the original NFD name if that's what was entered
  const nfdName = nfdData || 
                  (address && address.includes('.algo') ? address : 
                   (address && address.endsWith('A') ? `${address.slice(0, 6)}.algo` : undefined));
  
  // Optimized portfolio breakdown calculation
  const portfolioBreakdown = usePortfolioBreakdown(data);
  
  // Debug logging
  console.log('WalletPage render state:', {
    address,
    loading,
    error,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : null,
    asaitemsCount: data?.asaitems?.length || 0
  });
  
  // Determine if retry button should be shown and enabled
  const showRetryButton = error && errorInfo?.retryable && retryCount < MAX_RETRIES;
  const retryDisabled = loading || retryCount >= MAX_RETRIES;
  
  return (
    <div className="min-h-screen bg-algo-dark text-algo-text py-8" role="main" aria-label="Wallet Portfolio">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {loading && (
          <>
            <ProfileSummarySkeleton />
            <TreemapSkeleton />
            <div className="space-y-4" aria-label="Loading assets">
              {[1, 2, 3].map(i => <AssetCardSkeleton key={i} />)}
            </div>
          </>
        )}
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center" role="alert" aria-live="polite">
            {errorInfo?.type === 'validation' ? (
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
            )}
            <h2 className="text-xl font-semibold text-red-300 mb-2 tracking-tight">
              {errorInfo?.type === 'validation' ? 'Invalid Input' : 'Failed to load wallet data'}
            </h2>
            <p className="text-red-200 mb-4 tracking-tight">{error}</p>
            
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={retryDisabled}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-algo-accent text-algo-dark rounded-md hover:bg-yellow-400 disabled:opacity-50 transition-colors duration-200 tracking-tight"
                aria-label="Retry loading wallet data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                {loading ? 'Loading...' : 'Try Again'}
              </button>
            )}
            
            {errorInfo?.retryable && retryCount > 0 && retryCount < MAX_RETRIES && (
              <p className="text-sm text-red-300 mt-2 tracking-tight">
                Retry attempt {retryCount} of {MAX_RETRIES}
              </p>
            )}
            
            {errorInfo?.retryable && retryCount >= MAX_RETRIES && (
              <p className="text-sm text-red-300 mt-2 tracking-tight">
                Maximum retries reached. Please check your input and try again.
              </p>
            )}
            
            {errorInfo?.type === 'validation' && (
              <p className="text-sm text-red-300 mt-2 tracking-tight">
                This error cannot be resolved by retrying. Please check your input.
              </p>
            )}
          </div>
        )}
        
        {data && !loading && (
          <>
            <ProfileSummary data={data} nfdName={nfdName} />
            <PortfolioTreemapCard
              breakdown={portfolioBreakdown || {}}
            />
            <PortfolioAssetsCard
              assets={data.asaitems as any}
              nftcollections={data.nftcollections}
              valuesIn={data.account_info.values_in}
              algoPrice={parseFloat(data.total.priceusdc)}
              loading={loading}
              totalAlgoValue={data.total.algo}
            />
          </>
        )}
      </div>
    </div>
  );
} 