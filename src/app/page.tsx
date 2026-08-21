'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { PixelCanvas } from '@/components/canvas/PixelCanvas';
import { FloatingControls } from '@/components/canvas/FloatingControls';
import { MiniMap } from '@/components/canvas/MiniMap';
import { StatusBar } from '@/components/canvas/StatusBar';
import { TopBuyersLeaderboard } from '@/components/canvas/TopBuyersLeaderboard';
import { MicroPageModal } from '@/components/linktree/MicroPageModal';
import { PurchaseModal } from '@/components/checkout/PurchaseModal';
import { usePixelStore } from '@/store/usePixelStore';

export default function HomePage() {
  const [showMiniMap, setShowMiniMap] = useState(true);
  const { fetchPixels } = usePixelStore();

  useEffect(() => {
    fetchPixels();
  }, [fetchPixels]);

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Interactive Canvas Area (95% height) */}
      <main className="relative flex-1 w-full h-[calc(100vh-53px-37px)] overflow-hidden">
        {/* Left Side Floating Overlay Stack */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-3 max-w-xs sm:max-w-sm pointer-events-none">
          {/* Hero Banner Header Overlay */}
          <div className="bg-surface-container/90 backdrop-blur-md border border-outline-variant rounded-card p-3.5 shadow-2xl pointer-events-auto">
            <h1 className="text-sm font-extrabold text-white tracking-tight mb-0.5">
              Own Your Place On The Internet
            </h1>
            <p className="text-xs text-on-surface-variant mb-2">
              Buy pixels. Build your identity. Share your links.
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-active-cyan/15 text-active-cyan font-bold">₹10 / Pixel</span>
              <span className="text-on-surface-variant">• Drag or Shift-select pixels</span>
            </div>
          </div>

          {/* Top 1-5 Pixel Owners Leaderboard */}
          <TopBuyersLeaderboard />
        </div>

        {/* 60 FPS HTML5 Canvas Engine */}
        <PixelCanvas />

        {/* Floating Controls HUD */}
        <FloatingControls showMiniMap={showMiniMap} setShowMiniMap={setShowMiniMap} />

        {/* Interactive MiniMap Radar */}
        {showMiniMap && <MiniMap />}
      </main>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      <MicroPageModal />
      <PurchaseModal />
    </div>
  );
}
