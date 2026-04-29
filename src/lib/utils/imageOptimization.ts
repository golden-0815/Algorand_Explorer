import { supabase } from '../supabase';
import { AssetCacheAPI } from '../api/assetCache';

export interface ImageMetadata {
  asset_id: number;
  original_url: string;
  optimized_url: string;
  file_size: number;
  dimensions: { width: number; height: number };
  format: 'webp' | 'png' | 'jpg';
  created_at: string;
}

export interface OptimizedImage {
  url: string;
  metadata: ImageMetadata;
  source: 'cache' | 'supabase' | 'external';
}

/**
 * Generate optimized filename for asset images
 */
export function generateImageFilename(assetId: number, format: 'webp' | 'png' | 'jpg' = 'webp'): string {
  return `${assetId}.${format}`;
}

/**
 * Optimize image using Canvas API
 */
export async function optimizeImage(
  imageUrl: string, 
  assetId: number, 
  maxWidth: number = 200, 
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<{ blob: Blob; metadata: Partial<ImageMetadata> }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Calculate new dimensions maintaining aspect ratio
      const { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and optimize image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP with quality setting
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const metadata: Partial<ImageMetadata> = {
              asset_id: assetId,
              original_url: imageUrl,
              dimensions: { width, height },
              format: 'webp',
              file_size: blob.size,
            };
            resolve({ blob, metadata });
          } else {
            reject(new Error('Failed to create optimized image'));
          }
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Upload optimized image to Supabase Storage
 */
export async function uploadOptimizedImage(
  blob: Blob, 
  assetId: number, 
  metadata: Partial<ImageMetadata>
): Promise<string> {
  const filename = generateImageFilename(assetId);
  
  const { data, error } = await supabase.storage
    .from('asset-images')
    .upload(filename, blob, {
      contentType: 'image/webp',
      upsert: true,
      metadata: {
        asset_id: assetId.toString(),
        original_url: metadata.original_url || '',
        file_size: metadata.file_size?.toString() || '',
        dimensions: JSON.stringify(metadata.dimensions || {}),
      }
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('asset-images')
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
}

/**
 * Smart image retrieval with fallback system
 */
export async function getAssetImage(
  assetId: number, 
  allowExternalFallback: boolean = true
): Promise<OptimizedImage | null> {
  try {
    // Step 1: Check asset metadata for cached image URL
    const asset = await AssetCacheAPI.getAsset(assetId);
    if (asset?.tinyman_image_url || asset?.vestige_image_url) {
      const cachedUrl = asset.tinyman_image_url || asset.vestige_image_url;
      if (cachedUrl) {
        return {
          url: cachedUrl,
          metadata: {
            asset_id: assetId,
            original_url: cachedUrl,
            optimized_url: cachedUrl,
            file_size: 0,
            dimensions: { width: 0, height: 0 },
            format: 'webp',
            created_at: new Date().toISOString(),
          },
          source: 'cache'
        };
      }
    }
    
    // Step 2: Check Supabase Storage for optimized image
    const filename = generateImageFilename(assetId);
    const { data: storageData } = supabase.storage
      .from('asset-images')
      .getPublicUrl(filename);
    
    if (storageData.publicUrl) {
      // Verify the file exists by trying to fetch it
      try {
        const response = await fetch(storageData.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          return {
            url: storageData.publicUrl,
            metadata: {
              asset_id: assetId,
              original_url: '',
              optimized_url: storageData.publicUrl,
              file_size: 0,
              dimensions: { width: 0, height: 0 },
              format: 'webp',
              created_at: new Date().toISOString(),
            },
            source: 'supabase'
          };
        }
      } catch (error) {
        console.warn(`Supabase image not accessible: ${storageData.publicUrl}`);
      }
    }
    
    // Step 3: External fallback (if allowed)
    if (allowExternalFallback && asset) {
      const externalUrl = asset.tinyman_image_url || asset.vestige_image_url;
      if (externalUrl) {
        return {
          url: externalUrl,
          metadata: {
            asset_id: assetId,
            original_url: externalUrl,
            optimized_url: externalUrl,
            file_size: 0,
            dimensions: { width: 0, height: 0 },
            format: 'webp',
            created_at: new Date().toISOString(),
          },
          source: 'external'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting asset image for ${assetId}:`, error);
    return null;
  }
}

/**
 * Optimize and cache image for an asset
 */
export async function optimizeAndCacheImage(
  assetId: number, 
  originalUrl: string
): Promise<string | null> {
  try {
    console.log(`🖼️ Optimizing image for asset ${assetId}...`);
    
    // Optimize the image
    const { blob, metadata } = await optimizeImage(originalUrl, assetId);
    
    // Upload to Supabase Storage
    const optimizedUrl = await uploadOptimizedImage(blob, assetId, metadata);
    
    // Update asset cache with optimized URL
    await AssetCacheAPI.updateAsset(assetId, {
      tinyman_image_url: optimizedUrl,
    });
    
    console.log(`✅ Image optimized and cached for asset ${assetId}`);
    return optimizedUrl;
    
  } catch (error) {
    console.error(`❌ Failed to optimize image for asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Batch optimize images for multiple assets
 */
export async function batchOptimizeImages(
  assets: Array<{ asset_id: number; image_url: string }>,
  maxConcurrent: number = 3
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < assets.length; i += maxConcurrent) {
    const batch = assets.slice(i, i + maxConcurrent);
    
    const results = await Promise.allSettled(
      batch.map(asset => optimizeAndCacheImage(asset.asset_id, asset.image_url))
    );
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        success++;
      } else {
        failed++;
      }
    });
    
    // Small delay between batches
    if (i + maxConcurrent < assets.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`📦 Batch optimization complete: ${success} success, ${failed} failed`);
  return { success, failed };
}

/**
 * Clean up old/unused images
 */
export async function cleanupUnusedImages(): Promise<number> {
  try {
    // Get all cached assets
    const stats = await AssetCacheAPI.getCacheStats();
    if (!stats) return 0;
    
    // List all files in storage
    const { data: files, error } = await supabase.storage
      .from('asset-images')
      .list();
    
    if (error) {
      console.error('Failed to list storage files:', error);
      return 0;
    }
    
    let deletedCount = 0;
    
    // Check each file against cached assets
    for (const file of files) {
      const assetId = parseInt(file.name.replace('.webp', ''));
      
      // Check if asset still exists in cache
      const asset = await AssetCacheAPI.getAsset(assetId);
      if (!asset) {
        // Delete unused file
        const { error: deleteError } = await supabase.storage
          .from('asset-images')
          .remove([file.name]);
        
        if (!deleteError) {
          deletedCount++;
          console.log(`🗑️ Deleted unused image: ${file.name}`);
        }
      }
    }
    
    console.log(`🧹 Cleanup complete: ${deletedCount} files deleted`);
    return deletedCount;
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

// NFT-specific utility functions
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const videoPatterns = [/\.mp4/i, /\.webm/i, /\.ogg/i, /\.mov/i, /\.avi/i];
  
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ||
         videoPatterns.some(pattern => pattern.test(url)) ||
         url.includes('video') ||
         url.includes('mp4');
}

export function is3DModelUrl(url: string): boolean {
  if (!url) return false;
  const modelExtensions = ['.glb', '.gltf', '.obj', '.fbx', '.dae'];
  const modelPatterns = [/\.glb/i, /\.gltf/i, /\.obj/i, /\.fbx/i, /\.dae/i];
  
  return modelExtensions.some(ext => url.toLowerCase().includes(ext)) ||
         modelPatterns.some(pattern => pattern.test(url)) ||
         url.includes('3d') ||
         url.includes('model');
}

export function getOptimizedImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  // Convert IPFS URLs to optimized gateways
  if (url.includes('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Convert Arweave URLs
  if (url.includes('ar://')) {
    return url.replace('ar://', 'https://arweave.net/');
  }
  
  return url;
}

export function convertToOptimizedGateway(url: string): { webp: string; fallback: string } {
  if (!url || typeof url !== 'string') {
    return { webp: '', fallback: '' };
  }

  let optimizedUrl = url;

  // Convert IPFS protocol URLs
  if (url.includes('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    optimizedUrl = `https://ipfs-pera.algonode.dev/ipfs/${hash}?optimizer=image&width=1152&quality=70`;
  }
  
  // Convert Arweave URLs
  else if (url.includes('ar://')) {
    optimizedUrl = url.replace('ar://', 'https://arweave.net/');
  }
  
  // Convert known IPFS gateways to preferred gateway
  else if (url.includes('ipfs')) {
    // List of known IPFS gateways to convert
    const gatewaysToConvert = [
      '4everland.io',
      'ipfs.io',
      'gateway.pinata.cloud',
      'cloudflare-ipfs.com',
      'dweb.link',
      'ipfs.infura.io',
      'gateway.ipfs.io'
    ];
    
    let converted = false;
    for (const gateway of gatewaysToConvert) {
      if (url.includes(gateway)) {
        // Extract the IPFS hash from the URL
        const ipfsMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        if (ipfsMatch) {
          const hash = ipfsMatch[1];
          optimizedUrl = `https://ipfs-pera.algonode.dev/ipfs/${hash}?optimizer=image&width=1152&quality=70`;
          converted = true;
          break;
        }
      }
    }
    
    // If it's an IPFS URL but not from a known gateway, still convert it
    if (!converted && url.includes('/ipfs/')) {
      const ipfsMatch = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      if (ipfsMatch) {
        const hash = ipfsMatch[1];
        optimizedUrl = `https://ipfs-pera.algonode.dev/ipfs/${hash}?optimizer=image&width=1152&quality=70`;
      }
    }
  }

  // For now, return the same URL for both webp and fallback
  // In the future, this could generate different formats
  return {
    webp: optimizedUrl,
    fallback: optimizedUrl
  };
} 