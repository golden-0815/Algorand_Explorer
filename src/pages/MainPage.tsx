import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Coins } from 'lucide-react';
import { HeroSearchBar } from '../components/HeroSearchBar';

export function MainPage() {
  const navigate = useNavigate();
  const handleSearch = (address: string) => {
    navigate(`/wallet/${address}`);
  };
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-algo-dark text-algo-text flex items-center justify-center px-4 py-8">
      <div className="container mx-auto max-w-6xl w-full">
        {/* Header with enhanced animations */}
        <div className="text-center mb-6 md:mb-8 slide-up">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-algo-accent mb-2 md:mb-3 tracking-tight">
            AlgoExplorer
            </h1>
          <p className="text-white max-w-2xl mx-auto text-sm md:text-base fade-in leading-relaxed px-4">
            Enter an Algorand address or .algo name to explore portfolio holdings, ASA tokens, and NFT collections.
          </p>
        </div>
        {/* Hero Search Bar */}
        <div className="mb-6 md:mb-8">
          <HeroSearchBar onSearch={handleSearch} />
        </div>
        {/* Feature Cards with Hover Effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="card-hover bg-algo-dark/50 border border-algo-gray-light rounded-lg p-4 md:p-6 text-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-algo-accent to-yellow-400 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-algo-dark" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-algo-accent mb-1">Smart Search</h3>
            <p className="text-white text-xs leading-relaxed">
              Type less, discover more. Search by wallet or .algo NFD with your recent lookups.
            </p>
          </div>
          <div className="card-hover bg-algo-dark/50 border border-algo-gray-light rounded-lg p-3 md:p-4 text-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-algo-dark" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-algo-accent mb-1">DeFi Analytics</h3>
            <p className="text-white text-xs leading-relaxed">
              Track 17+ protocols across staking, lending, liquidity, and governance positions.
            </p>
              </div>
          <div className="card-hover bg-algo-dark/50 border border-algo-gray-light rounded-lg p-3 md:p-4 text-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-algo-dark" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-algo-accent mb-1">Portfolio Insights</h3>
            <p className="text-white text-xs leading-relaxed">
              Comprehensive view of ASA tokens, NFT collections, and real-time market data.
              </p>
            </div>
        </div>
        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div className="stat-card bg-algo-dark/50 border border-algo-gray-light rounded-lg p-2 md:p-3 text-center">
            <div className="text-base md:text-lg font-bold text-algo-accent">15,000+</div>
            <div className="text-xs text-white tracking-tight">ASA Tokens Indexed</div>
          </div>
          <div className="stat-card bg-algo-dark/50 border border-algo-gray-light rounded-lg p-2 md:p-3 text-center">
            <div className="text-base md:text-lg font-bold text-algo-accent">3,000+</div>
            <div className="text-xs text-white tracking-tight">NFT Collections</div>
          </div>
          <div className="stat-card bg-algo-dark/50 border border-algo-gray-light rounded-lg p-2 md:p-3 text-center">
            <div className="text-base md:text-lg font-bold text-algo-accent">17+</div>
            <div className="text-xs text-white tracking-tight">Protocols Tracked</div>
          </div>
          <div className="stat-card bg-algo-dark/50 border border-algo-gray-light rounded-lg p-2 md:p-3 text-center">
            <div className="text-base md:text-lg font-bold text-algo-accent">99.99%</div>
            <div className="text-xs text-white tracking-tight">API Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
}