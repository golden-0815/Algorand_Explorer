import React from 'react';
import { Tag } from 'lucide-react';

interface NFDTagProps {
  name: string;
  className?: string;
}

export function NFDTag({ name, className = '' }: NFDTagProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-algo-accent/20 
                    border border-algo-accent/30 rounded-full text-algo-accent text-sm 
                    font-medium ${className}`}>
      <Tag className="w-4 h-4" />
      {name}
    </div>
  );
}