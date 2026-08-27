'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'w-full h-4', style }) => {
  return (
    <div
      style={style}
      className={`animate-pulse bg-surface-container-highest/60 border border-outline-variant/30 rounded ${className}`}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 2,
  className = '',
}) => {
  return (
    <div className={`space-y-2 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-8 h-8',
  className = '',
}) => {
  return <Skeleton className={`${size} rounded-full shrink-0 ${className}`} />;
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-surface-container border border-outline-variant rounded-card p-5 space-y-3 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <Skeleton className="w-32 h-7" />
      <Skeleton className="w-20 h-3" />
    </div>
  );
};

export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="border-b border-outline-variant/40 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-2">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};
