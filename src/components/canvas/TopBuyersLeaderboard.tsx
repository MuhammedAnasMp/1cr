'use client';

import React, { useState } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { Trophy, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';

export const TopBuyersLeaderboard: React.FC = () => {
  const { getTopBuyers, jumpToCoords, openProfileModal, jumpToCoords: jump } = usePixelStore();
  const [isOpen, setIsOpen] = useState(true);

  const topBuyers = getTopBuyers();

  return (
    <div className="w-full max-w-xs bg-surface-container border border-outline-variant rounded-card shadow-2xl overflow-hidden select-none pointer-events-auto">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 bg-surface-container-low hover:bg-surface-container-high flex items-center justify-between border-b border-outline-variant transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-active-cyan" />
          <span className="text-xs font-extrabold text-white tracking-wide">Top 5 Pixel Owners</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
        )}
      </button>

      {/* Top 1-5 List */}
      {isOpen && (
        <div className="p-2 space-y-1 divide-y divide-outline-variant">
          {topBuyers.length === 0 ? (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-on-surface-variant">No pixel buyers yet in the database.</p>
              <button
                onClick={() => jump(500, 200)}
                className="w-full py-1.5 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Be the First Buyer!
              </button>
            </div>
          ) : (
            topBuyers.map((buyer, idx) => (
              <div
                key={buyer.user_id}
                onClick={() => {
                  if (buyer.firstPixel) {
                    jumpToCoords(buyer.firstPixel.x, buyer.firstPixel.y);
                  }
                  if (buyer.profile) {
                    openProfileModal(buyer.profile);
                  }
                }}
                className="pt-1.5 first:pt-0 pb-1.5 px-2 rounded hover:bg-surface flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Rank Badge */}
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      idx === 0
                        ? 'bg-active-lavender text-background'
                        : idx === 1
                        ? 'bg-active-cyan text-background'
                        : idx === 2
                        ? 'bg-active-silver text-background'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  {/* Avatar */}
                  <img
                    src={buyer.avatar}
                    alt={buyer.name}
                    className="w-6 h-6 rounded-full border border-outline object-cover shrink-0"
                  />

                  {/* Name */}
                  <span className="text-xs font-semibold text-white truncate group-hover:text-active-cyan transition-colors">
                    {buyer.name}
                  </span>
                </div>

                {/* Pixel Count Pill */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-extrabold text-active-cyan font-mono">
                    {buyer.pixelCount} px
                  </span>
                  <ExternalLink className="w-3 h-3 text-on-surface-variant group-hover:text-active-cyan transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
