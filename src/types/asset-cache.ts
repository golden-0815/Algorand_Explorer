export interface AssetCache {
  id: string;
  asset_id: number;
  name: string;
  ticker: string;
  decimals: number;
  tinyman_image_url?: string;
  vestige_image_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetCacheInsert {
  asset_id: number;
  name: string;
  ticker: string;
  decimals: number;
  tinyman_image_url?: string;
  vestige_image_url?: string;
  is_verified?: boolean;
}

export interface AssetCacheUpdate {
  name?: string;
  ticker?: string;
  decimals?: number;
  tinyman_image_url?: string;
  vestige_image_url?: string;
  is_verified?: boolean;
}

export interface AssetSearchResult {
  asset_id: number;
  name: string;
  ticker: string;
  decimals: number;
  tinyman_image_url?: string;
  vestige_image_url?: string;
  is_verified: boolean;
}

export interface CacheStats {
  total_assets: number;
  verified_assets: number;
  assets_with_images: number;
  last_updated: string;
} 