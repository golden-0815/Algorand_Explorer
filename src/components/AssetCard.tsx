import React, { memo, useState, useMemo } from 'react';
import { Coins, Vault, HandCoins, Layers, BadgeDollarSign, Shield, ArrowUpDown, Wallet, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import numeral from 'numeral';
import Decimal from 'decimal.js';
import '../lib/numeralConfig';
import { useVestige } from '../contexts/VestigeContext';
import { getVestigeAssetImage } from '../lib/api/fetchVestige';

// Types matching ASA Stats API
interface Program {
  program: {
    type: string;
    name?: string;
    provider?: { name: string; info?: string };
    url?: string;
  };
  value: string;
  amount: number;
}

interface Asset {
  asset: {
    id: number;
    name: string;
    unit: string;
    decimals: number;
    url?: string;
    verified?: boolean;
    image_url?: string;
  };
  amount: number;
  value: string;
  price: string;
  programs?: Program[];
}

interface AssetCardListProps {
  assets: Asset[];
  valuesIn?: 'ALGO' | 'USD';
  algoPrice?: number;
  className?: string;
  loading?: boolean;
  expandedAll?: 'collapsed' | undefined;
  onToggleIndividual?: (id: number) => void;
  individualToggles?: { [id: number]: boolean };
  totalAlgoValue?: string;
}

// Utility functions
const formatALGO = (value: string): string => {
  const num = parseFloat(value);
  let formatted = '';
  if (num < 1) {
    formatted = numeral(num).format('0.000000');
  } else if (num < 1000) {
    formatted = numeral(num).format('0.[00]');
  } else if (num < 1_000_000) {
    formatted = numeral(num).format('0,0.[00]');
  } else {
    formatted = numeral(num).format('0.00a');
  }
  return `${formatted} Ⱥ`;
};

const getProgramIcon = (type: string, name?: string) => {
  // Special case: Amount type with dualSTAKE name should be treated as staking
  if (type === 'Amount' && name === 'dualSTAKE') {
    return <Shield className="w-3 h-3" />;
  }
  
  switch (type) {
    case 'Borrowed':
    case 'Debt':
      return <ArrowUpDown className="w-3 h-3" />;
    case 'Vault':
    case 'Locked':
    case 'Committed':
      return <Vault className="w-3 h-3" />;
    case 'Withdrawal':
    case 'Claimable':
    case 'Pre-minted':
      return <BadgeDollarSign className="w-3 h-3" />;
    case 'Staked':
    case 'Delegated':
      return <Shield className="w-3 h-3" />;
    case 'Deposited':
    case 'Supplied':
    case 'Collateral':
      return <HandCoins className="w-3 h-3" />;
    case 'Added':
    case 'Liquidity':
      return <Layers className="w-3 h-3" />;
    case 'Balance':
    case 'Amount':
    case 'Value':
    case 'Size':
      return <Wallet className="w-3 h-3" />;
    default:
      return <Wallet className="w-3 h-3" />;
  }
};

const getProgramColor = (type: string, name?: string) => {
  // Special case: Amount type with dualSTAKE name should be treated as staking
  if (type === 'Amount' && name === 'dualSTAKE') {
    return '#818cf8'; // indigo (same as staked)
  }
  
  switch (type) {
    case 'Borrowed':
    case 'Debt':
      return '#f87171'; // red
    case 'Vault':
    case 'Locked':
    case 'Committed':
      return '#a78bfa'; // purple
    case 'Withdrawal':
    case 'Claimable':
    case 'Pre-minted':
      return '#4ade80'; // green
    case 'Staked':
    case 'Delegated':
      return '#a78bfa'; // purple (same as locked)
    case 'Deposited':
    case 'Supplied':
    case 'Collateral':
      return '#60a5fa'; // blue (Liquidity Pool)
    case 'Added':
    case 'Liquidity':
      return '#60a5fa'; // blue (Liquidity Pool)
    case 'Balance':
    case 'Amount':
    case 'Value':
    case 'Size':
      return '#f1cb83'; // algo-accent (Liquid Balance)
    default:
      return '#f1cb83'; // algo-accent (default to Liquid Balance)
  }
};

const getProgramTypeLabelColor = (type: string) => {
  const gold = '#F1CB83';
  const blue = '#60a5fa';
  const red = '#f87171';
  switch (type) {
    case 'Staked':
    case 'LiquidStaking':
    case 'Delegated':
      return '#7c3aed'; // purple (same as locked)
    case 'Balance':
    case 'Amount':
    case 'Value':
    case 'Size':
      return gold;
    case 'Vault':
    case 'Locked':
    case 'Committed':
      return '#7c3aed';
    case 'Deposited':
    case 'Supplied':
    case 'Collateral':
    case 'Added':
    case 'Liquidity':
      return blue;
    case 'Borrowed':
    case 'Debt':
      return red;
    default:
      return gold;
  }
};

const AssetCard = memo(function AssetCard({ 
  asset, 
  valuesIn, 
  algoPrice, 
  expandedAll, 
  onToggleIndividual, 
  expanded, 
  totalAlgoValue 
}: {
  asset: Asset;
  valuesIn: 'ALGO' | 'USD';
  algoPrice?: number;
  expandedAll?: 'collapsed' | undefined;
  onToggleIndividual?: (id: number) => void;
  expanded?: boolean;
  totalAlgoValue?: string;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const hasPrograms = asset.programs && asset.programs.length > 0;
  const hasMultiplePrograms = hasPrograms && asset.programs!.length > 1;
  
  // Get Vestige data from context
  const { vestigeData } = useVestige();
  
  // Image sources
  const tinymanLogoUrl = `https://asa-list.tinyman.org/assets/${asset.asset.id}/icon.png`;
  const vestigeImageUrl = getVestigeAssetImage(vestigeData, asset.asset.id);
  
  // Priority: Vestige image if available, otherwise Tinyman
  const logoUrl = vestigeImageUrl || tinymanLogoUrl;
  
  // Calculate price change percentage using decimal.js
  const priceChangeData = useMemo(() => {
    if (!vestigeData?.assets) return null;
    
    const assetData = vestigeData.assets[asset.asset.id.toString()];
    if (!assetData?.price || !assetData?.price1d) return null;
    
    try {
      const currentPrice = new Decimal(assetData.price);
      const previousPrice = new Decimal(assetData.price1d);
      
      if (previousPrice.isZero()) return null;
      
      const changePercent = currentPrice.minus(previousPrice).dividedBy(previousPrice).times(100);
      const isPositive = changePercent.isPositive();
      
      return {
        percent: changePercent.toFixed(1),
        isPositive,
        hasChange: !changePercent.isZero()
      };
    } catch (error) {
      console.warn(`Failed to calculate price change for asset ${asset.asset.id}:`, error);
      return null;
    }
  }, [vestigeData, asset.asset.id]);
  
  // Debug logging for asset images
  if (asset.asset.id === 1182620971 || asset.asset.id === 1775410837 || asset.asset.id === 2726252423) {
    console.log(`Asset ${asset.asset.id} (${asset.asset.name}):`, {
      vestigeImageUrl,
      tinymanLogoUrl,
      logoUrl,
      hasVestigeData: !!vestigeData
    });
  }
  let isExpanded = false;
  if (expandedAll === 'collapsed') {
    isExpanded = false;
  } else if (expanded !== undefined) {
    isExpanded = expanded;
  } else {
    isExpanded = internalExpanded;
  }

  const handleClick = () => {
    if (expandedAll !== undefined && onToggleIndividual) {
      onToggleIndividual(asset.asset.id);
    } else if (expanded !== undefined && onToggleIndividual) {
      onToggleIndividual(asset.asset.id);
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Memoize grouping and sorting for performance
  const groupedAndSorted = useMemo(() => {
    if (!asset?.programs) return [];
    const groupedByType = new Map<string, Map<string, { programs: Program[]; totalValue: number }>>();
    asset.programs.forEach((program) => {
      let displayType = program?.program?.type || 'Unknown';
      const progName = (program?.program?.name || '').replace(/['"\s]/g, '').toLowerCase();
      const providerNameRaw = program?.program?.provider?.name || '';
      const providerNameNorm = providerNameRaw.replace(/['"\s]/g, '').toLowerCase();
      if (program?.program?.type === 'Amount') {
        if (progName.includes('dualstake')) {
          displayType = 'Staked';
        } else if (progName.includes('vault')) {
          displayType = 'Locked';
        } else if (progName.includes('loftyamm') && providerNameNorm.includes('lofty')) {
          displayType = 'Added';
        }
      }
      const providerName = program?.program?.provider?.name || (program?.program?.name ? program.program.name.split(' ')[0] : (displayType === 'Balance' ? 'Wallet' : 'Unknown'));
      if (!groupedByType.has(displayType)) {
        groupedByType.set(displayType, new Map());
      }
      const typeGroup = groupedByType.get(displayType)!;
      if (!typeGroup.has(providerName)) {
        typeGroup.set(providerName, { programs: [], totalValue: 0 });
      }
      const providerGroup = typeGroup.get(providerName)!;
      providerGroup.programs.push(program);
      providerGroup.totalValue += parseFloat(program?.value || '0');
    });
    const typeOrder = [
      'Balance', 'Amount', 'Value', 'Size',
      'Staked', 'Delegated', 'Committed',
      'Deposited', 'Supplied', 'Collateral',
      'Added', 'Liquidity',
      'Locked', 'Vault',
      'Borrowed', 'Debt',
      'Withdrawal', 'Claimable', 'Pre-minted'
    ];
    const sortedTypes = Array.from(groupedByType.entries()).sort((a, b) => {
      const aIndex = typeOrder.indexOf(a[0]);
      const bIndex = typeOrder.indexOf(b[0]);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return sortedTypes;
  }, [asset.programs]);
  
  return (
    <div className="w-full">
      {/* Main Row */}
      <div 
        className={`flex justify-between items-center px-4 py-3 hover:bg-algo-dark/50 transition-all duration-200 min-h-[36px] cursor-pointer rounded-md`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`${asset?.asset?.name || 'Asset'} - ${formatALGO(asset?.value || '0')}. Click to ${isExpanded ? 'collapse' : 'expand'} details`}
        aria-expanded={isExpanded}
      >
        {/* Left: Asset Amount */}
        {(() => {
          const displayAmount = asset?.amount / Math.pow(10, asset?.asset?.decimals || 0);
          let formattedAmount = '';
          if (displayAmount < 1) {
            formattedAmount = numeral(displayAmount).format('0.000000');
          } else if (displayAmount < 1000) {
            formattedAmount = numeral(displayAmount).format('0.[00]');
          } else if (displayAmount < 1_000_000) {
            formattedAmount = numeral(displayAmount).format('0,0.[00]');
          } else {
            formattedAmount = numeral(displayAmount).format('0.00a');
          }
          return (
            <div className={`text-sm font-mono text-left min-w-0 flex-shrink-0 w-28 sm:w-36 md:w-44 whitespace-nowrap truncate tracking-tight ${
              parseFloat(asset?.value || '0') < 0 ? 'text-red-400' : 'text-algo-text'
            }`}>
              <div className="truncate">
                {formattedAmount} {asset?.asset?.unit || ''}
              </div>
            </div>
          );
        })()}

        {/* Center: Asset Logo or Name */}
        <div className="flex-1 flex justify-center items-center min-w-0 px-1 sm:px-2">
          {!logoError ? (
            <img 
              src={logoUrl}
              alt={`${asset?.asset?.name || 'Asset'} logo`}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain rounded-md align-middle"
              onError={() => setLogoError(true)}
              loading="lazy"
            />
          ) : (
            <span className="text-xs sm:text-sm font-medium text-algo-text truncate align-middle tracking-tight">
              {asset?.asset?.name || 'Unknown Asset'}
            </span>
          )}
        </div>
            
        {/* Right: Asset Value */}
        <div className={`text-sm font-mono text-right min-w-0 flex-shrink-0 w-24 sm:w-28 md:w-36 whitespace-nowrap tracking-tight ${
          parseFloat(asset?.value || '0') < 0 ? 'text-red-400' : 'text-algo-text'
        }`}>
          {(() => {
            // For ALGO asset (ID 0), use the total ALGO value
            if (asset?.asset?.id === 0 && totalAlgoValue) {
              return formatALGO(totalAlgoValue);
            }
            // For other assets, use the individual asset value
            return formatALGO(asset?.value || '0');
          })()}
          {/* Price Change Percentage */}
          {priceChangeData?.hasChange && (
            <div className={`text-xs font-mono tracking-tight ${
              priceChangeData.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              ({priceChangeData.isPositive ? '+' : ''}{priceChangeData.percent}%)
            </div>
          )}
        </div>
      </div>
          
      {/* Expanded Content */}
      {isExpanded && hasPrograms && (
        <div className="px-2 sm:px-4 pb-3 bg-algo-dark/30 border-t border-algo-gray-light rounded-b-md" role="region" aria-label={`${asset?.asset?.name || 'Asset'} program details`}>
          <div className="space-y-2 pt-2">
            {groupedAndSorted.map(([type, providers], typeIndex) => {
              const firstProviderGroup = providers.values().next().value;
              const firstProgram = firstProviderGroup?.programs[0];
              const programColor = getProgramColor(type, firstProgram?.program.name);
              return (
                <div key={type}>
                  {/* Type header */}
                  <div className="flex items-center gap-2 text-xs pl-2 sm:pl-4 mb-1">
                    <div style={{ color: programColor }}>
                      {getProgramIcon(type, firstProgram?.program.name)}
                    </div>
                    <span style={{ color: getProgramTypeLabelColor(type) }} className="font-mono font-semibold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{type}</span>
                  </div>
                  {/* Provider details */}
                  {Array.from(providers.entries()).map(([providerName, group]) => {
                    const firstProgram = group.programs[0];
                    const hasUrl = firstProgram.program.url || firstProgram.program.provider?.info;
                    let programNameExtra = '';
                    if (firstProgram.program.name) {
                      const clean = firstProgram.program.name.replace(providerName, '').trim();
                      if (clean && clean.toLowerCase() !== providerName.toLowerCase()) {
                        programNameExtra = clean;
                      }
                    }
                    return (
                      <div
                        key={`${type}-${providerName}`}
                        className="flex items-center text-xs pl-4 sm:pl-8 flex-wrap sm:flex-nowrap"
                        style={{ minWidth: 0 }}
                      >
                        {/* Arrow and Provider Name */}
                        <span className="flex items-center font-semibold text-algo-text mr-1 tracking-tight min-w-0">
                          <ArrowRight className="w-3 h-3 mr-1 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{providerName}</span>
                          {programNameExtra && (
                            <span className="ml-1 font-normal text-algo-gray-light hidden sm:inline">{programNameExtra}</span>
                          )}
                        </span>
                        {/* Dotted Line and Value/Link */}
                        <div className="flex-1 flex items-center min-w-0">
                          <span className="flex-grow border-t border-dotted border-algo-gray-light mx-1 sm:mx-2" style={{ minWidth: 0 }} aria-hidden="true"></span>
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <span 
                              className={`font-mono whitespace-nowrap tracking-tight text-xs sm:text-xs ${
                                type === 'Borrowed' || type === 'Debt' 
                                  ? 'text-red-400' 
                                  : 'text-algo-text'
                              }`}
                            >
                              {formatALGO(group.totalValue.toString())}
                            </span>
                            {hasUrl && (
                              <a
                                href={firstProgram.program.url || firstProgram.program.provider?.info}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-algo-accent hover:opacity-90 transition-colors duration-200 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Open provider info in new tab"
                                title="Open provider info in new tab"
                              >
                                ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

const AssetCardSkeleton = () => (
  <div className="flex justify-between items-center px-4 py-3">
    <div className="flex-1">
      <Skeleton className="h-4 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
    <Skeleton className="w-4 h-4" />
  </div>
);

export function AssetCardList({ 
  assets = [], 
  valuesIn = 'ALGO', 
  algoPrice, 
  className = '',
  loading = false,
  expandedAll,
  onToggleIndividual,
  individualToggles,
  totalAlgoValue
}: AssetCardListProps) {
  const [showAllAssets, setShowAllAssets] = useState(false);

  // Filter assets based on value threshold
  const filteredAssets = useMemo(() => {
    if (showAllAssets) return assets;
    
    return assets.filter(asset => {
      const assetValue = parseFloat(asset?.value || '0');
      // Always show ALGO (asset ID 0) regardless of value
      if (asset.asset.id === 0) return true;
      // Show assets with negative values or values >= 1 ALGO
      return assetValue < 0 || assetValue >= 1;
    });
  }, [assets, showAllAssets]);

  // Count hidden assets (those with value between 0 and 1 ALGO)
  const hiddenAssetsCount = useMemo(() => {
    return assets.filter(asset => {
      const assetValue = parseFloat(asset?.value || '0');
      return asset.asset.id !== 0 && assetValue >= 0 && assetValue < 1;
    }).length;
  }, [assets]);

  if (loading) {
    return (
      <div className={className + ' divide-y divide-algo-gray-light'} role="region" aria-label="Loading assets">
        {Array.from({ length: 5 }).map((_, i) => (
          <AssetCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(assets) || assets.length === 0) {
    return (
      <div className={className + ' p-4 text-center'} role="region" aria-label="No assets found">
        <Coins className="w-6 h-6 text-algo-gray-light mx-auto mb-2" aria-hidden="true" />
        <span className="text-sm font-mono text-algo-text tracking-tight">NO_ASSETS_FOUND</span>
        <p className="text-xs text-algo-gray-light font-mono tracking-tight">// Empty wallet</p>
      </div>
    );
  }

  return (
    <div className={className} role="list" aria-label={`Asset list with ${filteredAssets.length} items`}>
      <div className="divide-y divide-algo-gray-light">
        {filteredAssets
          .sort((a, b) => {
            // ALGO (asset ID 0) should always be first
            if (a.asset.id === 0) return -1;
            if (b.asset.id === 0) return 1;
            // Keep other assets in their original order
            return 0;
          })
          .map((asset) => (
            <div key={asset.asset.id} role="listitem">
            <AssetCard
              asset={asset}
              valuesIn={valuesIn}
              algoPrice={algoPrice}
                expandedAll={expandedAll}
                onToggleIndividual={expandedAll !== undefined ? onToggleIndividual : undefined}
                expanded={expandedAll === undefined && individualToggles ? individualToggles[asset.asset.id] : undefined}
                totalAlgoValue={totalAlgoValue}
            />
            </div>
          ))}
      </div>
      
      {/* Show All Toggle */}
      {hiddenAssetsCount > 0 && (
        <div className="pt-4 border-t border-algo-gray-light">
          <button
            onClick={() => setShowAllAssets(!showAllAssets)}
            className="w-full px-4 py-3 text-sm font-medium text-algo-accent hover:text-algo-accent/80 
                     bg-algo-dark/50 hover:bg-algo-dark/70 border border-algo-gray-light hover:border-algo-accent 
                     rounded-md transition-all duration-200 tracking-tight flex items-center justify-center gap-2"
            aria-label={`${showAllAssets ? 'Hide' : 'Show'} ${hiddenAssetsCount} assets with value between 0 and 1 ALGO`}
          >
            <Coins className="w-4 h-4" aria-hidden="true" />
            {showAllAssets ? 'Hide Small Assets' : `Show All (${hiddenAssetsCount} hidden)`}
          </button>
        </div>
      )}
    </div>
  );
} 