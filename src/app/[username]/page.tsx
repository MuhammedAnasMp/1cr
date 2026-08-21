'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePixelStore } from '@/store/usePixelStore';

export default function UsernameDirectPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { jumpToCoords, openProfileModal, pixels, profiles } = usePixelStore();

  useEffect(() => {
    const rawUsername = resolvedParams.username.replace(/^%40|^@/, '');
    const profile = Object.values(profiles).find(
      (p) => p.username.toLowerCase() === rawUsername.toLowerCase()
    );

    if (profile) {
      openProfileModal(profile);
      const userPixel = Object.values(pixels).find((p) => p.owner_id === profile.user_id);
      if (userPixel) {
        jumpToCoords(userPixel.x, userPixel.y);
      }
    } else {
      jumpToCoords(500, 500);
    }

    router.replace('/');
  }, [resolvedParams.username, pixels, profiles, jumpToCoords, openProfileModal, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-active-cyan">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-active-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-mono">Loading Linktree profile for @{resolvedParams.username}...</p>
      </div>
    </div>
  );
}
