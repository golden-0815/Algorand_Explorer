import { useMemo } from 'react';
import { EvaluatedAccount } from '../types/asastats';

export function usePortfolioBreakdown(data: EvaluatedAccount | null) {
  return useMemo(() => {
    if (!data) return null;

    const breakdown = {
      Liquid: 0,
      Staked: 0,
      Vault: 0,
      LP: 0,
      Debt: 0,
      Claimable: 0,
      NFT: parseFloat(data.total.nft || '0'),
    };

    data.asaitems.forEach(item => {
      item.programs.forEach(program => {
        const value = parseFloat(program.value);
        
        // Liquid assets
        if (['Balance', 'Value', 'Size'].includes(program.program.type)) {
          breakdown.Liquid += value;
        }
        // Staked assets
        else if (['Staked', 'Delegated', 'Committed'].includes(program.program.type) || 
                 (program.program.type === 'Amount' && (program.program.name || '').toLowerCase().includes('dualstake'))) {
          breakdown.Staked += value;
        }
        // Vault/Locked assets
        else if (['Locked', 'Vault'].includes(program.program.type) || 
                 (program.program.type === 'Amount' && (program.program.name || '').toLowerCase().includes('vault'))) {
          breakdown.Vault += value;
        }
        // LP assets
        else if (['Added'].includes(program.program.type) || 
                 (program.program.type === 'Amount' && (program.program.name || '').toLowerCase().includes('lofty amm') && 
                  (program.program.provider?.name || '').toLowerCase().includes('lofty'))) {
          breakdown.LP += value;
        }
        // Debt
        else if (['Borrowed', 'Debt'].includes(program.program.type)) {
          breakdown.Debt += value;
        }
        // Claimable assets
        else if (['Withdrawal', 'Claimable', 'Pre-minted'].includes(program.program.type)) {
          breakdown.Claimable += value;
        }
      });
    });

    return breakdown;
  }, [data]);
} 