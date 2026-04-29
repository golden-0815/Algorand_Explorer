import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Clock, X } from 'lucide-react';
import { validateAndSanitizeInput } from '../lib/utils';

interface HeroSearchBarProps {
  onSearch: (address: string) => void;
}

const RECENT_KEY = 'recent_searches';
const RECENT_LIMIT = 8;

// Check if input looks like an Algorand address (58 chars, base32, no dots)
function isAlgorandAddress(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length === 58 && 
         /^[A-Z2-7]{58}$/.test(trimmed.toUpperCase()) && 
         !trimmed.includes('.');
}

export function HeroSearchBar({ onSearch }: HeroSearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const loadRecent = () => {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentSearches(parsed);
        } catch (error) {
          setRecentSearches([]);
        }
      } else {
        setRecentSearches([]);
      }
    };

    // Load initial data
    loadRecent();

    // Listen for custom event when recent searches are cleared
    const handleRecentCleared = () => {
      loadRecent();
    };

    // Listen for custom event when recent searches are updated
    const handleRecentUpdated = () => {
      loadRecent();
    };

    window.addEventListener('recentSearchesCleared', handleRecentCleared);
    window.addEventListener('recentSearchesUpdated', handleRecentUpdated);
    return () => {
      window.removeEventListener('recentSearchesCleared', handleRecentCleared);
      window.removeEventListener('recentSearchesUpdated', handleRecentUpdated);
    };
  }, []);

  // Save search to localStorage
  const saveSearch = (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter((r) => r !== trimmed)].slice(0, RECENT_LIMIT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    
    // Dispatch custom event to notify other SearchBar instances
    window.dispatchEvent(new CustomEvent('recentSearchesUpdated'));
  };

  // Handle search submission
  const handleSubmit = (searchTerm: string) => {
    const validation = validateAndSanitizeInput(searchTerm);
    if (!validation.isValid) {
      // Could show error message here if needed
      return;
    }
    
    onSearch(validation.sanitized);
    saveSearch(validation.sanitized);
    setInputValue('');
    setShowDropdown(false);
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  // Handle recent search selection
  const handleRecentSelect = (search: string) => {
    setInputValue(search);
    handleSubmit(search);
  };

  // Clear all recent searches
  const clearRecent = (e: React.MouseEvent) => {
    e.preventDefault();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
    // Dispatch custom event to notify other SearchBar instances
    window.dispatchEvent(new CustomEvent('recentSearchesCleared'));
  };

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8, // 8px gap
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (recentSearches.length > 0) {
      calculateDropdownPosition();
      setShowDropdown(true);
    }
  };

  // Hide dropdown on outside click and handle window resize
  useEffect(() => {
    if (!showDropdown) return;
    
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    const handleResize = () => {
      if (showDropdown) {
        calculateDropdownPosition();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [showDropdown]);

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow clicking on items
    setTimeout(() => setShowDropdown(false), 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(inputValue);
    }
    if (e.key === 'ArrowDown' && recentSearches.length > 0) {
      calculateDropdownPosition();
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto mb-12">
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            id="main-search"
            name="main-search"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (recentSearches.length > 0) {
                calculateDropdownPosition();
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Enter Algorand address or .algo name..."
            className="w-full h-14 px-6 pr-12 text-lg bg-algo-dark/50 border-2 border-algo-accent/50 rounded-lg text-algo-text placeholder-algo-gray-light focus:outline-none focus:border-algo-accent focus:bg-algo-dark/80 focus-visible:ring-2 focus-visible:ring-algo-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-algo-dark transition-all duration-300 hover:border-algo-accent/80 hover:bg-algo-dark/70 group-hover:shadow-lg group-hover:shadow-algo-accent/20 focus:shadow-xl focus:shadow-algo-accent/30"
            style={{
              fontFamily: 'Chakra Petch, monospace',
              boxShadow: 'none',
            }}
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-algo-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-md bg-gradient-to-r from-algo-accent to-algo-accent/80 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputValue.trim()}
            aria-label="Search for wallet"
          >
            <Search className="w-5 h-5 text-algo-dark" aria-hidden="true" />
            <span className="sr-only">Search</span>
          </button>
        </div>
      </form>

      {/* Recent Searches Dropdown Portal */}
      {showDropdown && recentSearches.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] border-2 border-algo-accent/50 rounded-lg bg-algo-dark/95 backdrop-blur-sm shadow-xl shadow-algo-accent/20"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          <div className="p-2">
            <div className="flex items-center justify-between px-4 py-2 border-b border-algo-accent/30">
              <span className="text-xs text-algo-text tracking-tight">Recent searches</span>
              <button
                onClick={clearRecent}
                className="text-xs text-algo-text hover:text-algo-accent transition-colors flex items-center gap-1 hover:scale-105"
                aria-label="Clear recent searches"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
            {recentSearches.map((search, index) => (
              <button
                key={search + index}
                className="w-full text-left px-4 py-3 text-sm text-algo-text hover:bg-algo-accent/10 focus:bg-algo-accent/20 transition-all duration-200 truncate flex items-center space-x-3 hover:scale-[1.02] rounded-md"
                onMouseDown={() => handleRecentSelect(search)}
                role="option"
                tabIndex={-1}
              >
                <Clock className="w-4 h-4 text-algo-accent flex-shrink-0 transition-transform duration-200 group-hover:rotate-12" />
                <span className="font-mono">{search}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 