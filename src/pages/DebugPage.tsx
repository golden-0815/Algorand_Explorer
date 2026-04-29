import React, { useState } from 'react';
import { Code, Download, AlertCircle, Key, RefreshCw, TrendingUp, Database, Image as ImageIcon } from 'lucide-react';
import { AddressInput } from '../components/AddressInput';
import { fetchASAStats } from '../lib/api/fetchASAStats';
import { fetchNFD } from '../lib/api/fetchNFD';
import { fetchVestigeWalletValue, VestigeWalletValue } from '../lib/api/fetchVestige';
import { EvaluatedAccount } from '../types/asastats';
import { useVestige } from '../contexts/VestigeContext';
import { AssetCacheAPI } from '../lib/api/assetCache';
import { testCacheIntegration, quickConnectionTest } from '../lib/api/testCache';
import { debugSupabaseConnection, checkTableStructure, testRLSPolicies } from '../lib/api/debugCache';
import { 
  optimizeAndCacheImage, 
  batchOptimizeImages, 
  cleanupUnusedImages,
  getAssetImage 
} from '../lib/utils/imageOptimization';

export function DebugPage() {
  const [asaResponse, setAsaResponse] = useState<EvaluatedAccount | null>(null);
  const [nfdResponse, setNfdResponse] = useState<any>(null);
  const [vestigeResponse, setVestigeResponse] = useState<VestigeWalletValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastAddress, setLastAddress] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [supabaseRequestCount, setSupabaseRequestCount] = useState(0);
  const { setVestigeData } = useVestige();

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  const incrementRequestCount = () => {
    setSupabaseRequestCount(prev => prev + 1);
  };

  const handleAddressSubmit = async (input: string) => {
    setLoading(true);
    setError('');
    setAsaResponse(null);
    setNfdResponse(null);
    setVestigeResponse(null);
    setVestigeData(null);
    setLastAddress(input);
    clearDebugInfo();

    try {
      let address = input;

      // If input ends with .algo, resolve it first
      if (input.endsWith('.algo')) {
        addDebugInfo(`🔍 Resolving .algo name: ${input}`);
        const nfdData = await fetchNFD(input);
        setNfdResponse(nfdData);
        addDebugInfo(`📋 NFD Response received`);

        if (nfdData) {
          const firstNfd = Object.values(nfdData)[0] as any;
          if (firstNfd?.owner) {
            address = firstNfd.owner;
            addDebugInfo(`✅ Resolved address: ${address}`);
          } else {
            addDebugInfo(`⚠️ No owner found in NFD response`);
          }
        }
      } else {
        // For regular addresses, still try to get NFD data
        try {
          addDebugInfo(`🔍 Looking up NFD for address: ${address}`);
          const nfdData = await fetchNFD(address);
          setNfdResponse(nfdData);
          addDebugInfo(`📋 NFD Response received`);
        } catch (nfdError) {
          addDebugInfo(`⚠️ NFD lookup failed: ${nfdError}`);
        }
      }

      // Fetch ASA Stats data with authentication
      addDebugInfo(`🔍 Fetching ASA Stats for: ${address}`);
      addDebugInfo(`🔑 Using authenticated request`);
      
      const asaData = await fetchASAStats(address, true);
      setAsaResponse(asaData);
      addDebugInfo(`📋 ASA Stats Response received successfully`);
      addDebugInfo(`📊 Portfolio Summary:`);
      addDebugInfo(`   - Total Value: ${asaData.total?.total || 'N/A'} ALGO`);
      addDebugInfo(`   - USD Value: $${asaData.total?.totalusdc || 'N/A'}`);
      addDebugInfo(`   - ASA Items: ${asaData.asaitems?.length || 0}`);
      addDebugInfo(`   - NFT Collections: ${asaData.nftcollections?.length || 0}`);
      addDebugInfo(`   - Unevaluated: ${asaData.notevals?.length || 0}`);
      
      // Additional validation and debugging
      if (!asaData.asaitems) {
        addDebugInfo(`⚠️ Warning: asaitems is undefined`);
      }
      if (!asaData.nftcollections) {
        addDebugInfo(`⚠️ Warning: nftcollections is undefined`);
      }
      if (!asaData.notevals) {
        addDebugInfo(`⚠️ Warning: notevals is undefined`);
      }
      
      // Log response size for debugging
      const responseSize = JSON.stringify(asaData).length;
      addDebugInfo(`📏 Response size: ${(responseSize / 1024).toFixed(2)} KB`);
      
      if (responseSize > 1024 * 1024) { // > 1MB
        addDebugInfo(`⚠️ Warning: Large response detected (>1MB)`);
      }

      // Fetch Vestige wallet value data
      addDebugInfo(`🔍 Fetching Vestige wallet value for: ${address}`);
      
      const vestigeData = await fetchVestigeWalletValue(address);
      setVestigeResponse(vestigeData);
      setVestigeData(vestigeData); // Store in context for components
      addDebugInfo(`📋 Vestige Response received successfully`);
      addDebugInfo(`📊 Vestige Summary:`);
      addDebugInfo(`   - Assets: ${Object.keys(vestigeData.assets).length}`);
      addDebugInfo(`   - Pools: ${Object.keys(vestigeData.pools).length}`);
      addDebugInfo(`   - Balances: ${Object.keys(vestigeData.balances).length}`);
      addDebugInfo(`   - Labeled Balances: ${vestigeData.labeled_balances.length}`);
      
      // Log Vestige response size
      const vestigeResponseSize = JSON.stringify(vestigeData).length;
      addDebugInfo(`📏 Vestige response size: ${(vestigeResponseSize / 1024).toFixed(2)} KB`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      addDebugInfo(`❌ Error: ${errorMessage}`);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const testWithoutAuth = async () => {
    if (!lastAddress) return;
    
    setLoading(true);
    addDebugInfo(`🧪 Testing without authentication...`);
    
    try {
      const asaData = await fetchASAStats(lastAddress, false);
      setAsaResponse(asaData);
      addDebugInfo(`✅ Unauthenticated request successful`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebugInfo(`❌ Unauthenticated request failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Cache management functions
  const testCacheConnection = async () => {
    setCacheLoading(true);
    addDebugInfo(`🔗 Testing Supabase cache connection...`);
    
    try {
      const isConnected = await quickConnectionTest();
      if (isConnected) {
        addDebugInfo(`✅ Cache connection successful`);
        incrementRequestCount();
      } else {
        addDebugInfo(`❌ Cache connection failed`);
      }
    } catch (error) {
      addDebugInfo(`❌ Cache connection error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const runCacheTests = async () => {
    setCacheLoading(true);
    addDebugInfo(`🧪 Running comprehensive cache tests...`);
    
    try {
      await testCacheIntegration();
      addDebugInfo(`✅ All cache tests passed`);
      incrementRequestCount();
    } catch (error) {
      addDebugInfo(`❌ Cache tests failed: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const getCacheStats = async () => {
    setCacheLoading(true);
    addDebugInfo(`📊 Fetching cache statistics...`);
    
    try {
      const stats = await AssetCacheAPI.getCacheStats();
      setCacheStats(stats);
      incrementRequestCount();
      if (stats) {
        addDebugInfo(`📊 Cache Stats:`);
        addDebugInfo(`   - Total Assets: ${stats.total_assets}`);
        addDebugInfo(`   - Verified Assets: ${stats.verified_assets}`);
        addDebugInfo(`   - Assets with Images: ${stats.assets_with_images}`);
        addDebugInfo(`   - Last Updated: ${stats.last_updated}`);
      } else {
        addDebugInfo(`❌ Failed to get cache stats`);
      }
    } catch (error) {
      addDebugInfo(`❌ Cache stats error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const clearCache = async () => {
    setCacheLoading(true);
    addDebugInfo(`🗑️ Clearing cache...`);
    
    try {
      await AssetCacheAPI.clearCache();
      addDebugInfo(`✅ Cache cleared successfully`);
      incrementRequestCount();
      setCacheStats(null);
    } catch (error) {
      addDebugInfo(`❌ Cache clear error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  // Debug functions
  const runDebugConnection = async () => {
    setCacheLoading(true);
    addDebugInfo(`🔍 Running detailed connection debug...`);
    
    try {
      const result = await debugSupabaseConnection();
      if (result.success) {
        addDebugInfo(`✅ Debug connection successful`);
      } else {
        addDebugInfo(`❌ Debug connection failed: ${result.error ? JSON.stringify(result.error) : 'Unknown error'}`);
      }
    } catch (error) {
      addDebugInfo(`❌ Debug error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const runTableStructureCheck = async () => {
    setCacheLoading(true);
    addDebugInfo(`🏗️ Checking table structure...`);
    
    try {
      await checkTableStructure();
      addDebugInfo(`✅ Table structure check completed`);
    } catch (error) {
      addDebugInfo(`❌ Table structure error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const runRLSTest = async () => {
    setCacheLoading(true);
    addDebugInfo(`🔒 Testing RLS policies...`);
    
    try {
      const result = await testRLSPolicies();
      if (result) {
        addDebugInfo(`✅ RLS policies test successful`);
      } else {
        addDebugInfo(`❌ RLS policies test failed`);
      }
    } catch (error) {
      addDebugInfo(`❌ RLS test error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  // Image optimization functions
  const testImageOptimization = async () => {
    setCacheLoading(true);
    addDebugInfo(`🖼️ Testing image optimization...`);
    
    try {
      // Test with a sample asset
      const testAssetId = 312769; // USDT
      const testImageUrl = 'https://mainnet.analytics.tinyman.org/api/v1/assets/312769/icon';
      
      const result = await optimizeAndCacheImage(testAssetId, testImageUrl);
      if (result) {
        addDebugInfo(`✅ Image optimization successful: ${result}`);
      } else {
        addDebugInfo(`❌ Image optimization failed`);
      }
    } catch (error) {
      addDebugInfo(`❌ Image optimization error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const batchOptimizeCachedAssets = async () => {
    setCacheLoading(true);
    addDebugInfo(`📦 Starting batch image optimization...`);
    
    try {
      // Get all cached assets with image URLs
      const stats = await AssetCacheAPI.getCacheStats();
      if (!stats || stats.total_assets === 0) {
        addDebugInfo(`❌ No assets to optimize`);
        return;
      }
      
      // Get assets that need optimization
      const assets = await AssetCacheAPI.searchAssets('', 100);
      const assetsWithImages = assets.filter(asset => 
        asset.tinyman_image_url || asset.vestige_image_url
      );
      
      if (assetsWithImages.length === 0) {
        addDebugInfo(`❌ No assets with images found`);
        return;
      }
      
      addDebugInfo(`🔄 Optimizing ${assetsWithImages.length} assets...`);
      
      const assetsToOptimize = assetsWithImages.map(asset => ({
        asset_id: asset.asset_id,
        image_url: asset.tinyman_image_url || asset.vestige_image_url || ''
      }));
      
      const result = await batchOptimizeImages(assetsToOptimize);
      addDebugInfo(`✅ Batch optimization complete: ${result.success} success, ${result.failed} failed`);
      
    } catch (error) {
      addDebugInfo(`❌ Batch optimization error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const cleanupImages = async () => {
    setCacheLoading(true);
    addDebugInfo(`🧹 Cleaning up unused images...`);
    
    try {
      const deletedCount = await cleanupUnusedImages();
      addDebugInfo(`✅ Cleanup complete: ${deletedCount} files deleted`);
    } catch (error) {
      addDebugInfo(`❌ Cleanup error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  const testImageRetrieval = async () => {
    setCacheLoading(true);
    addDebugInfo(`🔍 Testing image retrieval...`);
    
    try {
      const testAssetId = 312769; // USDT
      const result = await getAssetImage(testAssetId);
      
      if (result) {
        addDebugInfo(`✅ Image retrieval successful`);
        addDebugInfo(`📊 Source: ${result.source}`);
        addDebugInfo(`📊 URL: ${result.url}`);
      } else {
        addDebugInfo(`❌ Image retrieval failed`);
      }
    } catch (error) {
      addDebugInfo(`❌ Image retrieval error: ${error}`);
    } finally {
      setCacheLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-algo-dark text-algo-text">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-algo-text mb-4 flex items-center justify-center gap-3 tracking-tight">
              <Code className="w-8 h-8 text-algo-accent" aria-hidden="true" />
              API Debug Console
            </h1>
            <p className="text-algo-gray-light max-w-2xl mx-auto tracking-tight">
              Raw API responses from ASA Stats, NFD, and Vestige endpoints for debugging and development.
            </p>
          </div>

          {/* Address Input */}
          <div className="flex justify-center mb-8">
            <AddressInput onSubmit={handleAddressSubmit} loading={loading} />
          </div>

          {/* Debug Info */}
          {debugInfo.length > 0 && (
            <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6 mb-8" role="region" aria-label="Debug Log">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-algo-text flex items-center gap-2 tracking-tight">
                  <RefreshCw className="w-5 h-5 text-algo-accent" aria-hidden="true" />
                  Debug Log
                </h2>
                <button
                  onClick={clearDebugInfo}
                  className="text-sm text-algo-gray-light hover:text-algo-accent tracking-tight"
                  aria-label="Clear debug log"
                >
                  Clear Log
                </button>
              </div>
              <div className="bg-algo-dark rounded-md p-4 max-h-48 overflow-y-auto" role="log" aria-label="Debug messages">
                {debugInfo.map((info, index) => (
                  <div key={index} className="text-sm text-algo-text font-mono mb-1 tracking-tight">
                    {info}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-8" role="alert" aria-live="polite">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-red-300 tracking-tight">Error</h3>
              </div>
              <p className="text-red-200 tracking-tight">{error}</p>
            </div>
          )}

          {/* Test Controls */}
          {lastAddress && (
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={testWithoutAuth}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-algo-gray-light text-algo-text 
                         rounded-md hover:bg-algo-gray-light/80 transition-colors duration-200 disabled:opacity-50 tracking-tight"
              >
                <Key className="w-4 h-4" />
                Test Without Auth
              </button>
            </div>
          )}

          {/* Cache Management */}
          <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-algo-text flex items-center gap-2 tracking-tight">
                <Database className="w-5 h-5 text-algo-accent" />
                Supabase Cache Management
              </h2>
              <div className="flex items-center gap-4">
                {cacheStats && (
                  <div className="text-sm text-algo-gray-light tracking-tight">
                    {cacheStats.total_assets} assets cached
                  </div>
                )}
                <div className="text-xs text-yellow-400 tracking-tight">
                  Supabase asset_cache requests (24h): {supabaseRequestCount}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <button
                onClick={testCacheConnection}
                disabled={cacheLoading}
                className="flex items-center gap-2 px-3 py-2 bg-algo-accent text-algo-dark 
                         rounded-md hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
              >
                <Database className="w-4 h-4" />
                Test Connection
              </button>
              
              <button
                onClick={runCacheTests}
                disabled={cacheLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white 
                         rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
              >
                <RefreshCw className="w-4 h-4" />
                Run Tests
              </button>
              
              <button
                onClick={getCacheStats}
                disabled={cacheLoading}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white 
                         rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
              >
                <TrendingUp className="w-4 h-4" />
                Get Stats
              </button>
              
              <button
                onClick={clearCache}
                disabled={cacheLoading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white 
                         rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
              >
                <AlertCircle className="w-4 h-4" />
                Clear Cache
              </button>
            </div>
            
            {/* Debug Tools */}
            <div className="border-t border-algo-gray-light pt-4">
              <h3 className="text-lg font-semibold text-algo-text mb-3 tracking-tight">Debug Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={runDebugConnection}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white 
                           rounded-md hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <Code className="w-4 h-4" />
                  Debug Connection
                </button>
                
                <button
                  onClick={runTableStructureCheck}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white 
                           rounded-md hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <Database className="w-4 h-4" />
                  Check Table
                </button>
                
                <button
                  onClick={runRLSTest}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white 
                           rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <Key className="w-4 h-4" />
                  Test RLS
                </button>
              </div>
            </div>
            
            {/* Image Optimization Tools */}
            <div className="border-t border-algo-gray-light pt-4 mt-4">
              <h3 className="text-lg font-semibold text-algo-text mb-3 tracking-tight">Image Optimization</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={testImageOptimization}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white 
                           rounded-md hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <ImageIcon className="w-4 h-4" />
                  Test Optimization
                </button>
                
                <button
                  onClick={batchOptimizeCachedAssets}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white 
                           rounded-md hover:bg-cyan-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <RefreshCw className="w-4 h-4" />
                  Batch Optimize
                </button>
                
                <button
                  onClick={testImageRetrieval}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white 
                           rounded-md hover:bg-emerald-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <AlertCircle className="w-4 h-4" />
                  Test Retrieval
                </button>
                
                <button
                  onClick={cleanupImages}
                  disabled={cacheLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-600 text-white 
                           rounded-md hover:bg-rose-700 transition-colors duration-200 disabled:opacity-50 text-sm tracking-tight"
                >
                  <AlertCircle className="w-4 h-4" />
                  Cleanup Images
                </button>
              </div>
            </div>
            
            {cacheStats && (
              <div className="mt-4 p-4 bg-algo-dark rounded-md">
                <h3 className="text-lg font-semibold text-algo-text mb-2 tracking-tight">Cache Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-algo-accent font-semibold">{cacheStats.total_assets}</div>
                    <div className="text-algo-gray-light tracking-tight">Total Assets</div>
                  </div>
                  <div>
                    <div className="text-algo-accent font-semibold">{cacheStats.verified_assets}</div>
                    <div className="text-algo-gray-light tracking-tight">Verified Assets</div>
                  </div>
                  <div>
                    <div className="text-algo-accent font-semibold">{cacheStats.assets_with_images}</div>
                    <div className="text-algo-gray-light tracking-tight">With Images</div>
                  </div>
                  <div>
                    <div className="text-algo-accent font-semibold">{new Date(cacheStats.last_updated).toLocaleDateString()}</div>
                    <div className="text-algo-gray-light tracking-tight">Last Updated</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Responses */}
          {(asaResponse || nfdResponse || vestigeResponse) && (
            <div className="space-y-8">
              {/* ASA Stats Response */}
              {asaResponse && (
                <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-algo-text flex items-center gap-2 tracking-tight">
                      <Code className="w-5 h-5 text-algo-accent" />
                      ASA Stats API Response
                    </h2>
                    <button
                      onClick={() => downloadJSON(asaResponse, `asastats-${lastAddress}.json`)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-algo-accent text-algo-dark 
                               rounded-md hover:bg-yellow-400 transition-colors duration-200 text-sm tracking-tight"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </button>
                  </div>
                  
                  {/* Quick Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-algo-dark rounded-md">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{asaResponse.total.total}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Total ALGO</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">${asaResponse.total.totalusdc}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Total USD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{asaResponse.asaitems?.length || 0}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">ASA Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{asaResponse.nftcollections?.length || 0}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">NFT Collections</div>
                    </div>
                  </div>
                  
                  <div className="bg-algo-dark rounded-md p-4 overflow-auto max-h-96">
                    <pre className="text-sm text-algo-text whitespace-pre-wrap font-mono tracking-tight">
                      {JSON.stringify(asaResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* NFD Response */}
              {nfdResponse && (
                <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-algo-text flex items-center gap-2 tracking-tight">
                      <Code className="w-5 h-5 text-algo-accent" />
                      NFD API Response
                    </h2>
                    <button
                      onClick={() => downloadJSON(nfdResponse, `nfd-${lastAddress}.json`)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-algo-accent text-algo-dark 
                               rounded-md hover:bg-yellow-400 transition-colors duration-200 text-sm tracking-tight"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </button>
                  </div>
                  
                  <div className="bg-algo-dark rounded-md p-4 overflow-auto max-h-96">
                    <pre className="text-sm text-algo-text whitespace-pre-wrap font-mono tracking-tight">
                      {JSON.stringify(nfdResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Vestige Response */}
              {vestigeResponse && (
                <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-algo-text flex items-center gap-2 tracking-tight">
                      <TrendingUp className="w-5 h-5 text-algo-accent" />
                      Vestige API Response
                    </h2>
                    <button
                      onClick={() => downloadJSON(vestigeResponse, `vestige-${lastAddress}.json`)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-algo-accent text-algo-dark 
                               rounded-md hover:bg-yellow-400 transition-colors duration-200 text-sm tracking-tight"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON
                    </button>
                  </div>
                  
                  {/* Quick Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-algo-dark rounded-md">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{Object.keys(vestigeResponse.assets).length}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Assets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{Object.keys(vestigeResponse.pools).length}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Pools</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{Object.keys(vestigeResponse.balances).length}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Balances</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-algo-accent">{vestigeResponse.labeled_balances.length}</div>
                      <div className="text-sm text-algo-gray-light tracking-tight">Labeled Balances</div>
                    </div>
                  </div>
                  
                  <div className="bg-algo-dark rounded-md p-4 overflow-auto max-h-96">
                    <pre className="text-sm text-algo-text whitespace-pre-wrap font-mono tracking-tight">
                      {JSON.stringify(vestigeResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}