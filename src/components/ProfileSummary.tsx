import React, { useState } from 'react';
import { 
  TrendingUp, 
  Minus, 
  Plus, 
  ChevronRight, 
  Copy, 
  Check,
  Shield,
  Vault,
  Layers,
  ArrowUpDown,
  BadgeDollarSign,
  Crown,
  Star,
  Zap,
  ChevronDown,
  Wallet,
  Image
} from 'lucide-react';
import { EvaluatedAccount } from '../types/asastats';
import { Avatar } from './Avatar';
import numeral from 'numeral';
import '../lib/numeralConfig';

function formatALGO(value: number | string | undefined | null): string {
  let num = 0;
  if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  }
  if (!isFinite(num) || isNaN(num)) num = 0;
  if (num === 0) return '0 Ⱥ';
  if (num < 0) return `${numeral(num).format('0.00')} Ⱥ`;
  if (num > 0 && num < 1) return `${numeral(num).format('0.000000')} Ⱥ`;
  if (num < 1000) return `${numeral(num).format('0.[00]')} Ⱥ`;
  if (num < 1_000_000) return `${numeral(num).format('0,0.[00]')} Ⱥ`;
  return `${numeral(num).format('0.00a')} Ⱥ`;
}

function getProgramIcon(type: string, name?: string, providerName?: string) {
  const progName = (name || '').replace(/['"\s]/g, '').toLowerCase();
  const providerNorm = (providerName || '').replace(/['"\s]/g, '').toLowerCase();
  if (type === 'Amount' && progName.includes('dualstake')) return <Shield className="w-5 h-5" />;
  if (type === 'Amount' && progName.includes('vault')) return <Vault className="w-5 h-5" />;
  if (type === 'Amount' && progName.includes('loftyamm') && providerNorm.includes('lofty')) return <Layers className="w-5 h-5" />;
  switch (type) {
    case 'Borrowed':
    case 'Debt':
      return <ArrowUpDown className="w-5 h-5" />;
    case 'Vault':
    case 'Locked':
    case 'Committed':
      return <Vault className="w-5 h-5" />;
    case 'Withdrawal':
    case 'Claimable':
    case 'Pre-minted':
      return <BadgeDollarSign className="w-5 h-5" />;
    case 'Staked':
    case 'Delegated':
      return <Shield className="w-5 h-5" />;
    case 'Added':
    case 'Liquidity':
      return <Layers className="w-5 h-5" />;
    case 'Balance':
    case 'Amount':
    case 'Value':
    case 'Size':
      return <Wallet className="w-5 h-5" />;
    default:
      return <Wallet className="w-5 h-5" />;
  }
}

export function getProgramColor(type: string, name?: string, providerName?: string) {
  const progName = (name || '').replace(/['"\s]/g, '').toLowerCase();
  const providerNorm = (providerName || '').replace(/['"\s]/g, '').toLowerCase();
  if (type === 'Amount' && progName.includes('dualstake')) return '#818cf8'; // indigo
  if (type === 'Amount' && progName.includes('vault')) return '#a78bfa'; // purple
  if (type === 'Amount' && progName.includes('loftyamm') && providerNorm.includes('lofty')) return '#60a5fa'; // blue
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
      return '#818cf8'; // indigo
    case 'Added':
    case 'Liquidity':
      return '#60a5fa'; // blue
    case 'Balance':
    case 'Amount':
    case 'Value':
    case 'Size':
      return '#f1cb83'; // algo-accent
    default:
      return '#f1cb83';
  }
}

function hasASASTATSBadge(data: EvaluatedAccount): boolean {
  return data.asaitems?.some(item => item.asset.id === 393537671 && item.amount > 1) || false;
}

interface ProfileSummaryProps {
  data: EvaluatedAccount;
  nfdName?: string;
}

const programCategories = [
  {
    label: 'NFT Portfolio',
    types: ['NFT'],
    icon: <Image className="w-5 h-5" />,
    color: '#ec4899',
    description: 'Collectible assets'
  },
  {
    label: 'Vault Assets',
    types: ['Locked', 'Vault'],
    icon: getProgramIcon('Locked'),
    color: getProgramColor('Locked'),
    description: 'Locked & vaulted funds'
  },
  {
    label: 'DeFi Debt',
    types: ['Borrowed', 'Debt'],
    icon: getProgramIcon('Borrowed'),
    color: getProgramColor('Borrowed'),
    description: 'Borrowed positions'
  },
  {
    label: 'Claimable',
    types: ['Withdrawal', 'Claimable', 'Pre-minted'],
    icon: getProgramIcon('Claimable'),
    color: getProgramColor('Claimable'),
    description: 'Available to claim'
  }
];

export function ProfileSummary({ data, nfdName }: ProfileSummaryProps) {
  const [includeNFTs, setIncludeNFTs] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [coreOpen, setCoreOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (data?.account_info?.addresses?.[0]) {
      try {
        await navigator.clipboard.writeText(data.account_info.addresses[0]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Silent fail for clipboard operations
      }
    }
  };

  const handlePortfolioToggle = () => {
    setIncludeNFTs(!includeNFTs);
  };

  const handleCategoryChange = () => {
    const nextIndex = (selectedCategoryIndex + 1) % programCategories.length;
    setSelectedCategoryIndex(nextIndex);
  };

  // Check for Reti Staking specifically
  const hasRetiStaking = () => {
    let hasReti = false;
    
    data?.asaitems?.forEach(item => {
      item?.programs?.forEach(program => {
        if (program?.program?.type === 'Staked' && program?.program?.name === 'Reti Pooling') {
          hasReti = true;
        }
      });
    });
    
    return hasReti;
  };

  // Portfolio tier system
  function getPortfolioTierName(value: number): string {
    if (value >= 10_000_000) return "Whale";
    if (value >= 1_000_000) return "Titan";
    if (value >= 100_000) return "Elite";
    if (value >= 5_000) return "Strategist";
    if (value >= 100) return "Hodler";
    return "Dust";
  }

  function getTierColor(tier: string): string {
    switch (tier) {
      case "Whale": return "bg-purple-500/20 border-purple-500/30 text-purple-400";
      case "Titan": return "bg-red-500/20 border-red-500/30 text-red-400";
      case "Elite": return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
      case "Strategist": return "bg-green-500/20 border-green-500/30 text-green-400";
      case "Hodler": return "bg-blue-500/20 border-blue-500/30 text-blue-400";
      case "Dust": return "bg-gray-500/20 border-gray-500/30 text-gray-400";
      default: return "bg-gray-500/20 border-gray-500/30 text-gray-400";
    }
  }

  const hasReti = hasRetiStaking();
  const hasASASTATS = hasASASTATSBadge(data);

  const calculateCategoryValue = (categoryTypes: string[]) => {
    let total = 0;
    
    // Special case for NFT Collection - get from total data
    if (categoryTypes.includes('NFT')) {
      const nftValue = parseFloat(data?.total?.nft || '0');
      const valueInALGO = data?.account_info?.values_in === 'ALGO' 
        ? nftValue 
        : nftValue / parseFloat(data?.total?.priceusdc || '1');
      return valueInALGO;
    }
    
    data?.asaitems?.forEach((item) => {
      item?.programs?.forEach((program) => {
        const programType = program?.program?.type;
        const programName = program?.program?.name;
        
        const programValue = parseFloat(program?.value || '0');
        const valueInALGO = data?.account_info?.values_in === 'ALGO' 
          ? programValue 
          : programValue / parseFloat(data?.total?.priceusdc || '1');
        
        // Special case for Governance: include Staked programs with name "Reti Pooling"
        if (categoryTypes.includes('Delegated') && categoryTypes.includes('Committed')) {
          // This is the Governance category
          if (categoryTypes.includes(programType) || 
              (programType === 'Staked' && programName === 'Reti Pooling')) {
            total += valueInALGO;
          }
        } else {
          // Regular category calculation
          if (categoryTypes.includes(programType)) {
            total += valueInALGO;
          }
          // Special case: Amount type with dualSTAKE name should be treated as staking
          if (programType === 'Amount' && program?.program?.name === 'dualSTAKE' && 
              (categoryTypes.includes('Staked') || categoryTypes.includes('Delegated'))) {
            total += valueInALGO;
          }
        }
      });
    });
    
    return total;
  };

  const calculateProgramBreakdown = () => {
    const breakdown = {
      liquid_balance: 0,
      staked_value: 0,
      defi_active: 0,
      defi_lending: 0,
      defi_borrowed: 0,
      locked_assets: 0,
      pending_actions: 0,
    };

    data?.asaitems?.forEach((item) => {
      item?.programs?.forEach((program) => {
        const programValue = parseFloat(program?.value || '0');
        const valueInALGO = data?.account_info?.values_in === 'ALGO' 
          ? programValue 
          : programValue / parseFloat(data?.total?.priceusdc || '1');
        const type = program?.program?.type;

        switch (type) {
          case 'Balance':
          case 'Value':
          case 'Size':
            breakdown.liquid_balance += valueInALGO;
            break;
          case 'Staked':
            breakdown.staked_value += valueInALGO;
            break;
          case 'Delegated':
            breakdown.staked_value += valueInALGO;
            break;
          case 'Committed':
            breakdown.staked_value += valueInALGO;
            break;
          case 'Amount':
            // Special case: Amount type with dualSTAKE name should be treated as staking
            if (program?.program?.name === 'dualSTAKE') {
              breakdown.staked_value += valueInALGO;
            } else {
              breakdown.defi_active += valueInALGO;
              breakdown.defi_lending += valueInALGO;
            }
            break;
          case 'Supplied':
          case 'Collateral':
          case 'Deposited':
            breakdown.defi_active += valueInALGO;
            breakdown.defi_lending += valueInALGO;
            break;
          case 'Liquidity':
            breakdown.defi_active += valueInALGO;
            break;
          case 'Locked':
          case 'Vault':
            breakdown.locked_assets += valueInALGO;
            break;
          case 'Borrowed':
          case 'Debt':
            breakdown.defi_borrowed += valueInALGO;
            break;
          case 'Withdrawal':
          case 'Claimable':
          case 'Pre-minted':
            breakdown.pending_actions += valueInALGO;
            break;
        }
      });
    });

    return breakdown;
  };

  const portfolioValue = includeNFTs ? parseFloat(data?.total?.total || '0') : parseFloat(data?.total?.totalwonft || '0');
  const portfolioLabel = includeNFTs ? 'Including NFTs' : 'Excluding NFTs';
  const currentCategory = programCategories[selectedCategoryIndex];
  const programBreakdown = calculateProgramBreakdown();

  return (
    <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-6 mb-2">
            <Avatar 
              address={data.account_info.addresses[0]} 
              size="lg" 
              showBorder 
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-algo-text">
                {nfdName || 'Portfolio Overview'}
              </h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400 font-mono">
                  {data.account_info.addresses[0] ? 
                    `${data.account_info.addresses[0].slice(0, 6)}...${data.account_info.addresses[0].slice(-5)}` : 
                    'Address not available'
                  }
                </p>
                {data.account_info.addresses[0] && (
                  <button
                    onClick={handleCopyAddress}
                    className="text-gray-400 hover:text-algo-accent transition-colors duration-200"
                    title="Copy full address to clipboard"
                    aria-label="Copy full address to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Portfolio Tier and Reti Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Portfolio Tier Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs font-medium ${getTierColor(getPortfolioTierName(portfolioValue))}`}>
            <Crown className="w-3 h-3" />
            {getPortfolioTierName(portfolioValue)}
          </div>
          
          {/* Reti Staking Badge */}
          {hasReti && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-xs font-medium">
              <Shield className="w-3 h-3" />
              Reti
            </div>
          )}
          {hasASASTATS && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#F1CB83]/20 border border-[#F1CB83]/40 rounded-full text-[#F1CB83] text-xs font-medium">
              <Star className="w-3 h-3" />
              ASASTATS
            </div>
          )}
        </div>
      </div>

      {/* Major Portfolio Data */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="bg-algo-dark/50 rounded-lg p-4 cursor-pointer hover:bg-algo-dark/70 transition-colors"
          onClick={handlePortfolioToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePortfolioToggle();
            }
          }}
          aria-label={`Toggle portfolio view. Current: ${includeNFTs ? 'including' : 'excluding'} NFTs`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-algo-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-400">Total Portfolio</span>
            </div>
            {includeNFTs ? (
              <Minus className="w-4 h-4 text-gray-400" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4 text-gray-400" aria-hidden="true" />
            )}
          </div>
          <p className="text-2xl font-bold text-algo-text">
            {formatALGO(portfolioValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{portfolioLabel}</p>
        </div>

        <div 
          className="bg-algo-dark/50 rounded-lg p-4 cursor-pointer hover:bg-algo-dark/70 transition-colors"
          onClick={handleCategoryChange}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCategoryChange();
            }
          }}
          aria-label={`View ${currentCategory.label} category. Click to cycle through categories`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div style={{ color: currentCategory.color }}>
                {currentCategory.icon}
              </div>
              <span className="text-sm font-medium text-gray-400">{currentCategory.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold" style={{ color: currentCategory.color }}>
            {formatALGO(calculateCategoryValue(currentCategory.types))}
          </p>
          <p className="text-xs text-gray-500 mt-1">{currentCategory.description}</p>
        </div>
      </div>

      {/* Collapsible Core Holdings */}
      <div className="space-y-4">
        <button
          className="flex items-center gap-2 text-lg font-medium text-algo-text focus:outline-none hover:opacity-80 transition"
          onClick={() => setCoreOpen((v) => !v)}
          aria-expanded={coreOpen}
          aria-controls="core-holdings-content"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${coreOpen ? '' : 'rotate-[-90deg]'}`} aria-hidden="true" />
          Core Holdings
        </button>
        <div id="core-holdings-content" className={`grid grid-cols-2 gap-4 transition-all duration-200 overflow-hidden ${coreOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-algo-dark/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-algo-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-400">Available Balance</span>
            </div>
            <p className="text-xl font-bold text-algo-text">
              {formatALGO(programBreakdown.liquid_balance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ready to spend</p>
          </div>

          <div className="bg-algo-dark/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-algo-accent" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-400">Staked</span>
            </div>
            <p className="text-xl font-bold text-algo-text">
              {formatALGO(programBreakdown.staked_value)}
          </p>
            <p className="text-xs text-gray-500 mt-1">Governance, delegated, committed</p>
        </div>

        <div className="bg-algo-dark/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-algo-accent" />
              <span className="text-sm font-medium text-gray-400">DeFi Positions</span>
            </div>
            <p className="text-xl font-bold text-algo-text">
              {formatALGO(programBreakdown.defi_lending)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Supplied, collateral, deposited</p>
          </div>

          <div className="bg-algo-dark/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-algo-accent" />
              <span className="text-sm font-medium text-gray-400">Liquidity Pool</span>
            </div>
            <p className="text-xl font-bold text-algo-text">
              {formatALGO(calculateCategoryValue(['Added']))}
          </p>
            <p className="text-xs text-gray-500 mt-1">Active LP positions</p>
          </div>
        </div>
      </div>
    </div>
  );
}