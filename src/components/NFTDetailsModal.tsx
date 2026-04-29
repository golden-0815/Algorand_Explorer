import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Image, Calendar, User, Hash, Tag, DollarSign } from 'lucide-react';
import { getOptimizedImageUrl, isVideoUrl, is3DModelUrl, convertToOptimizedGateway } from '../lib/utils/imageOptimization';

interface NFTDetailsModalProps {
  nft: any;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTDetailsModal({ nft, isOpen, onClose }: NFTDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatALGO = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    if (num === 0) return '0 Ⱥ';
    if (num < 0) return `${num.toFixed(2)} Ⱥ`;
    if (num > 0 && num < 1) return `${num.toFixed(6)} Ⱥ`;
    if (num < 1000) return `${num.toFixed(2)} Ⱥ`;
    if (num < 1_000_000) return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ⱥ`;
    return `${(num / 1_000_000).toFixed(2)}M Ⱥ`;
  };

  const handleCopyAddress = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silent fail for clipboard operations
    }
  };

  const getImageUrl = (nft: any): string | null => {
    if (nft?.nft?.urls && nft.nft.urls.length > 0) {
      const imageUrl = nft.nft.urls.find((url: any) => {
        const isImage = url?.typ === 'image' || 
                       url?.url?.includes('image') || 
                       url?.url?.includes('thumbnail') ||
                       url?.url?.includes('ipfs');
        return isImage && !isVideoUrl(url?.url) && !is3DModelUrl(url?.url);
      });
      if (imageUrl?.url) return imageUrl.url;
    }
    
    if (nft?.nft?.image && !isVideoUrl(nft.nft.image) && !is3DModelUrl(nft.nft.image)) return nft.nft.image;
    if (nft?.nft?.thumbnail && !isVideoUrl(nft.nft.thumbnail) && !is3DModelUrl(nft.nft.thumbnail)) return nft.nft.thumbnail;
    return null;
  };

  if (!isOpen) return null;

  const imageUrl = getImageUrl(nft);
  const optimizedImageUrl = imageUrl ? convertToOptimizedGateway(imageUrl) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0E0E0E] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Image className="w-6 h-6 text-[#F1CB83]" />
            <h2 className="text-xl font-semibold text-[#E6E6E6]">
              {nft.nft?.name || 'NFT Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-[#E6E6E6]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                {optimizedImageUrl && !imageError ? (
                  isVideoUrl(imageUrl || '') ? (
                    <video 
                      src={optimizedImageUrl.fallback} 
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                      aria-label={`Video for ${nft.nft?.name || 'NFT'}`}
                      onError={() => setImageError(true)}
                    />
                  ) : is3DModelUrl(imageUrl || '') ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500/30 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-sm text-purple-300 font-medium">3D Model</p>
                        <p className="text-xs text-purple-400">glTF/GLB Format</p>
                      </div>
                    </div>
                  ) : (
                    <picture className="w-full h-full">
                      {/* WebP source for modern browsers */}
                      <source
                        srcSet={optimizedImageUrl.webp}
                        type="image/webp"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      {/* Fallback for older browsers */}
                      <img 
                        src={optimizedImageUrl.fallback} 
                        alt={nft.nft?.name || 'NFT'}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        onError={() => setImageError(true)}
                      />
                    </picture>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
              
              {/* Value Display */}
              {nft.value && (
                <div className="bg-[#F1CB83]/10 border border-[#F1CB83]/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-[#F1CB83]" />
                    <span className="text-sm font-medium text-[#E6E6E6]">Estimated Value</span>
                  </div>
                  <p className="text-2xl font-bold text-[#F1CB83]">
                    {formatALGO(parseFloat(nft.value))}
                  </p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#E6E6E6] border-b border-gray-700 pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-[#F1CB83]" />
                    <span className="text-sm text-gray-400">Name:</span>
                    <span className="text-sm text-[#E6E6E6] font-medium">{nft.nft?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-[#F1CB83]" />
                    <span className="text-sm text-gray-400">Unit:</span>
                    <span className="text-sm text-[#E6E6E6] font-mono">{nft.nft?.unit || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-[#F1CB83]" />
                    <span className="text-sm text-gray-400">Asset ID:</span>
                    <span className="text-sm text-[#E6E6E6] font-mono">{nft.nft?.id || 'N/A'}</span>
                  </div>
                  
                  {nft.collectionName && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-[#F1CB83]" />
                      <span className="text-sm text-gray-400">Collection:</span>
                      <span className="text-sm text-[#E6E6E6] font-medium">{nft.collectionName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Creator Info */}
              {nft.nft?.creator && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[#E6E6E6] border-b border-gray-700 pb-2">
                    Creator Information
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[#F1CB83]" />
                      <span className="text-sm text-gray-400">Creator:</span>
                      <span className="text-sm text-[#E6E6E6] font-mono">{nft.nft.creator}</span>
                      <button
                        onClick={() => handleCopyAddress(nft.nft.creator)}
                        className="p-1 hover:bg-gray-700/20 rounded transition-colors"
                        aria-label="Copy creator address"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* URLs Section */}
              {nft.nft?.urls && nft.nft.urls.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[#E6E6E6] border-b border-gray-700 pb-2">
                    Media URLs
                  </h3>
                  
                  <div className="space-y-2">
                    {nft.nft.urls.map((url: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-[#F1CB83]" />
                        <span className="text-sm text-gray-400">{url.typ || 'URL'}:</span>
                        <a 
                          href={url.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[#F1CB83] hover:underline truncate max-w-xs"
                        >
                          {url.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-700/20 text-[#E6E6E6] rounded-md hover:bg-gray-700/30 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.open(`https://explorer.perawallet.app/asset/${nft.nft?.id}`, '_blank')}
              className="px-4 py-2 text-sm bg-[#F1CB83]/20 text-[#F1CB83] rounded-md hover:bg-[#F1CB83]/30 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on PeraExplorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 