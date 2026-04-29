# Supabase Asset Cache Setup

This document outlines the complete setup and implementation of the Supabase asset caching system for the Finalyze Algorand Explorer.

## 🏗️ Architecture Overview

The asset cache system provides:
- **Fast asset lookups** by asset ID
- **Image URL caching** from Tinyman and Vestige APIs
- **Automatic population** when fetching wallet data
- **Search functionality** by asset name or ticker
- **Statistics tracking** for cache monitoring

## 📋 Setup Steps Completed

### 1. Environment Variables ✅
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Database Schema ✅
```sql
-- asset_cache table
CREATE TABLE asset_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 0,
  tinyman_image_url TEXT,
  vestige_image_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_asset_cache_asset_id ON asset_cache(asset_id);
CREATE INDEX idx_asset_cache_ticker ON asset_cache(ticker);
CREATE INDEX idx_asset_cache_name ON asset_cache(name);
CREATE INDEX idx_asset_cache_verified ON asset_cache(is_verified);
```

### 3. Dependencies ✅
```bash
npm install @supabase/supabase-js
```

### 4. Client Configuration ✅
- **File**: `src/lib/supabase.ts`
- **Features**: Connection testing, error handling
- **Usage**: Import `supabase` client throughout the app

### 5. TypeScript Types ✅
- **File**: `src/types/asset-cache.ts`
- **Interfaces**: `AssetCache`, `AssetCacheInsert`, `AssetCacheUpdate`, `AssetSearchResult`, `CacheStats`

### 6. API Wrapper ✅
- **File**: `src/lib/api/assetCache.ts`
- **Class**: `AssetCacheAPI`
- **Methods**: 
  - `getAsset(assetId)` - Get single asset
  - `getAssets(assetIds)` - Get multiple assets
  - `storeAsset(asset)` - Store new asset
  - `updateAsset(assetId, updates)` - Update existing asset
  - `upsertAsset(asset)` - Insert or update asset
  - `searchAssets(query, limit)` - Search by name/ticker
  - `getCacheStats()` - Get cache statistics
  - `bulkInsertAssets(assets)` - Bulk insert
  - `deleteAsset(assetId)` - Delete asset
  - `clearCache()` - Clear all cache

### 7. Cache Population ✅
- **File**: `src/lib/api/cachePopulation.ts`
- **Functions**:
  - `populateCacheFromWallets()` - Populate from Vestige API
  - `populateCacheWithPopularAssets()` - Add popular assets
  - `updateAssetImages()` - Fetch Tinyman images
  - `populateCache()` - Main population function

### 8. Integration ✅
- **WalletPage**: Automatically caches assets when fetching Vestige data
- **DebugPage**: Cache management UI for testing and monitoring

### 9. Testing ✅
- **File**: `src/lib/api/testCache.ts`
- **Functions**:
  - `testCacheIntegration()` - Comprehensive test suite
  - `quickConnectionTest()` - Connection verification

## 🚀 Usage Examples

### Basic Asset Operations

```typescript
import { AssetCacheAPI } from '../lib/api/assetCache';

// Get an asset
const asset = await AssetCacheAPI.getAsset(312769); // USDT

// Store a new asset
const newAsset = await AssetCacheAPI.storeAsset({
  asset_id: 123456,
  name: 'My Token',
  ticker: 'MTK',
  decimals: 6,
  is_verified: false,
});

// Search assets
const results = await AssetCacheAPI.searchAssets('USDT', 10);

// Get cache statistics
const stats = await AssetCacheAPI.getCacheStats();
```

### Automatic Caching

The `WalletPage` automatically caches assets when fetching Vestige data:

```typescript
// In WalletPage.tsx - happens automatically
if (vestigeResponse.value?.assets) {
  const assetsToCache = Object.entries(vestigeResponse.value.assets).map(([assetId, asset]) => ({
    asset_id: parseInt(assetId),
    name: asset.name || `Asset ${assetId}`,
    ticker: asset.ticker || `ASA${assetId}`,
    decimals: asset.decimals || 0,
    vestige_image_url: asset.image || undefined,
    is_verified: false,
  }));
  
  // Cache in background
  Promise.allSettled(
    assetsToCache.map(asset => AssetCacheAPI.upsertAsset(asset))
  );
}
```

### Cache Management

Use the DebugPage to manage the cache:

1. **Test Connection** - Verify Supabase connectivity
2. **Run Tests** - Execute comprehensive test suite
3. **Get Stats** - View cache statistics
4. **Clear Cache** - Remove all cached assets

## 📊 Cache Statistics

The cache tracks:
- **Total Assets**: Number of unique assets cached
- **Verified Assets**: Assets marked as verified
- **Assets with Images**: Assets that have image URLs
- **Last Updated**: Timestamp of most recent update

## 🔧 Testing

### Manual Testing
1. Navigate to `/debug` page
2. Use the "Supabase Cache Management" section
3. Test connection, run tests, view stats

### Programmatic Testing
```typescript
import { testCacheIntegration } from '../lib/api/testCache';

// Run comprehensive tests
await testCacheIntegration();
```

## 🎯 Benefits

1. **Performance**: Faster asset lookups vs API calls
2. **Reliability**: Reduces dependency on external APIs
3. **Cost**: Reduces API rate limit usage
4. **User Experience**: Faster image loading and asset display
5. **Scalability**: Can handle thousands of assets efficiently

## 🔮 Next Steps

1. **Image Optimization**: Implement image compression and CDN
2. **Cache Expiration**: Add TTL for stale assets
3. **Bulk Operations**: Optimize for large-scale operations
4. **Analytics**: Track cache hit rates and performance
5. **Admin Interface**: Web-based cache management

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables
   - Verify Supabase project is active
   - Test with `quickConnectionTest()`

2. **Assets Not Caching**
   - Check browser console for errors
   - Verify RLS policies allow insert/update
   - Test with `testCacheIntegration()`

3. **Performance Issues**
   - Check database indexes
   - Monitor cache statistics
   - Consider bulk operations for large datasets

### Debug Commands

```typescript
// Test connection
await quickConnectionTest();

// Run full test suite
await testCacheIntegration();

// Get cache stats
const stats = await AssetCacheAPI.getCacheStats();
console.log('Cache stats:', stats);
```

## 📝 Notes

- The cache is automatically populated when users search wallets
- Assets are stored with both Tinyman and Vestige image URLs
- The system gracefully handles missing or invalid data
- All operations are logged for debugging purposes
- Cache operations don't block the UI (run in background)

This setup provides a robust, scalable asset caching system that improves performance and user experience while reducing external API dependencies. 