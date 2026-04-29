import React, { useState } from 'react';
import { Card } from './ui/card';
import { Treemap, ResponsiveContainer } from 'recharts';
import { getProgramColor } from './ProfileSummary';
import numeral from 'numeral';
import { ChevronDown } from 'lucide-react';

// Usage example:
// <PortfolioTreemapCard breakdown={{ Liquid: 1200, Staked: 300, Vault: 100, LP: 50, Debt: -20, Claimable: 10, NFT: 150 }} />

// Color mapping for program types (dark mode, muted)
const programTypeColors: Record<string, string> = {
  Liquid: '#bfa76a',      // muted gold
  Staked: '#6366f1',      // indigo-500
  Vault: '#7c3aed',       // violet-600
  LP: '#2563eb',          // blue-600
  Debt: '#ef4444',        // red-500
  Claimable: '#22d3ee',   // cyan-400
  NFT: '#db2777',         // fuchsia-600
};

export function PortfolioTreemapCard({ breakdown }: { breakdown: Record<string, number> }) {
  // Legend toggle state
  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(programTypeColors).forEach(type => { initial[type] = true; });
    return initial;
  });
  const [open, setOpen] = useState(true);

  // Convert breakdown object to array for Treemap, filter by visible types
  const data = Object.entries(breakdown || {})
    .filter(([name]) => visibleTypes[name] !== false)
    .map(([name, value]) => ({ name, value }));

  const totalVisible = data.reduce((sum, d) => sum + Math.abs(d.value), 0) || 1;

  // Format value with max 2 decimals, no trailing zeros, and Algorand symbol
  function formatValue(val: number) {
    if (val === 0) return '0 Ⱥ';
    return `${numeral(val).format('0.[00]')} Ⱥ`;
  }

  function toggleType(type: string) {
    setVisibleTypes(v => ({ ...v, [type]: !v[type] }));
  }

  return (
    <Card className="p-6 bg-algo-gray border border-algo-gray-light rounded-xl" role="region" aria-label="Asset Allocation Chart">
      <button
        className="flex items-center gap-2 text-lg font-semibold text-algo-text mb-4 focus:outline-none hover:opacity-90 transition tracking-tight"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="treemap-content"
      >
        <ChevronDown className={`w-5 h-5 transition-transform ${open ? '' : 'rotate-[-90deg]'}`} aria-hidden="true" />
        Asset Allocation
      </button>
      <div id="treemap-content" className={`transition-all duration-200 overflow-hidden ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="w-full h-72" role="img" aria-label="Asset allocation treemap chart">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="value"
              nameKey="name"
              stroke="#222"
              fill="#8884d8"
              aspectRatio={4/3}
              content={({ x, y, width, height, name, value, ...rest }) => {
                const isSmall = width < 80 || height < 40;
                const drawWidth = Math.max(width - 2, 0);
                const drawHeight = Math.max(height - 2, 0);
                const color = programTypeColors[name] || '#8884d8';
                const label = formatValue(value);
                
                return (
                  <g key={`${name}-${value}`}>
                    {!isSmall ? (
                      <g>
                        <rect x={x} y={y} width={drawWidth} height={drawHeight} fill={color} stroke="#222" rx={4} />
                        <title>{name}: {label}</title>
                        <text x={x + 6} y={y + 18} fontSize={12} fill="#fff" fontWeight="bold">
                          {name}
                        </text>
                        <text x={x + 6} y={y + 34} fontSize={11} fill="#fff">
                          {label}
                        </text>
                      </g>
                    ) : (
                      <g>
                        <rect x={x} y={y} width={drawWidth} height={drawHeight} fill={color} stroke="#222" rx={4} />
                        <title>{name}: {label}</title>
                        <text x={x + 6} y={y + 18} fontSize={12} fill="#fff" fontWeight="bold">
                          {name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }}
            />
          </ResponsiveContainer>
        </div>
        {/* Interactive Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4" role="group" aria-label="Asset type legend">
          {Object.entries(programTypeColors).map(([type, color]) => {
            const value = breakdown[type] || 0;
            const isVisible = visibleTypes[type];
            
            return (
              <button
                key={type}
                type="button"
                className={`flex items-center gap-2 text-xs focus:outline-none transition-opacity p-2 rounded-md hover:bg-algo-dark/50 ${
                  isVisible ? '' : 'opacity-40 grayscale'
                }`}
                onClick={() => toggleType(type)}
                aria-pressed={isVisible}
                aria-label={`Toggle ${type} visibility. Current: ${isVisible ? 'visible' : 'hidden'}`}
              >
                <span 
                  className="inline-block w-3 h-3 rounded flex-shrink-0" 
                  style={{ background: color }} 
                  aria-hidden="true"
                />
                <span className="text-algo-text font-medium truncate">{type}</span>
                <span style={{ color: '#F1CB83' }} className="text-xs font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{formatValue(value)} ({((Math.abs(value)/totalVisible)*100).toFixed(0)}%)</span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
} 