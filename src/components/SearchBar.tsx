import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { debounce } from '../lib/utils';
import { validateAndSanitizeInput } from '../lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
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

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
  className
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function - only for auto-complete suggestions, not actual search
  const debouncedSearch = useRef(
    debounce((searchTerm: string) => {
      // Only show dropdown suggestions, don't trigger actual search
      if (searchTerm.trim() && recent.length > 0) {
        setShowDropdown(true);
      }
    }, 500) // Increased to 500ms
  ).current;

  // Load recent searches from localStorage
  useEffect(() => {
    const loadRecent = () => {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecent(parsed);
      } else {
        setRecent([]);
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

  // Hide dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const saveRecent = (val: string) => {
    const updated = [val, ...recent.filter((r) => r !== val)].slice(0, RECENT_LIMIT);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    // Dispatch custom event to notify other SearchBar instances
    window.dispatchEvent(new CustomEvent('recentSearchesUpdated'));
  };

  const handleSearch = (val?: string) => {
    const searchVal = (val ?? query).trim();
    const validation = validateAndSanitizeInput(searchVal);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid input');
      return;
    }
    setError(null);
    if (onSearch) {
      onSearch(validation.sanitized);
      saveRecent(validation.sanitized);
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === 'ArrowDown' && recent.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (recent.length > 0) setShowDropdown(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow click
    setTimeout(() => setShowDropdown(false), 100);
  };

  const clearRecent = (e: React.MouseEvent) => {
    e.preventDefault();
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
    // Dispatch custom event to notify other SearchBar instances
    window.dispatchEvent(new CustomEvent('recentSearchesCleared'));
  };

  // Handle input change - only show dropdown, don't trigger search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Only trigger dropdown suggestions, not actual search
    debouncedSearch(value);
    
    if (recent.length > 0 && value.trim()) setShowDropdown(true);
  };

  return (
    <div className={cn("relative max-w-md w-full", className)}>
      <div 
        className={cn(
          "relative flex items-center rounded-md border-2 bg-algo-dark shadow-lg transition-all duration-200",
          isFocused 
            ? "border-algo-accent shadow-algo-accent/20" 
            : "border-algo-gray-light hover:border-algo-accent/50"
        )}
        role="search"
        aria-label="Search for wallet address"
      >
        <Input
          id="header-search"
          name="header-search"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 border-0 bg-transparent px-4 py-3 pr-12 text-algo-text placeholder:text-algo-gray-light focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Enter wallet address or .algo name"
          autoComplete="off"
          autoFocus
        />
        <Button
          type="button"
          onClick={() => handleSearch(query)}
          size="icon"
          className={cn(
            "absolute right-1 h-8 w-8 rounded-md bg-gradient-to-r from-algo-accent to-algo-accent/80 transition-all duration-200",
            "hover:scale-105 hover:shadow-lg active:scale-95",
            query.trim() 
              ? "opacity-100" 
              : "opacity-70 hover:opacity-100"
          )}
          aria-label="Search for wallet"
          disabled={!query.trim()}
        >
          <Search className="h-4 w-4 text-algo-dark" aria-hidden="true" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      {error && (
        <div className="text-red-400 text-xs mt-1 ml-1 tracking-tight" role="alert" aria-live="polite">{error}</div>
      )}
      {/* Recent Searches Dropdown */}
      {showDropdown && recent.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 z-20 mt-1 w-full rounded-md bg-algo-dark border border-algo-gray-light shadow-lg overflow-hidden"
          role="listbox"
          aria-label="Recent searches"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-algo-gray-light bg-algo-dark/80">
            <span className="text-xs text-algo-text tracking-tight">Recent searches</span>
            <button
              onClick={clearRecent}
              className="text-xs text-algo-text hover:text-algo-accent transition-colors flex items-center gap-1"
              aria-label="Clear recent searches"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
          {recent.map((item, idx) => (
            <button
              key={item + idx}
              className="w-full text-left px-4 py-2 text-sm text-algo-text hover:bg-algo-accent/10 focus:bg-algo-accent/20 transition-colors truncate"
              onMouseDown={() => {
                setQuery(item);
                handleSearch(item);
              }}
              role="option"
              tabIndex={-1}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 