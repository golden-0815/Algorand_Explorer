import React, { useState } from 'react';
import { AvatarService } from '../lib/avatarService';

interface AvatarProps {
  address: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

export function Avatar({ 
  address, 
  size = 'md', 
  className = '',
  showBorder = false
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const borderClasses = showBorder 
    ? 'ring-2 ring-algo-accent ring-offset-2 ring-offset-algo-dark' 
    : '';

  // Generate Bottts avatar data URL
  const avatarDataUrl = AvatarService.generateAvatarDataUrl(address, {
    size: size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64,
  });

  return (
    <div className={`rounded-full overflow-hidden bg-algo-gray ${sizeClasses[size]} ${borderClasses} ${className}`}>
      <img 
        src={avatarDataUrl}
        alt={`Robot avatar for ${address.slice(0, 6)}...${address.slice(-4)}`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
} 