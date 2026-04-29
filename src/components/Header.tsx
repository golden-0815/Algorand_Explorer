import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { Toast } from './Toast';

interface HeaderProps {
  onSearch: (address: string) => void;
  loading?: boolean;
}

export function Header({ onSearch, loading }: HeaderProps) {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleToastClose = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-algo-dark/90 backdrop-blur w-full flex items-center justify-between px-3 sm:px-4 py-2 border-b border-algo-gray-light h-14 min-h-0" role="banner">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          title="Go to homepage"
          aria-label="Go to homepage"
        >
          <img src="/assets/finalyze-logomark.svg" alt="FINALYZE Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
          <span className="text-lg font-bold text-algo-accent tracking-tight hidden sm:inline">FINALYZE</span>
        </button>
        
        {/* Search Bar */}
        <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
          <SearchBar
            onSearch={onSearch}
            placeholder="Enter Algorand address or .algo name..."
            className="max-w-[200px] sm:max-w-sm"
          />
        </div>
      </header>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleToastClose}
        duration={toast.type === 'success' ? 3000 : 5000}
      />
    </>
  );
} 