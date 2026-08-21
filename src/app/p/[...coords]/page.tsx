'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePixelStore } from '@/store/usePixelStore';

export default function PixelCatchAllPage({ params }: { params: Promise<{ coords: string[] }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { jumpToCoords, openProfileModal, pixels, profiles } = usePixelStore();

  useEffect(() => {
    const segments = resolvedParams.coords || [];

    if (segments.length === 2) {
      // /p/500/200 format (X, Y coordinates)
      const x = parseInt(segments[0], 10);
      const y = parseInt(segments[1], 10);

      if (!isNaN(x) && !isNaN(y)) {
        jumpToCoords(x, y);
        const key = `${x},${y}`;
        const pixel = pixels[key];
        if (pixel && pixel.owner_id) {
          const profile =
            Object.values(profiles).find((p) => p.user_id === pixel.owner_id || p.id === pixel.owner_id) || null;
          if (profile) openProfileModal(profile);
        }
      }
    } else if (segments.length === 1) {
      // /p/12345 format (Pixel ID)
      const pixelId = parseInt(segments[0], 10);
      const pixel = Object.values(pixels).find((p) => p.id === pixelId);

      if (pixel) {
        jumpToCoords(pixel.x, pixel.y);
        if (pixel.owner_id) {
          const profile =
            Object.values(profiles).find((p) => p.user_id === pixel.owner_id || p.id === pixel.owner_id) || null;
          if (profile) openProfileModal(profile);
        }
      } else {
        jumpToCoords(500, 200);
      }
    }

    router.replace('/');
  }, [resolvedParams.coords, pixels, profiles, jumpToCoords, openProfileModal, router]);

  return (
    <div className="min-h-screen bg-[#090909] flex items-center justify-center text-[#00e5ff]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-mono">Loading 10M Pixel World...</p>
      </div>
    </div>
  );
}
