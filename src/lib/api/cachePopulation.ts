import { AssetCacheAPI } from './assetCache';
import type { AssetCacheInsert } from '../../types/asset-cache';

// Sample wallet addresses for initial cache population
const SAMPLE_WALLETS = [
  'ALGORAND_ADDRESS_1', // Replace with real addresses
  'ALGORAND_ADDRESS_2',
  'ALGORAND_ADDRESS_3',
];

interface VestigeAsset {
  asset_id: number;
  name: string;
  ticker: string;
  decimals: number;
  image_url?: string;
}

/**
 * Fetch assets from Vestige API for a given wallet
 */
async function fetchVestigeAssets(walletAddress: string): Promise<VestigeAsset[]> {
  try {
    const response = await fetch(`https://api.vestige.fi/wallets/${walletAddress}/value`);
    
    if (!response.ok) {
      throw new Error(`Vestige API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract unique assets from the response
    const assets: VestigeAsset[] = [];
    const seenAssets = new Set<number>();

    // Process assets from the response structure
    if (data.assets) {
      for (const asset of data.assets) {
        if (asset.asset_id && !seenAssets.has(asset.asset_id)) {
          seenAssets.add(asset.asset_id);
          assets.push({
            asset_id: asset.asset_id,
            name: asset.name || `Asset ${asset.asset_id}`,
            ticker: asset.ticker || `ASA${asset.asset_id}`,
            decimals: asset.decimals || 0,
            image_url: asset.image_url,
          });
        }
      }
    }

    return assets;
  } catch (error) {
    console.error(`Error fetching Vestige assets for ${walletAddress}:`, error);
    return [];
  }
}

/**
 * Convert Vestige asset to cache format
 */
function convertToCacheFormat(vestigeAsset: VestigeAsset): AssetCacheInsert {
  return {
    asset_id: vestigeAsset.asset_id,
    name: vestigeAsset.name,
    ticker: vestigeAsset.ticker,
    decimals: vestigeAsset.decimals,
    vestige_image_url: vestigeAsset.image_url,
    is_verified: false, // Will be updated later
  };
}

/**
 * Populate cache with assets from multiple wallets
 */
export async function populateCacheFromWallets(walletAddresses: string[] = SAMPLE_WALLETS): Promise<void> {
  console.log('🚀 Starting cache population...');
  
  const allAssets = new Map<number, AssetCacheInsert>();
  
  for (const walletAddress of walletAddresses) {
    console.log(`📥 Fetching assets for wallet: ${walletAddress}`);
    
    const assets = await fetchVestigeAssets(walletAddress);
    
    for (const asset of assets) {
      if (!allAssets.has(asset.asset_id)) {
        allAssets.set(asset.asset_id, convertToCacheFormat(asset));
      }
    }
    
    console.log(`✅ Found ${assets.length} assets from ${walletAddress}`);
  }
  
  const uniqueAssets = Array.from(allAssets.values());
  console.log(`📊 Total unique assets to cache: ${uniqueAssets.length}`);
  
  // Store assets in cache
  let successCount = 0;
  for (const asset of uniqueAssets) {
    const result = await AssetCacheAPI.upsertAsset(asset);
    if (result) {
      successCount++;
    }
  }
  
  console.log(`✅ Successfully cached ${successCount}/${uniqueAssets.length} assets`);
}

/**
 * Populate cache with popular assets (manual list)
 */
export async function populateCacheWithPopularAssets(): Promise<void> {
  console.log('🚀 Populating cache with popular assets...');
  
  const popularAssets: AssetCacheInsert[] = [
    {
      asset_id: 0,
      name: 'Algorand',
      ticker: 'ALGO',
      decimals: 6,
      is_verified: true,
    },
    {
      asset_id: 312769,
      name: 'Tether USD',
      ticker: 'USDT',
      decimals: 6,
      is_verified: true,
    },
    {
      asset_id: 31566704,
      name: 'USD Coin',
      ticker: 'USDC',
      decimals: 6,
      is_verified: true,
    },
    // Add more popular assets as needed
  ];
  
  let successCount = 0;
  for (const asset of popularAssets) {
    const result = await AssetCacheAPI.upsertAsset(asset);
    if (result) {
      successCount++;
    }
  }
  
  console.log(`✅ Successfully cached ${successCount}/${popularAssets.length} popular assets`);
}

/**
 * Update asset images from Tinyman API
 */
export async function updateAssetImages(): Promise<void> {
  console.log('🖼️ Updating asset images from Tinyman...');
  
  // Get all assets without Tinyman images
  const { data: assets, error } = await AssetCacheAPI.supabase
    .from('asset_cache')
    .select('asset_id, ticker')
    .is('tinyman_image_url', null)
    .limit(100); // Process in batches
  
  if (error) {
    console.error('Error fetching assets for image update:', error);
    return;
  }
  
  if (!assets || assets.length === 0) {
    console.log('✅ All assets already have Tinyman images');
    return;
  }
  
  let updatedCount = 0;
  for (const asset of assets) {
    try {
      // Fetch Tinyman image URL
      const tinymanUrl = `https://mainnet.analytics.tinyman.org/api/v1/assets/${asset.asset_id}/icon`;
      
      const response = await fetch(tinymanUrl);
      if (response.ok) {
        await AssetCacheAPI.updateAsset(asset.asset_id, {
          tinyman_image_url: tinymanUrl,
        });
        updatedCount++;
      }
    } catch (error) {
      console.error(`Error updating image for asset ${asset.asset_id}:`, error);
    }
  }
  
  console.log(`✅ Updated images for ${updatedCount}/${assets.length} assets`);
}

/**
 * Main cache population function
 */
export async function populateCache(): Promise<void> {
  console.log('🎯 Starting comprehensive cache population...');
  
  try {
    // Test Supabase connection
    const isConnected = await AssetCacheAPI.supabase
      .from('asset_cache')
      .select('count')
      .limit(1);
    
    if (isConnected.error) {
      throw new Error('Supabase connection failed');
    }
    
    console.log('✅ Supabase connection verified');
    
    // Get current cache stats
    const stats = await AssetCacheAPI.getCacheStats();
    console.log('📊 Current cache stats:', stats);
    
    // Populate with popular assets first
    await populateCacheWithPopularAssets();
    
    // Populate from wallet data
    await populateCacheFromWallets();
    
    // Update images
    await updateAssetImages();
    
    // Final stats
    const finalStats = await AssetCacheAPI.getCacheStats();
    console.log('📊 Final cache stats:', finalStats);
    
    console.log('🎉 Cache population completed successfully!');
    
  } catch (error) {
    console.error('❌ Cache population failed:', error);
    throw error;
  }
} 