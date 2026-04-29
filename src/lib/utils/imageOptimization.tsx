import React from 'react';

// WebP Image Optimization Utilities
// Provides WebP support with fallbacks for better compression

export interface OptimizedImageUrl {
  webp: string;
  fallback: string;
  original: string;
}

export interface ImageFormat {
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
  png: boolean;
}

/**
 * Detects browser support for modern image formats
 */
export const detectImageSupport = (): ImageFormat => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    jpeg: true, // JPEG is universally supported
    png: true   // PNG is universally supported
  };
};

/**
 * Converts IPFS URLs to optimized gateway URLs with WebP support
 */
export const convertToOptimizedGateway = (url: string): OptimizedImageUrl => {
  if (!url) {
    return {
      webp: '',
      fallback: '',
      original: ''
    };
  }

  // Handle Arweave URLs (no optimization needed)
  if (url.includes('arweave.net/')) {
    return {
      webp: url,
      fallback: url,
      original: url
    };
  }

  // Handle IPFS URLs
  let ipfsHash = '';
  if (url.startsWith('ipfs://')) {
    ipfsHash = url.replace('ipfs://', '');
  } else if (url.includes('/ipfs/')) {
    const parts = url.split('/ipfs/');
    if (parts.length > 1) {
      ipfsHash = parts[1];
      ipfsHash = ipfsHash.split('?')[0].split('#')[0];
    }
  } else {
    // Regular HTTP/HTTPS URLs
    return {
      webp: url,
      fallback: url,
      original: url
    };
  }

  if (!ipfsHash) {
    return {
      webp: url,
      fallback: url,
      original: url
    };
  }

  // Use Algonode gateway with WebP optimization
  const baseUrl = `https://ipfs.algonode.xyz/ipfs/${ipfsHash}`;
  
  return {
    webp: `${baseUrl}?format=webp&quality=85`,
    fallback: baseUrl,
    original: url
  };
};

/**
 * Creates a picture element with WebP and fallback sources
 */
export const createOptimizedPictureElement = (
  imageUrl: OptimizedImageUrl,
  alt: string,
  className: string = '',
  sizes: string = '100vw'
): React.JSX.Element => {
  const { webp, fallback } = imageUrl;

  return (
    <picture className={className}>
      {/* WebP source for modern browsers */}
      <source
        srcSet={webp}
        type="image/webp"
        sizes={sizes}
      />
      {/* Fallback for older browsers */}
      <img
        src={fallback}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        sizes={sizes}
      />
    </picture>
  );
};

/**
 * Optimizes image URLs for different use cases
 */
export const optimizeImageUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): string => {
  const { width, height, quality = 85, format = 'webp' } = options;
  
  if (!url) return '';
  
  // Handle IPFS URLs with optimization
  if (url.includes('/ipfs/') || url.startsWith('ipfs://')) {
    const optimized = convertToOptimizedGateway(url);
    return optimized.webp;
  }
  
  // Handle regular URLs with query parameters
  const urlObj = new URL(url);
  if (width) urlObj.searchParams.set('w', width.toString());
  if (height) urlObj.searchParams.set('h', height.toString());
  if (quality) urlObj.searchParams.set('q', quality.toString());
  if (format) urlObj.searchParams.set('format', format);
  
  return urlObj.toString();
};

/**
 * Preloads optimized images for better performance
 */
export const preloadOptimizedImage = (imageUrl: OptimizedImageUrl): void => {
  if (!imageUrl.webp) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = imageUrl.webp;
  link.type = 'image/webp';
  
  document.head.appendChild(link);
  
  // Also preload fallback
  if (imageUrl.fallback !== imageUrl.webp) {
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'preload';
    fallbackLink.as = 'image';
    fallbackLink.href = imageUrl.fallback;
    document.head.appendChild(fallbackLink);
  }
};

/**
 * Checks if an image URL is a video file
 */
export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const videoKeywords = ['video', 'mp4', 'webm'];
  
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) ||
         videoKeywords.some(keyword => lowerUrl.includes(keyword));
};

/**
 * Checks if an image URL is a 3D model file
 */
export const is3DModelUrl = (url: string): boolean => {
  if (!url) return false;
  const modelExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae'];
  const modelKeywords = ['gltf', 'glb', '3d', 'model'];
  
  const lowerUrl = url.toLowerCase();
  return modelExtensions.some(ext => lowerUrl.includes(ext)) ||
         modelKeywords.some(keyword => lowerUrl.includes(keyword));
};

/**
 * Gets the best available image URL with optimization
 */
export const getOptimizedImageUrl = (nft: any): OptimizedImageUrl | null => {
  if (!nft?.nft) return null;
  
  // Check URLs array first
  if (nft.nft.urls && nft.nft.urls.length > 0) {
    const imageUrl = nft.nft.urls.find((url: any) => {
      const isImage = url?.typ === 'image' || 
                     url?.url?.includes('image') || 
                     url?.url?.includes('thumbnail') ||
                     url?.url?.includes('ipfs');
      return isImage && !isVideoUrl(url?.url) && !is3DModelUrl(url?.url);
    });
    
    if (imageUrl?.url) {
      return convertToOptimizedGateway(imageUrl.url);
    }
  }
  
  // Check image field
  if (nft.nft.image && !isVideoUrl(nft.nft.image) && !is3DModelUrl(nft.nft.image)) {
    return convertToOptimizedGateway(nft.nft.image);
  }
  
  // Check thumbnail field
  if (nft.nft.thumbnail && !isVideoUrl(nft.nft.thumbnail) && !is3DModelUrl(nft.nft.thumbnail)) {
    return convertToOptimizedGateway(nft.nft.thumbnail);
  }
  
  return null;
}; 