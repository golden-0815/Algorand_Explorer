import React, { useState, useCallback } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { validateAndSanitizeInput } from '../lib/utils';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  loading?: boolean;
  size?: 'sm' | 'md';
  error?: string;
}

// Simple validation - just check if input is not empty
function validateAddress(address: string): boolean {
  return address.trim().length > 0;
}

export function AddressInput({ onSubmit, loading = false, size = 'md', error }: AddressInputProps) {
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setLocalError(''); // Clear error on input change
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    const validation = validateAndSanitizeInput(trimmedInput);
    if (!validation.isValid) {
      setLocalError(validation.error || 'Please enter a valid input');
      return;
    }
    setLocalError('');
    onSubmit(validation.sanitized);
  }, [input, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const inputClasses = size === 'sm'
    ? 'w-full px-3 py-1.5 text-sm min-h-[44px]'
    : 'w-full px-4 py-3 min-h-[48px]';
  
  const buttonSize = size === 'sm' ? 'h-11 w-11' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 18 : 20;

  // For animated width
  const wrapperClass = size === 'sm'
    ? 'transition-all duration-300 max-w-[180px] focus-within:max-w-[600px]'
    : '';

  const displayError = error || localError;

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${wrapperClass}`}>
        <div className="flex-1 relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter Algorand address or .algo name..."
          className={`${inputClasses} bg-algo-gray border border-algo-gray-light rounded-lg 
                 text-algo-text placeholder-gray-400 focus:outline-none focus:ring-2 
                   focus:ring-algo-accent focus:border-transparent transition-all duration-200
                   ${displayError ? 'border-red-500 focus:ring-red-500' : ''}
                   touch-manipulation`}
          disabled={loading}
          aria-label="Algorand address or .algo name input"
          aria-describedby={displayError ? 'input-error' : undefined}
          aria-invalid={!!displayError}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          autoFocus
        />
          {displayError && (
            <div 
              id="input-error"
              className="absolute -bottom-6 left-0 text-red-400 text-sm flex items-center gap-1"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4" />
              {displayError}
            </div>
          )}
        </div>
        <button
          type="submit"
          aria-label="Search for wallet address"
          aria-describedby={loading ? 'loading-status' : undefined}
          disabled={loading || !input.trim()}
          className={`flex items-center justify-center bg-algo-accent text-algo-dark rounded-full 
                     hover:bg-yellow-400 active:bg-yellow-500
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 touch-manipulation
                     focus:outline-none focus:ring-2 focus:ring-algo-accent focus:ring-offset-2
                     ${buttonSize}`}
        >
          {loading ? (
            <>
              <svg 
                className="animate-spin w-5 h-5 text-gray-600" 
                viewBox="0 0 24 24" 
                fill="none"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span id="loading-status" className="sr-only">Loading...</span>
            </>
          ) : (
            <Search 
              style={{ width: iconSize, height: iconSize }} 
              aria-hidden="true"
            />
          )}
        </button>
      </form>
      </div>
  );
}