# Vestige Asset API Guide

The Finalyze crypto dashboard integrates with **Vestige's asset indexer API** to fetch comprehensive Algorand asset metadata, pricing, and analytics. This guide covers implementation patterns for rich asset discovery and portfolio analysis.

## 🔧 Environment Configuration

### Environment Variables

```bash
# Testnet Configuration
VITE_VESTIGE_API_URL=https://testnet-idx.vestige.fi

# Mainnet Configuration  
VITE_VESTIGE_API_URL=https://mainnet-idx.vestige.fi
```

### Docker Configuration

```yaml
# Located in: docker-compose.yml (deployment)
environment:
  - VITE_VESTIGE_API_URL=${VITE_VESTIGE_API_URL}
```

## 🚀 Implementation Structure

### API Client Setup

Create a dedicated Vestige API client for asset operations:

```typescript
// File: src/shared/api/vestige.ts
import { z } from 'zod';

const VestigeAssetSchema = z.object({
  id: z.number(),
  params: z.object({
    name: z.string(),
    'unit-name': z.string(),
    total: z.number(),
    decimals: z.number(),
    'default-frozen': z.boolean(),
    creator: z.string(),
    manager: z.string().optional(),
    reserve: z.string().optional(),
    freeze: z.string().optional(),
    clawback: z.string().optional(),
    url: z.string().optional(),
    'metadata-hash': z.string().optional(),
  }),
  metadata: z.object({
    logo: z.string().optional(),
    description: z.string().optional(),
    external_url: z.string().optional(),
    background_color: z.string().optional(),
    animation_url: z.string().optional(),
    properties: z.record(z.any()).optional(),
  }).optional(),
  verification: z.object({
    verified: z.boolean(),
    provider: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
  price: z.object({
    usd: z.number(),
    algo: z.number(),
    change_24h: z.number(),
    volume_24h: z.number(),
    market_cap: z.number().optional(),
  }).optional(),
});

export type VestigeAsset = z.infer<typeof VestigeAssetSchema>;

const VestigePortfolioSchema = z.object({
  assets: z.array(z.object({
    asset_id: z.number(),
    balance: z.number(),
    value_usd: z.number(),
    value_algo: z.number(),
    percentage: z.number(),
  })),
  total_value: z.object({
    usd: z.number(),
    algo: z.number(),
  }),
  change_24h: z.object({
    usd: z.number(),
    percentage: z.number(),
  }),
});

export type VestigePortfolio = z.infer<typeof VestigePortfolioSchema>;

class VestigeAPI {
  private baseURL: string;
  
  constructor() {
    this.baseURL = import.meta.env.VITE_VESTIGE_API_URL;
    if (!this.baseURL) {
      throw new Error('VITE_VESTIGE_API_URL environment variable is required');
    }
  }

  async getAsset(assetId: number): Promise<VestigeAsset> {
    try {
      const response = await fetch(`${this.baseURL}/v1/assets/${assetId}`);
      
      if (!response.ok) {
        throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return VestigeAssetSchema.parse(data);
    } catch (error) {
      console.error('Failed to fetch asset from Vestige:', error);
      throw error;
    }
  }

  async searchAssets(query: string, options: {
    limit?: number;
    offset?: number;
    verified_only?: boolean;
  } = {}): Promise<VestigeAsset[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.verified_only) params.append('verified', 'true');

    try {
      const response = await fetch(`${this.baseURL}/v1/assets/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return z.array(VestigeAssetSchema).parse(data.results);
    } catch (error) {
      console.error('Failed to search assets on Vestige:', error);
      throw error;
    }
  }

  async getPortfolio(address: string): Promise<VestigePortfolio> {
    try {
      const response = await fetch(`${this.baseURL}/v1/portfolios/${address}`);
      
      if (!response.ok) {
        throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return VestigePortfolioSchema.parse(data);
    } catch (error) {
      console.error('Failed to fetch portfolio from Vestige:', error);
      throw error;
    }
  }

  async getTrendingAssets(options: {
    timeframe?: '1h' | '24h' | '7d' | '30d';
    limit?: number;
  } = {}): Promise<VestigeAsset[]> {
    const params = new URLSearchParams();
    if (options.timeframe) params.append('timeframe', options.timeframe);
    if (options.limit) params.append('limit', options.limit.toString());

    try {
      const response = await fetch(`${this.baseURL}/v1/assets/trending?${params}`);
      
      if (!response.ok) {
        throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return z.array(VestigeAssetSchema).parse(data.results);
    } catch (error) {
      console.error('Failed to fetch trending assets from Vestige:', error);
      throw error;
    }
  }

  async getAssetHistory(assetId: number, timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const response = await fetch(
        `${this.baseURL}/v1/assets/${assetId}/price-history?timeframe=${timeframe}`
      );
      
      if (!response.ok) {
        throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch asset history from Vestige:', error);
      throw error;
    }
  }
}

export const vestigeAPI = new VestigeAPI();
```

### React Query Integration

Create specialized hooks for Vestige data:

```typescript
// File: src/shared/hooks/useVestigeQueries.ts
import { useQuery } from '@tanstack/react-query';
import { vestigeAPI, VestigeAsset, VestigePortfolio } from '@/shared/api/vestige';

export function useVestigeAsset(assetId: number | null) {
  return useQuery({
    queryKey: ['vestige-asset', assetId],
    queryFn: () => vestigeAPI.getAsset(assetId!),
    enabled: !!assetId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

export function useVestigePortfolio(address: string | null) {
  return useQuery({
    queryKey: ['vestige-portfolio', address],
    queryFn: () => vestigeAPI.getPortfolio(address!),
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}

export function useVestigeAssetSearch(query: string, options: {
  limit?: number;
  verified_only?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['vestige-search', query, options],
    queryFn: () => vestigeAPI.searchAssets(query, options),
    enabled: !!query && query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useVestigeTrendingAssets(timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
  return useQuery({
    queryKey: ['vestige-trending', timeframe],
    queryFn: () => vestigeAPI.getTrendingAssets({ timeframe, limit: 20 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useVestigeAssetHistory(
  assetId: number | null,
  timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
) {
  return useQuery({
    queryKey: ['vestige-history', assetId, timeframe],
    queryFn: () => vestigeAPI.getAssetHistory(assetId!, timeframe),
    enabled: !!assetId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}
```

## 🎯 Component Implementations

### 1. Enhanced Asset Card with Vestige Data

```typescript
// File: src/features/dashboard/components/EnhancedAssetCard.tsx
import { useVestigeAsset } from '@/shared/hooks/useVestigeQueries';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';

interface EnhancedAssetCardProps {
  assetId: number;
  balance: number;
}

export function EnhancedAssetCard({ assetId, balance }: EnhancedAssetCardProps) {
  const { data: asset, isLoading, error } = useVestigeAsset(assetId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !asset) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            Asset {assetId} - Unable to load metadata
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedBalance = (balance / Math.pow(10, asset.params.decimals)).toFixed(
    Math.min(asset.params.decimals, 6)
  );

  const totalValue = asset.price 
    ? (parseFloat(formattedBalance) * asset.price.usd)
    : null;

  const priceChange = asset.price?.change_24h || 0;
  const isPositiveChange = priceChange >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {asset.metadata?.logo && (
              <img 
                src={asset.metadata.logo} 
                alt={asset.params.name}
                className="w-10 h-10 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">{asset.params.name}</h3>
                {asset.verification?.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {asset.params['unit-name']}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="font-medium">{formattedBalance}</div>
            {totalValue && (
              <div className="text-sm text-muted-foreground">
                ${totalValue.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {asset.price && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <div className="flex items-center space-x-2">
                <span>${asset.price.usd.toFixed(6)}</span>
                <span className={`flex items-center ${
                  isPositiveChange ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(priceChange).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 2. Portfolio Overview with Vestige Analytics

```typescript
// File: src/features/dashboard/components/PortfolioOverview.tsx
import { useVestigePortfolio } from '@/shared/hooks/useVestigeQueries';
import { useWalletStore } from '@/features/auth/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export function PortfolioOverview() {
  const { walletAddress } = useWalletStore();
  const { data: portfolio, isLoading, error } = useVestigePortfolio(walletAddress);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load portfolio data</p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = portfolio.change_24h.percentage >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${portfolio.total_value.usd.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {portfolio.total_value.algo.toFixed(6)} ALGO
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
          {isPositiveChange ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            isPositiveChange ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositiveChange ? '+' : ''}${portfolio.change_24h.usd.toFixed(2)}
          </div>
          <p className={`text-xs ${
            isPositiveChange ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositiveChange ? '+' : ''}{portfolio.change_24h.percentage.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assets</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{portfolio.assets.length}</div>
          <p className="text-xs text-muted-foreground">
            Holdings tracked
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Asset Search Component

```typescript
// File: src/features/dashboard/components/AssetSearch.tsx
import { useState } from 'react';
import { useVestigeAssetSearch } from '@/shared/hooks/useVestigeQueries';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export function AssetSearch() {
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  
  const { data: assets, isLoading } = useVestigeAssetSearch(query, {
    limit: 10,
    verified_only: verifiedOnly,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={verifiedOnly}
            onCheckedChange={setVerifiedOnly}
            id="verified-only"
          />
          <label htmlFor="verified-only" className="text-sm">
            Verified only
          </label>
        </div>
      </div>

      {query.length > 2 && (
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Searching...</div>
          ) : assets && assets.length > 0 ? (
            assets.map((asset) => (
              <Card key={asset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {asset.metadata?.logo && (
                        <img 
                          src={asset.metadata.logo} 
                          alt={asset.params.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{asset.params.name}</span>
                          {asset.verification?.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {asset.params['unit-name']} • ID: {asset.id}
                        </div>
                      </div>
                    </div>
                    {asset.price && (
                      <div className="text-right">
                        <div className="font-medium">${asset.price.usd.toFixed(6)}</div>
                        <div className={`text-sm ${
                          asset.price.change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {asset.price.change_24h >= 0 ? '+' : ''}{asset.price.change_24h.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground">No assets found</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. Trending Assets Dashboard

```typescript
// File: src/features/dashboard/components/TrendingAssets.tsx
import { useState } from 'react';
import { useVestigeTrendingAssets } from '@/shared/hooks/useVestigeQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';

export function TrendingAssets() {
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { data: assets, isLoading } = useVestigeTrendingAssets(timeframe);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="1h">1H</TabsTrigger>
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
          </TabsList>
          
          <TabsContent value={timeframe} className="mt-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-muted-foreground">Loading trending assets...</div>
              ) : assets && assets.length > 0 ? (
                assets.map((asset, index) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      {asset.metadata?.logo && (
                        <img 
                          src={asset.metadata.logo} 
                          alt={asset.params.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{asset.params.name}</span>
                          {asset.verification?.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {asset.params['unit-name']}
                        </div>
                      </div>
                    </div>
                    
                    {asset.price && (
                      <div className="text-right">
                        <div className="font-medium">${asset.price.usd.toFixed(6)}</div>
                        <div className={`text-sm flex items-center ${
                          asset.price.change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {asset.price.change_24h >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {Math.abs(asset.price.change_24h).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">No trending data available</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

## 🔐 Error Handling & Fallbacks

### Vestige-Specific Error Boundary

```typescript
// File: src/shared/components/VestigeErrorBoundary.tsx
import { ErrorBoundary } from '@/core/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function VestigeErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="font-medium text-destructive mb-2">
              Asset Data Unavailable
            </h3>
            <p className="text-sm text-muted-foreground">
              Unable to load asset metadata and pricing. Basic functionality will continue to work.
            </p>
          </CardContent>
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 🧪 Testing & Health Checks

### API Health Check

```typescript
// File: src/shared/api/vestige.ts (additional method)
export async function checkVestigeHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_VESTIGE_API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
```

## 📊 Performance Optimization

### Caching Strategy

1. **Asset Metadata**: 2-minute stale time (metadata rarely changes)
2. **Portfolio Data**: 30-second stale time (balances change frequently)
3. **Price Data**: 1-minute stale time (prices update regularly)
4. **Search Results**: 5-minute stale time (search results are relatively stable)

### Batch Requests

```typescript
// File: src/shared/api/vestige.ts (additional method)
async getBatchAssets(assetIds: number[]): Promise<VestigeAsset[]> {
  const batchSize = 20; // API limit
  const batches = [];
  
  for (let i = 0; i < assetIds.length; i += batchSize) {
    const batch = assetIds.slice(i, i + batchSize);
    batches.push(
      fetch(`${this.baseURL}/v1/assets/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: batch }),
      }).then(res => res.json())
    );
  }
  
  const results = await Promise.all(batches);
  return results.flat();
}
```

## 🚀 Next Steps

### To Be Automated by Agent

- [ ] Implement asset price alerts and notifications
- [ ] Add real-time WebSocket price feeds
- [ ] Create portfolio performance analytics
- [ ] Implement asset comparison tools
- [ ] Add DeFi protocol integration for yield farming data
- [ ] Create automated portfolio rebalancing suggestions
- [ ] Implement NFT metadata enrichment
- [ ] Add social sentiment analysis for assets
- [ ] Create automated asset discovery based on wallet activity
- [ ] Implement advanced charting with TradingView integration