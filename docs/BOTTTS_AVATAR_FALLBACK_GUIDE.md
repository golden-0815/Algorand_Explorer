# Bottts Avatar Fallback System (DiceBear)

The Finalyze crypto dashboard implements a **DiceBear Bottts avatar fallback system** to provide consistent, deterministic avatar generation when NFD profiles don't include custom avatars. This guide covers the implementation of robot-style avatars as engaging fallbacks.

## 🎯 Current Implementation Overview

### Existing Avatar System

Currently, the avatar system (located in `src/shared/components/Avatar.tsx`) uses a simple initial-based fallback:

```typescript
// Current implementation in: src/shared/components/Avatar.tsx
export function Avatar({ address, nfdData, size = 'md', className }: AvatarProps) {
  const displayName = nfdData?.name || address;
  const initial = displayName.charAt(0).toUpperCase();

  // If NFD has an avatar, use it, otherwise use initials
  if (nfdData?.avatar) {
    return (
      <div className={cn('rounded-full overflow-hidden', sizeClasses[size], className)}>
        <img 
          src={nfdData.avatar} 
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Current fallback: Simple initial
  return (
    <div className={cn(
      'rounded-full bg-accent text-accent-foreground font-medium flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {initial}
    </div>
  );
}
```

## 🚀 Enhanced Implementation with DiceBear Bottts

### 1. Dependencies Installation

Add the DiceBear library to your project:

```bash
npm install @dicebear/collection @dicebear/core
```

### 2. DiceBear Avatar Service

Create a dedicated service for generating Bottts avatars:

```typescript
// File: src/shared/services/avatarService.ts
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';

export interface AvatarOptions {
  seed: string;
  size?: number;
  backgroundColor?: string[];
  textureChance?: number;
  eyesChance?: number;
  mouthChance?: number;
}

export class AvatarService {
  private static readonly DEFAULT_OPTIONS = {
    size: 40,
    backgroundColor: ['3366FF', '4F46E5', '7C3AED', 'DB2777', 'DC2626', 'EA580C'],
    textureChance: 80,
    eyesChance: 100,
    mouthChance: 90,
  };

  /**
   * Generates a deterministic Bottts avatar SVG based on wallet address
   */
  static generateBotttsAvatar(address: string, options: Partial<AvatarOptions> = {}): string {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    const avatar = createAvatar(bottts, {
      seed: address,
      size: mergedOptions.size,
      backgroundColor: mergedOptions.backgroundColor,
      // Bottts-specific options
      textureChance: mergedOptions.textureChance,
      eyesChance: mergedOptions.eyesChance,
      mouthChance: mergedOptions.mouthChance,
      // Color customization
      primaryColorLevel: 600,
      secondaryColorLevel: 400,
      // Robot aesthetics
      base: ['antennaShort', 'antennaLong'],
      face: ['square01', 'square02', 'square03'],
      texture: ['circuits', 'dots', 'metallic'],
    });

    return avatar.toString();
  }

  /**
   * Generates a data URL for the avatar (for use in img src)
   */
  static generateAvatarDataUrl(address: string, options: Partial<AvatarOptions> = {}): string {
    const svg = this.generateBotttsAvatar(address, options);
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml,${encoded}`;
  }

  /**
   * Generates avatar with theme-aware colors
   */
  static generateThemedAvatar(
    address: string, 
    theme: 'light' | 'dark',
    options: Partial<AvatarOptions> = {}
  ): string {
    const themeColors = theme === 'dark' 
      ? ['1F2937', '374151', '4B5563', '6B7280'] // Dark theme grays
      : ['F3F4F6', 'E5E7EB', 'D1D5DB', '9CA3AF']; // Light theme grays

    return this.generateBotttsAvatar(address, {
      ...options,
      backgroundColor: themeColors,
    });
  }

  /**
   * Preloads avatar for better performance
   */
  static preloadAvatar(address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = this.generateAvatarDataUrl(address);
    });
  }
}
```

### 3. Enhanced Avatar Component

Update the Avatar component to use DiceBear Bottts fallback:

```typescript
// File: src/shared/components/Avatar.tsx (enhanced version)
import { cn } from '@/lib/utils';
import { NFDData } from '@/shared/types/layout';
import { AvatarService } from '@/shared/services/avatarService';
import { useTheme } from '@/core/ThemeProvider';
import { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  address: string;
  nfdData?: NFDData | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackType?: 'bottts' | 'initials' | 'icon';
  showBorder?: boolean;
}

export function Avatar({ 
  address, 
  nfdData, 
  size = 'md', 
  className,
  fallbackType = 'bottts',
  showBorder = false
}: AvatarProps) {
  const { theme } = useTheme();
  const [nfdAvatarError, setNfdAvatarError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const borderClasses = showBorder 
    ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' 
    : '';

  const displayName = nfdData?.name || address;
  const initial = displayName.charAt(0).toUpperCase();

  // Priority 1: NFD Avatar (if available and not errored)
  if (nfdData?.avatar && !nfdAvatarError) {
    return (
      <div className={cn(
        'rounded-full overflow-hidden', 
        sizeClasses[size], 
        borderClasses,
        className
      )}>
        <img 
          src={nfdData.avatar} 
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setNfdAvatarError(true)}
        />
      </div>
    );
  }

  // Priority 2: DiceBear Bottts Fallback
  if (fallbackType === 'bottts') {
    const avatarDataUrl = AvatarService.generateAvatarDataUrl(address, {
      size: size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64,
    });

    return (
      <div className={cn(
        'rounded-full overflow-hidden bg-background', 
        sizeClasses[size], 
        borderClasses,
        className
      )}>
        <img 
          src={avatarDataUrl}
          alt={`Robot avatar for ${displayName}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Priority 3: Icon Fallback
  if (fallbackType === 'icon') {
    return (
      <div className={cn(
        'rounded-full bg-accent text-accent-foreground flex items-center justify-center',
        sizeClasses[size],
        borderClasses,
        className
      )}>
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  // Priority 4: Initial Fallback
  return (
    <div className={cn(
      'rounded-full bg-accent text-accent-foreground font-medium flex items-center justify-center',
      sizeClasses[size],
      borderClasses,
      className
    )}>
      {initial}
    </div>
  );
}
```

### 4. Avatar Hook for Performance

Create a custom hook for efficient avatar management:

```typescript
// File: src/shared/hooks/useAvatar.ts
import { useState, useEffect, useCallback } from 'react';
import { AvatarService } from '@/shared/services/avatarService';
import { NFDData } from '@/shared/types/layout';

interface UseAvatarOptions {
  preload?: boolean;
  fallbackType?: 'bottts' | 'initials' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function useAvatar(
  address: string, 
  nfdData?: NFDData | null,
  options: UseAvatarOptions = {}
) {
  const { preload = true, fallbackType = 'bottts', size = 'md' } = options;
  const [isLoading, setIsLoading] = useState(preload);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const generateFallbackAvatar = useCallback(() => {
    if (fallbackType === 'bottts') {
      return AvatarService.generateAvatarDataUrl(address, {
        size: size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64,
      });
    }
    return null;
  }, [address, fallbackType, size]);

  useEffect(() => {
    let mounted = true;

    const loadAvatar = async () => {
      if (!preload) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Priority 1: NFD Avatar
        if (nfdData?.avatar) {
          setAvatarUrl(nfdData.avatar);
          setIsLoading(false);
          return;
        }

        // Priority 2: Generate Bottts Avatar
        if (fallbackType === 'bottts') {
          const fallbackUrl = generateFallbackAvatar();
          if (fallbackUrl && mounted) {
            await AvatarService.preloadAvatar(address);
            setAvatarUrl(fallbackUrl);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load avatar');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadAvatar();

    return () => {
      mounted = false;
    };
  }, [address, nfdData?.avatar, fallbackType, generateFallbackAvatar, preload]);

  return {
    avatarUrl: avatarUrl || generateFallbackAvatar(),
    isLoading,
    error,
    hasNFDAvatar: !!nfdData?.avatar,
    isFallback: !nfdData?.avatar,
  };
}
```

### 5. Avatar Gallery Component

Create a component to showcase different avatar styles:

```typescript
// File: src/features/settings/components/AvatarGallery.tsx
import { useState } from 'react';
import { Avatar } from '@/shared/components/Avatar';
import { AvatarService } from '@/shared/services/avatarService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download } from 'lucide-react';

interface AvatarGalleryProps {
  address: string;
  currentNfdData?: any;
}

export function AvatarGallery({ address, currentNfdData }: AvatarGalleryProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const downloadAvatar = (format: 'svg' | 'png' = 'svg') => {
    const svg = AvatarService.generateBotttsAvatar(address, { size: 200 });
    
    if (format === 'svg') {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-${address.slice(0, 8)}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const regenerateAvatar = () => {
    setRefreshKey(prev => prev + 1);
  };

  const avatarVariations = [
    { seed: address, label: 'Default' },
    { seed: `${address}-alt1`, label: 'Variant 1' },
    { seed: `${address}-alt2`, label: 'Variant 2' },
    { seed: `${address}-alt3`, label: 'Variant 3' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Avatar Preview</CardTitle>
          <div className="flex space-x-2">
            <Button onClick={regenerateAvatar} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => downloadAvatar('svg')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Avatar */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar 
                address={address} 
                nfdData={currentNfdData}
                size="xl"
                showBorder
                key={refreshKey}
              />
            </div>
            <Badge variant="secondary">
              {currentNfdData?.avatar ? 'NFD Avatar' : 'Bottts Fallback'}
            </Badge>
          </div>

          {/* Size Variations */}
          <div>
            <h4 className="font-medium mb-3">Size Variations</h4>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <Avatar address={address} size="sm" key={`sm-${refreshKey}`} />
                <p className="text-xs text-muted-foreground mt-1">Small</p>
              </div>
              <div className="text-center">
                <Avatar address={address} size="md" key={`md-${refreshKey}`} />
                <p className="text-xs text-muted-foreground mt-1">Medium</p>
              </div>
              <div className="text-center">
                <Avatar address={address} size="lg" key={`lg-${refreshKey}`} />
                <p className="text-xs text-muted-foreground mt-1">Large</p>
              </div>
              <div className="text-center">
                <Avatar address={address} size="xl" key={`xl-${refreshKey}`} />
                <p className="text-xs text-muted-foreground mt-1">X-Large</p>
              </div>
            </div>
          </div>

          {/* Fallback Types */}
          <div>
            <h4 className="font-medium mb-3">Fallback Options</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <Avatar 
                  address={address} 
                  size="lg" 
                  fallbackType="bottts"
                  key={`bottts-${refreshKey}`}
                />
                <p className="text-sm mt-2">Bottts Robot</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Avatar 
                  address={address} 
                  size="lg" 
                  fallbackType="initials"
                  key={`initials-${refreshKey}`}
                />
                <p className="text-sm mt-2">Initials</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Avatar 
                  address={address} 
                  size="lg" 
                  fallbackType="icon"
                  key={`icon-${refreshKey}`}
                />
                <p className="text-sm mt-2">User Icon</p>
              </div>
            </div>
          </div>

          {/* Style Variations */}
          <div>
            <h4 className="font-medium mb-3">Style Variations</h4>
            <div className="grid grid-cols-4 gap-3">
              {avatarVariations.map((variant, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2">
                    <img 
                      src={AvatarService.generateAvatarDataUrl(variant.seed)}
                      alt={variant.label}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{variant.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🎨 Customization & Theming

### Theme-Aware Avatar Colors

```typescript
// File: src/shared/services/avatarService.ts (additional method)
static generateCustomAvatar(
  address: string, 
  customization: {
    colorScheme?: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
    style?: 'minimal' | 'detailed' | 'colorful';
    mood?: 'happy' | 'neutral' | 'serious';
  } = {}
): string {
  const { colorScheme = 'blue', style = 'detailed', mood = 'neutral' } = customization;
  
  const colorSchemes = {
    blue: ['3B82F6', '1D4ED8', '1E40AF'],
    purple: ['8B5CF6', '7C3AED', '6D28D9'],
    pink: ['EC4899', 'DB2777', 'BE185D'],
    orange: ['F97316', 'EA580C', 'DC2626'],
    green: ['10B981', '059669', '047857'],
  };

  const styleOptions = {
    minimal: { textureChance: 20, eyesChance: 60, mouthChance: 40 },
    detailed: { textureChance: 80, eyesChance: 100, mouthChance: 90 },
    colorful: { textureChance: 100, eyesChance: 100, mouthChance: 100 },
  };

  return this.generateBotttsAvatar(address, {
    backgroundColor: colorSchemes[colorScheme],
    ...styleOptions[style],
  });
}
```

## 🚀 Integration Examples

### Dashboard Usage

```typescript
// File: src/features/dashboard/components/UserProfile.tsx
import { Avatar } from '@/shared/components/Avatar';
import { useWalletStore } from '@/features/auth/walletStore';

export function UserProfile() {
  const { walletAddress, nfdData } = useWalletStore();

  return (
    <div className="flex items-center space-x-3">
      <Avatar 
        address={walletAddress || ''} 
        nfdData={nfdData}
        size="lg"
        showBorder
        fallbackType="bottts"
      />
      <div>
        <h3 className="font-medium">
          {nfdData?.name || `${walletAddress?.slice(0, 8)}...`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {nfdData?.bio || 'Algorand Wallet'}
        </p>
      </div>
    </div>
  );
}
```

### Settings Integration

```typescript
// File: src/features/settings/SettingsPage.tsx
import { AvatarGallery } from './components/AvatarGallery';

export function SettingsPage() {
  const { walletAddress, nfdData } = useWalletStore();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      
      <AvatarGallery 
        address={walletAddress || ''} 
        currentNfdData={nfdData}
      />
      
      {/* Other settings components */}
    </div>
  );
}
```

## 🔧 Performance Optimization

### Avatar Caching Strategy

```typescript
// File: src/shared/services/avatarCache.ts
class AvatarCache {
  private cache = new Map<string, string>();
  private maxSize = 100;

  get(address: string, options: string = ''): string | null {
    const key = `${address}-${options}`;
    return this.cache.get(key) || null;
  }

  set(address: string, avatar: string, options: string = ''): void {
    const key = `${address}-${options}`;
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, avatar);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const avatarCache = new AvatarCache();
```

## 🚀 Next Steps

### To Be Automated by Agent

- [ ] Implement avatar animation on hover/interaction
- [ ] Add avatar customization preferences storage
- [ ] Create avatar NFT minting capability
- [ ] Implement avatar-based profile themes
- [ ] Add social avatar sharing functionality
- [ ] Create avatar variation generator for collections
- [ ] Implement avatar mood detection based on portfolio performance
- [ ] Add accessibility features for avatar descriptions
- [ ] Create avatar backup/export functionality
- [ ] Implement progressive avatar loading for better UX