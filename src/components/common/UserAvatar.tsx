'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'Avatar',
  name = 'User',
  className = 'w-7 h-7 rounded-full border border-active-cyan object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  // Generate simple initials fallback if image fails to load or src is invalid
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  if (!src || hasError) {
    const initials = getInitials(name);
    return (
      <div
        className={`${className} bg-surface-container-highest text-active-cyan font-bold flex items-center justify-center select-none text-[10px] shrink-0 border border-active-cyan/40 shadow-inner`}
        title={alt || name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className} shrink-0`}
    />
  );
};
