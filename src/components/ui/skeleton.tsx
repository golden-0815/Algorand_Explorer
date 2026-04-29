import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width = 'w-full', height = 'h-4' }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gray-700 rounded ${width} ${height} ${className}`}
      aria-hidden="true"
    />
  );
}

export function ProfileSummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-algo-gray border border-algo-gray-light rounded-xl p-4">
            <Skeleton className="w-16 h-4 mb-2" />
            <Skeleton className="w-24 h-8 mb-2" />
            <Skeleton className="w-20 h-3" />
          </div>
        ))}
      </div>
      
      {/* Program breakdown */}
      <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-4">
        <Skeleton className="w-32 h-6 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded" />
                <Skeleton className="w-20 h-4" />
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AssetCardSkeleton() {
  return (
    <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded" />
          <div>
            <Skeleton className="w-24 h-5 mb-1" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
        <Skeleton className="w-20 h-6" />
      </div>
      
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-20 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TreemapSkeleton() {
  return (
    <div className="bg-algo-gray border border-algo-gray-light rounded-xl p-6 animate-pulse">
      <Skeleton className="w-40 h-6 mb-4" />
      <div className="w-full h-72 bg-gray-700 rounded"></div>
      <div className="grid grid-cols-4 gap-2 mt-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex items-center gap-1">
            <Skeleton className="w-2 h-2 rounded" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
} 