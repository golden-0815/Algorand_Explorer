export interface VestigeWalletValue {
  assets: {
    [assetId: string]: {
      name: string;
      ticker: string;
      decimals: number;
      price: number;
      price1d: number;
      total_lockup: number;
      total_supply: number;
      labels: number[];
      image: string | null;
    };
  };
  pools: {
    [poolId: string]: {
      protocol_id: number;
      fee: number;
      token_supply: number;
      asset_1_id: number;
      asset_1_supply: number;
      asset_2_id: number;
      asset_2_supply: number;
    };
  };
  balances: {
    [assetId: string]: number;
  };
  token_balances: {
    [poolId: string]: number;
  };
  labeled_balances: Array<{
    provider: string;
    name: string;
    type: string;
    balances: {
      [assetId: string]: number;
    };
    token_balances: {
      [poolId: string]: number;
    };
  }>;
}

export async function fetchVestigeWalletValue(address: string): Promise<VestigeWalletValue> {
  try {
    const response = await fetch(
      `https://api.vestigelabs.org/wallets/${address}/value?network_id=0&denominating_asset_id=0`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Vestige API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as VestigeWalletValue;
  } catch (error) {
    console.error('Failed to fetch Vestige wallet value:', error);
    throw error;
  }
}

// Helper function to get asset image from Vestige data
export function getVestigeAssetImage(vestigeData: VestigeWalletValue | null, assetId: number): string | null {
  if (!vestigeData?.assets) return null;
  
  const asset = vestigeData.assets[assetId.toString()];
  return asset?.image || null;
}

// Helper function to get asset metadata from Vestige data
export function getVestigeAssetMetadata(vestigeData: VestigeWalletValue | null, assetId: number) {
  if (!vestigeData?.assets) return null;
  
  const asset = vestigeData.assets[assetId.toString()];
  if (!asset) return null;
  
  return {
    name: asset.name,
    ticker: asset.ticker,
    decimals: asset.decimals,
    price: asset.price,
    price1d: asset.price1d,
    image: asset.image,
  };
} 