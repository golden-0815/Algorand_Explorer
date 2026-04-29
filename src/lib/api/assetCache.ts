import { supabase } from '../supabase';
import type { 
  AssetCache, 
  AssetCacheInsert, 
  AssetCacheUpdate, 
  AssetSearchResult, 
  CacheStats 
} from '../../types/asset-cache';

export class AssetCacheAPI {
  /**
   * Get a single asset by ID
   */
  static async getAsset(assetId: number): Promise<AssetCache | null> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .select('*')
        .eq('asset_id', assetId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching asset:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAsset:', error);
      return null;
    }
  }

  /**
   * Get multiple assets by IDs
   */
  static async getAssets(assetIds: number[]): Promise<AssetCache[]> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .select('*')
        .in('asset_id', assetIds);

      if (error) {
        console.error('Error fetching assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAssets:', error);
      return [];
    }
  }

  /**
   * Store a new asset in cache (DEPRECATED - use upsertAsset instead)
   */
  static async storeAsset(asset: AssetCacheInsert): Promise<AssetCache | null> {
    console.warn('⚠️ storeAsset is deprecated - use upsertAsset instead');
    return this.upsertAsset(asset);
  }

  /**
   * Update an existing asset in cache
   */
  static async updateAsset(assetId: number, updates: AssetCacheUpdate): Promise<AssetCache | null> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('asset_id', assetId)
        .select('id, asset_id, name, ticker, decimals, tinyman_image_url, vestige_image_url, is_verified, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error updating asset:', error);
        return null;
      }

      console.log(`🔄 Updated asset: ${assetId}`);
      return data;
    } catch (error) {
      console.error('Error in updateAsset:', error);
      return null;
    }
  }

  /**
   * Upsert an asset (insert if not exists, update if exists)
   */
  static async upsertAsset(asset: AssetCacheInsert): Promise<AssetCache | null> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .upsert({
          ...asset,
          is_verified: asset.is_verified ?? false,
        }, {
          onConflict: 'asset_id'
        })
        .select('id, asset_id, name, ticker, decimals, tinyman_image_url, vestige_image_url, is_verified, created_at, updated_at')
        .single();

      if (error) {
        console.error('Error upserting asset:', error);
        return null;
      }

      console.log(`💾 Upserted asset: ${asset.ticker} (${asset.asset_id})`);
      return data;
    } catch (error) {
      console.error('Error in upsertAsset:', error);
      return null;
    }
  }

  /**
   * Search assets by name or ticker
   */
  static async searchAssets(query: string, limit: number = 10): Promise<AssetSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .select('asset_id, name, ticker, decimals, tinyman_image_url, vestige_image_url, is_verified')
        .or(`name.ilike.%${query}%,ticker.ilike.%${query}%`)
        .order('is_verified', { ascending: false })
        .order('name')
        .limit(limit);

      if (error) {
        console.error('Error searching assets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchAssets:', error);
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<CacheStats | null> {
    try {
      // Get total count
      const { count: totalAssets, error: totalError } = await supabase
        .from('asset_cache')
        .select('asset_id', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error getting total count:', totalError);
        return null;
      }

      // Get verified count
      const { count: verifiedAssets, error: verifiedError } = await supabase
        .from('asset_cache')
        .select('asset_id', { count: 'exact', head: true })
        .eq('is_verified', true);

      if (verifiedError) {
        console.error('Error getting verified count:', verifiedError);
        return null;
      }

      // Get assets with images count
      const { count: assetsWithImages, error: imagesError } = await supabase
        .from('asset_cache')
        .select('asset_id', { count: 'exact', head: true })
        .or('tinyman_image_url.not.is.null,vestige_image_url.not.is.null');

      if (imagesError) {
        console.error('Error getting images count:', imagesError);
        return null;
      }

      // Get last updated timestamp
      const { data: lastUpdated, error: lastError } = await supabase
        .from('asset_cache')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (lastError) {
        console.error('Error getting last updated:', lastError);
        return null;
      }

      return {
        total_assets: totalAssets || 0,
        verified_assets: verifiedAssets || 0,
        assets_with_images: assetsWithImages || 0,
        last_updated: lastUpdated?.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getCacheStats:', error);
      return null;
    }
  }

  /**
   * Bulk upsert assets (for initial population)
   */
  static async bulkInsertAssets(assets: AssetCacheInsert[]): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('asset_cache')
        .upsert(assets.map(asset => ({
          ...asset,
          is_verified: asset.is_verified ?? false,
        })), {
          onConflict: 'asset_id'
        })
        .select('asset_id');

      if (error) {
        console.error('Error bulk upserting assets:', error);
        return 0;
      }

      const insertedCount = data?.length || 0;
      console.log(`📦 Bulk upserted ${insertedCount} assets`);
      return insertedCount;
    } catch (error) {
      console.error('Error in bulkInsertAssets:', error);
      return 0;
    }
  }

  /**
   * Delete an asset from cache
   */
  static async deleteAsset(assetId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asset_cache')
        .delete()
        .eq('asset_id', assetId);

      if (error) {
        console.error('Error deleting asset:', error);
        return false;
      }

      console.log(`🗑️ Deleted asset: ${assetId}`);
      return true;
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      return false;
    }
  }

  /**
   * Clear all cache data
   */
  static async clearCache(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asset_cache')
        .delete()
        .neq('asset_id', 0); // Keep ALGO (asset_id 0)

      if (error) {
        console.error('Error clearing cache:', error);
        return false;
      }

      console.log('🧹 Cleared all cached assets');
      return true;
    } catch (error) {
      console.error('Error in clearCache:', error);
      return false;
    }
  }

  /**
   * Cache optimized NFT thumbnail with retry logic
   */
  static async cacheNFTThumbnail(
    nftId: number, 
    originalUrl: string, 
    optimizedUrl: string,
    retries: number = 3
  ): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        const { error } = await supabase
          .from('nft_thumbnails')
          .upsert({
            nft_id: nftId,
            original_url: originalUrl,
            optimized_url: optimizedUrl,
            width: 1152,
            quality: 70,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'nft_id'
          });

        if (error) {
          console.error(`Error caching NFT thumbnail (attempt ${i + 1}):`, error);
          if (i === retries - 1) return false;
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          continue;
        }

        console.log(`💾 Cached optimized thumbnail for NFT ${nftId}`);
        return true;
      } catch (error) {
        console.error(`Exception caching NFT thumbnail (attempt ${i + 1}):`, error);
        if (i === retries - 1) return false;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    return false;
  }

  /**
   * Batch cache multiple NFT thumbnails
   */
  static async batchCacheNFTThumbnails(
    thumbnails: Array<{ nftId: number; originalUrl: string; optimizedUrl: string }>
  ): Promise<{ success: number; failed: number }> {
    if (thumbnails.length === 0) return { success: 0, failed: 0 };

    console.log(`📦 Batch caching ${thumbnails.length} NFT thumbnails...`);
    
    const results = await Promise.allSettled(
      thumbnails.map(thumb => 
        this.cacheNFTThumbnail(thumb.nftId, thumb.originalUrl, thumb.optimizedUrl)
      )
    );

    const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - success;

    console.log(`📊 Batch cache complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Get cached NFT thumbnail
   */
  static async getNFTThumbnail(nftId: number): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('nft_thumbnails')
        .select('optimized_url')
        .eq('nft_id', nftId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No cached thumbnail
        }
        console.error('Error fetching NFT thumbnail:', error);
        return null;
      }

      return data.optimized_url;
    } catch (error) {
      console.error('Error in getNFTThumbnail:', error);
      return null;
    }
  }
} 