import { AssetCacheAPI } from './assetCache';
import { testSupabaseConnection } from '../supabase';

/**
 * Test the Supabase cache integration
 */
export async function testCacheIntegration(): Promise<void> {
  console.log('🧪 Testing Supabase cache integration...');
  
  try {
    // Test connection
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new Error('Supabase connection failed');
    }
    console.log('✅ Supabase connection successful');
    
    // Test basic operations
    const testAsset = {
      asset_id: 999999,
      name: 'Test Asset',
      ticker: 'TEST',
      decimals: 6,
      is_verified: false,
    };
    
    // Test store (use upsertAsset instead of storeAsset)
    console.log('📝 Testing asset upsert...');
    const storedAsset = await AssetCacheAPI.upsertAsset(testAsset);
    if (!storedAsset) {
      throw new Error('Failed to upsert test asset');
    }
    console.log('✅ Asset upsert successful');
    
    // Test get
    console.log('📖 Testing asset retrieval...');
    const retrievedAsset = await AssetCacheAPI.getAsset(999999);
    if (!retrievedAsset) {
      throw new Error('Failed to retrieve test asset');
    }
    console.log('✅ Asset retrieval successful');
    
    // Test update
    console.log('🔄 Testing asset update...');
    const updatedAsset = await AssetCacheAPI.updateAsset(999999, {
      name: 'Updated Test Asset',
      is_verified: true,
    });
    if (!updatedAsset) {
      throw new Error('Failed to update test asset');
    }
    console.log('✅ Asset update successful');
    
    // Test search
    console.log('🔍 Testing asset search...');
    const searchResults = await AssetCacheAPI.searchAssets('Test');
    if (searchResults.length === 0) {
      throw new Error('Failed to search test assets');
    }
    console.log('✅ Asset search successful');
    
    // Test stats
    console.log('📊 Testing cache stats...');
    const stats = await AssetCacheAPI.getCacheStats();
    if (!stats) {
      throw new Error('Failed to get cache stats');
    }
    console.log('✅ Cache stats successful');
    
    // Clean up test asset
    console.log('🧹 Cleaning up test asset...');
    const deleted = await AssetCacheAPI.deleteAsset(999999);
    if (!deleted) {
      throw new Error('Failed to delete test asset');
    }
    console.log('✅ Test asset cleanup successful');
    
    console.log('🎉 All cache integration tests passed!');
    
  } catch (error) {
    console.error('❌ Cache integration test failed:', error);
    throw error;
  }
}

/**
 * Quick connection test
 */
export async function quickConnectionTest(): Promise<boolean> {
  try {
    const isConnected = await testSupabaseConnection();
    if (isConnected) {
      console.log('✅ Supabase connection verified');
      return true;
    } else {
      console.log('❌ Supabase connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
} 