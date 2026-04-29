import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Error handling utilities
export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function safeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
}

export function safeArray<T>(value: any, defaultValue: T[] = []): T[] {
  if (!Array.isArray(value)) {
    return defaultValue;
  }
  return value;
}

export function safeObject<T>(value: any, defaultValue: T = {} as T): T {
  if (typeof value !== 'object' || value === null) {
    return defaultValue;
  }
  return value;
}

// Validation utilities
export function isValidAlgorandAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Algorand addresses are 58 characters long and contain only A-Z, 2-7
  return /^[A-Z2-7]{58}$/.test(address);
}

export function isValidNFDName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  // NFD names end with .algo
  return name.includes('.algo') && name.length > 5;
}

export function validateAndSanitizeInput(input: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
  isNFD?: boolean;
  isAddress?: boolean;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, sanitized: '', error: 'Input cannot be empty' };
  }
  // NFD: ends with .algo (case-insensitive)
  if (trimmed.toLowerCase().endsWith('.algo')) {
    return {
      isValid: true,
      sanitized: trimmed.toLowerCase(),
      isNFD: true,
      isAddress: false
    };
  }
  // Algorand address: 58 chars, base32 (A-Z2-7), all uppercase
  if (/^[A-Z2-7]{58}$/.test(trimmed.toUpperCase())) {
    return {
      isValid: true,
      sanitized: trimmed.toUpperCase(),
      isNFD: false,
      isAddress: true
    };
  }
  return {
    isValid: false,
    sanitized: trimmed,
    error: 'Enter a valid Algorand address or .algo name',
    isNFD: false,
    isAddress: false
  };
}

// Error message formatting
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

// Retry utility
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 