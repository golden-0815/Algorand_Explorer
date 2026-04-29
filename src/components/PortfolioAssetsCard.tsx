import React, { useState, useMemo } from 'react';
import { AssetCardList } from './AssetCard';
import { NFTPreviewList } from './NFTPreviewList';
import { Card } from './ui/card';
import { Coins, Image, Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { NFTCollection } from '../types/asastats';


interface PortfolioAssetsCardProps {
  assets: any[];
  nftcollections: NFTCollection[];
  valuesIn?: 'ALGO' | 'USD';
  algoPrice?: number;
  loading?: boolean;
  totalAlgoValue?: string;
}



export const PortfolioAssetsCard: React.FC<PortfolioAssetsCardProps> = ({
  assets,
  nftcollections,
  valuesIn = 'ALGO',
  algoPrice,
  loading = false,
  totalAlgoValue,
}) => {
  const [tab, setTab] = useState<'tokens' | 'collectibles'>('tokens');
  const [expandedAll, setExpandedAll] = useState<'collapsed' | undefined>(undefined);
  const [individualToggles, setIndividualToggles] = useState<{ [id: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProgramTypes, setSelectedProgramTypes] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [valueRange, setValueRange] = useState<{ min: string; max: string }>({ min: '', max: '' });

  // Calculate total NFT count from all collections
  const totalNFTCount = nftcollections?.reduce((total, collection) => total + (collection?.nfts?.length || 0), 0) || 0;

  // --- BEGIN: programBreakdown logic (copied from ProfileSummary) ---
  function calculateProgramBreakdown() {
    const breakdown = {
      liquid_balance: 0,
      staked_value: 0,
      defi_active: 0,
      defi_lending: 0,
      defi_borrowed: 0,
      locked_assets: 0,
      pending_actions: 0,
    };
    assets?.forEach((item) => {
      item?.programs?.forEach((program: any) => {
        const programValue = parseFloat(program?.value || '0');
        const type = program?.program?.type;
        switch (type) {
          case 'Balance':
          case 'Value':
          case 'Size':
            breakdown.liquid_balance += programValue;
            break;
          case 'Staked':
            breakdown.staked_value += programValue;
            break;
          case 'Delegated':
            breakdown.staked_value += programValue;
            break;
          case 'Committed':
            breakdown.staked_value += programValue;
            break;
          case 'Amount':
            if (program?.program?.name === 'dualSTAKE') {
              breakdown.staked_value += programValue;
            } else {
              breakdown.defi_active += programValue;
              breakdown.defi_lending += programValue;
            }
            break;
          case 'Supplied':
          case 'Collateral':
          case 'Deposited':
            breakdown.defi_active += programValue;
            breakdown.defi_lending += programValue;
            break;
          case 'Liquidity':
            breakdown.defi_active += programValue;
            break;
          case 'Locked':
          case 'Vault':
            breakdown.locked_assets += programValue;
            break;
          case 'Borrowed':
          case 'Debt':
            breakdown.defi_borrowed += programValue;
            break;
          case 'Withdrawal':
          case 'Claimable':
          case 'Pre-minted':
            breakdown.pending_actions += programValue;
            break;
        }
      });
    });
    return breakdown;
  }
  const programBreakdown = calculateProgramBreakdown();
  // --- END: programBreakdown logic ---

  // Get all unique program types and providers from assets
  const allProgramTypes = useMemo(() => {
    const types = new Set<string>();
    assets?.forEach(asset => {
      asset?.programs?.forEach((program: any) => {
        if (program?.program?.type) {
          types.add(program.program.type);
        }
      });
    });
    return Array.from(types).sort();
  }, [assets]);

  const allProviders = useMemo(() => {
    const providers = new Set<string>();
    assets?.forEach(asset => {
      asset?.programs?.forEach((program: any) => {
        if (program?.program?.provider?.name) {
          providers.add(program.program.provider.name);
        }
      });
    });
    return Array.from(providers).sort();
  }, [assets]);

  // Filter assets based on search term and advanced filters
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Text search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(asset => 
        asset?.asset?.name?.toLowerCase().includes(term) ||
        asset?.asset?.unit?.toLowerCase().includes(term) ||
        asset?.asset?.id?.toString().includes(term)
      );
    }

    // Program type filter
    if (selectedProgramTypes.length > 0) {
      filtered = filtered.filter(asset => 
        asset?.programs?.some((program: any) => 
          selectedProgramTypes.includes(program?.program?.type)
        )
      );
    }

    // Provider filter
    if (selectedProviders.length > 0) {
      filtered = filtered.filter(asset => 
        asset?.programs?.some((program: any) => 
          program?.program?.provider?.name && 
          selectedProviders.includes(program.program.provider.name)
        )
      );
    }

    // Value range filter
    if (valueRange.min || valueRange.max) {
      filtered = filtered.filter(asset => {
        const assetValue = parseFloat(asset?.value || '0');
        const minValue = valueRange.min ? parseFloat(valueRange.min) : 0;
        const maxValue = valueRange.max ? parseFloat(valueRange.max) : Infinity;
        return assetValue >= minValue && assetValue <= maxValue;
      });
    }

    return filtered;
  }, [assets, searchTerm, selectedProgramTypes, selectedProviders, valueRange]);

  const handleTab = (newTab: 'tokens' | 'collectibles') => {
    setTab(newTab);
    setExpandedAll(undefined); // Reset expand/collapse state when switching tabs
    setIndividualToggles({});
    setSearchTerm(''); // Clear search when switching tabs
    setSelectedProgramTypes([]); // Clear filters when switching tabs
    setSelectedProviders([]);
    setValueRange({ min: '', max: '' });
  };

  const handleToggleIndividual = (id: number) => {
    setExpandedAll(undefined);
    setIndividualToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedProgramTypes([]);
    setSelectedProviders([]);
    setValueRange({ min: '', max: '' });
  };

  const toggleProgramType = (type: string) => {
    setSelectedProgramTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const hasActiveFilters = searchTerm || selectedProgramTypes.length > 0 || selectedProviders.length > 0 || valueRange.min || valueRange.max;

  return (
    <Card className="rounded-xl bg-algo-gray border border-algo-gray-light overflow-hidden" role="region" aria-label="Portfolio Assets">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between border-b border-algo-gray-light px-2 sm:px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1">
            <div className="bg-algo-dark/50 p-1 gap-1 rounded-md border border-algo-gray-light inline-flex" role="tablist" aria-label="Asset categories">
              <button
                onClick={() => handleTab('tokens')}
                role="tab"
                aria-selected={tab === 'tokens'}
                aria-controls="tokens-panel"
                className={`rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium tracking-tight transition-all duration-200 ease-out flex items-center gap-1 sm:gap-2 ${
                  tab === 'tokens' 
                    ? 'bg-algo-accent text-algo-dark shadow-sm scale-105' 
                    : 'text-algo-text hover:bg-algo-dark/50 hover:scale-102'
                }`}
              >
                <Coins className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Tokens</span>
                <span className="sm:hidden">Tokens</span>
                <span className="text-xs opacity-70 ml-1 tracking-tight">({filteredAssets?.length || 0})</span>
              </button>
              <button
                onClick={() => handleTab('collectibles')}
                role="tab"
                aria-selected={tab === 'collectibles'}
                aria-controls="collectibles-panel"
                className={`rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium tracking-tight transition-all duration-200 ease-out flex items-center gap-1 sm:gap-2 ${
                  tab === 'collectibles' 
                    ? 'bg-algo-accent text-algo-dark shadow-sm scale-105' 
                    : 'text-algo-text hover:bg-algo-dark/50 hover:scale-102'
                }`}
              >
                <Image className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Collectibles</span>
                <span className="sm:hidden">NFTs</span>
                <span className="text-xs opacity-70 ml-1 tracking-tight">({totalNFTCount})</span>
              </button>
            </div>
          </div>
        </div>
        {/* Removed duplicate Filters and Collapse All buttons from here */}
      </div>

      {/* Search and Filters - Only show for tokens tab */}
      {tab === 'tokens' && (
        <div className="px-2 sm:px-4 py-3 border-b border-algo-gray-light space-y-3">
          {/* Search Bar and Action Buttons Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-algo-gray-light" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search assets by name, symbol, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-algo-dark/50 border border-algo-gray-light rounded-md text-algo-text placeholder-algo-gray-light focus:outline-none focus:border-algo-accent transition-all duration-200 text-sm tracking-tight"
                aria-label="Search assets"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-algo-gray-light hover:text-algo-text transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-1 sm:gap-2 min-w-[100px] sm:min-w-[120px] text-xs px-2 sm:px-3 py-1.5 rounded-md bg-algo-dark/50 text-algo-text hover:bg-algo-accent hover:text-algo-dark border border-algo-gray-light hover:border-algo-accent transition-all duration-200 ease-out hover:scale-105 font-medium tracking-tight"
                aria-label={`${showFilters ? 'Hide' : 'Show'} advanced filters`}
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-algo-accent rounded-full ml-1" aria-label="Active filters"></span>
                )}
                {showFilters ? (
                  <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 ml-1" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Clear All Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 font-medium tracking-tight"
                aria-label="Clear all filters"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 pt-2 border-t border-algo-gray-light">
              {/* Program Type Filter */}
              <div>
                <h4 className="text-sm font-medium text-algo-text mb-2 tracking-tight">Types</h4>
                <div className="flex flex-wrap gap-2">
                  {allProgramTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleProgramType(type)}
                      className={`px-3 py-1 text-xs rounded-md border transition-all duration-200 tracking-tight ${
                        selectedProgramTypes.includes(type)
                          ? 'bg-algo-accent text-algo-dark border-algo-accent'
                          : 'bg-algo-dark/50 text-algo-text border-algo-gray-light hover:bg-algo-dark/70'
                      }`}
                      aria-label={`${selectedProgramTypes.includes(type) ? 'Remove' : 'Add'} ${type} filter`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Filter */}
              <div>
                <h4 className="text-sm font-medium text-algo-text mb-2 tracking-tight">Providers</h4>
                <div className="flex flex-wrap gap-2">
                  {allProviders.map(provider => (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`px-3 py-1 text-xs rounded-md border transition-all duration-200 tracking-tight ${
                        selectedProviders.includes(provider)
                          ? 'bg-algo-accent text-algo-dark border-algo-accent'
                          : 'bg-algo-dark/50 text-algo-text border-algo-gray-light hover:bg-algo-dark/70'
                      }`}
                      aria-label={`${selectedProviders.includes(provider) ? 'Remove' : 'Add'} ${provider} filter`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Range Filter */}
              <div>
                <h4 className="text-sm font-medium text-algo-text mb-2 tracking-tight">Value Range (ALGO)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={valueRange.min}
                    onChange={(e) => setValueRange(prev => ({ ...prev, min: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs bg-algo-dark/50 border border-algo-gray-light rounded-md text-algo-text placeholder-algo-gray-light focus:outline-none focus:border-algo-accent transition-all duration-200 tracking-tight"
                    aria-label="Minimum value"
                  />
                  <span className="text-algo-gray-light text-xs self-center">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={valueRange.max}
                    onChange={(e) => setValueRange(prev => ({ ...prev, max: e.target.value }))}
                    className="flex-1 px-3 py-2 text-xs bg-algo-dark/50 border border-algo-gray-light rounded-md text-algo-text placeholder-algo-gray-light focus:outline-none focus:border-algo-accent transition-all duration-200 tracking-tight"
                    aria-label="Maximum value"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {(searchTerm || selectedProgramTypes.length > 0 || selectedProviders.length > 0 || valueRange.min || valueRange.max) && (
            <div className="text-xs text-algo-text tracking-tight">
              Showing {filteredAssets.length} of {assets.length} assets
              {filteredAssets.length === 0 && (
                <span className="text-red-400 ml-2">No assets match your filters</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content with smooth transitions */}
      <div className="px-2 sm:px-4 pt-0 pb-4">
        <div className="transition-all duration-300 ease-out">
          {tab === 'tokens' ? (
            <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300" role="tabpanel" id="tokens-panel" aria-label="Token assets">
              <AssetCardList
                assets={filteredAssets}
                valuesIn={valuesIn}
                algoPrice={algoPrice}
                loading={loading}
                expandedAll={expandedAll}
                onToggleIndividual={handleToggleIndividual}
                individualToggles={individualToggles}
                totalAlgoValue={totalAlgoValue}
              />
            </div>
          ) : (
            <div className="animate-in fade-in-0 slide-in-from-right-2 duration-300" role="tabpanel" id="collectibles-panel" aria-label="NFT collectibles">
              <NFTPreviewList nftcollections={nftcollections} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 