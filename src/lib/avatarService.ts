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
   * Generates avatar with theme-aware colors for dark theme
   */
  static generateDarkThemeAvatar(
    address: string, 
    options: Partial<AvatarOptions> = {}
  ): string {
    const darkThemeColors = ['1F2937', '374151', '4B5563', '6B7280']; // Dark theme grays

    return this.generateBotttsAvatar(address, {
      ...options,
      backgroundColor: darkThemeColors,
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