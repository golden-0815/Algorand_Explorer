import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VestigeWalletValue } from '../lib/api/fetchVestige';

interface VestigeContextType {
  vestigeData: VestigeWalletValue | null;
  setVestigeData: (data: VestigeWalletValue | null) => void;
}

const VestigeContext = createContext<VestigeContextType | undefined>(undefined);

export function VestigeProvider({ children }: { children: ReactNode }) {
  const [vestigeData, setVestigeData] = useState<VestigeWalletValue | null>(null);

  const setVestigeDataWithLogging = (data: VestigeWalletValue | null) => {
    // Note: In React StrictMode (development), this may log twice due to double-invocation
    // This is expected behavior and won't happen in production
    console.log('Setting Vestige data:', data ? `Assets: ${Object.keys(data.assets).length}` : 'null');
    setVestigeData(data);
  };

  return (
    <VestigeContext.Provider value={{ vestigeData, setVestigeData: setVestigeDataWithLogging }}>
      {children}
    </VestigeContext.Provider>
  );
}

export function useVestige() {
  const context = useContext(VestigeContext);
  if (context === undefined) {
    throw new Error('useVestige must be used within a VestigeProvider');
  }
  return context;
} 