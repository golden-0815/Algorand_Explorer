import React from 'react';
import { useAssetImage } from '../hooks/useAssetImage';
import { Image, RefreshCw, AlertCircle } from 'lucide-react';

interface OptimizedAssetCardProps {
  assetId: number;
  name: string;
  ticker: string;
  balance?: string;
  value?: string;
  className?: string;
  showFallback?: boolean;
}

export function OptimizedAssetCard({
  assetId,
  name,
  ticker,
  balance,
  value,
  className = '',
  showFallback = true,
}: OptimizedAssetCardProps) {
  const { image, loading, error, refetch } = useAssetImage(assetId, showFallback);

  const getImageSource = () => {
    if (image?.url) {
      return image.url;
    }
    return null;
  };

  const getImageAlt = () => {
    return `${ticker} (${name})`;
  };

  const renderImage = () => {
    const imageUrl = getImageSource();
    
    if (loading) {
      return (
        <div className="w-12 h-12 bg-algo-gray rounded-lg flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-algo-gray-light animate-spin" />
        </div>
      );
    }

    if (error || !imageUrl) {
      return (
        <div className="w-12 h-12 bg-algo-gray rounded-lg flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-algo-gray-light" />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={getImageAlt()}
        className="w-12 h-12 rounded-lg object-cover"
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  };

  const renderFallback = () => {
    if (image?.url) return null; // Don't show fallback if we have an image
    
    return (
      <div className="w-12 h-12 bg-algo-accent rounded-lg flex items-center justify-center text-algo-dark font-bold text-sm hidden">
        {ticker.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`bg-algo-gray border border-algo-gray-light rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          {renderImage()}
          {renderFallback()}
          
          {/* Image source indicator */}
          {image && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-algo-dark">
              <div 
                className={`w-full h-full rounded-full ${
                  image.source === 'cache' ? 'bg-green-500' :
                  image.source === 'supabase' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
                title={`Source: ${image.source}`}
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-algo-text truncate tracking-tight">
                {name}
              </h3>
              <p className="text-xs text-algo-gray-light tracking-tight">
                {ticker}
              </p>
            </div>
            
            {error && (
              <button
                onClick={refetch}
                className="p-1 text-algo-gray-light hover:text-algo-accent transition-colors"
                title="Retry loading image"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {(balance || value) && (
            <div className="mt-2 text-xs text-algo-gray-light tracking-tight">
              {balance && <div>Balance: {balance}</div>}
              {value && <div>Value: {value}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 