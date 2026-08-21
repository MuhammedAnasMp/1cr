'use client';

import React from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { Crosshair, ShoppingBag, Activity, CheckSquare } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    hoveredPixel,
    selectedCoords,
    viewport,
    fps,
    renderedTilesCount,
    openCheckoutModal,
    clearSelection,
  } = usePixelStore();

  const selectedCount = selectedCoords.size;
  const totalPrice = selectedCount * 10;

  return (
    <footer className="sticky bottom-0 z-30 w-full bg-surface/90 backdrop-blur-md border-t border-outline-variant px-4 py-2 flex items-center justify-between text-xs text-on-surface-variant select-none">
      {/* Left: Coordinate Display matching reference format */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono text-white text-[13px]">
          <Crosshair className="w-3.5 h-3.5 text-active-cyan" />
          <span>
            X: <strong className="text-active-cyan">{hoveredPixel?.pixel ? hoveredPixel.pixel.x : 0}</strong> | Y:{' '}
            <strong className="text-active-cyan">{hoveredPixel?.pixel ? hoveredPixel.pixel.y : 0}</strong> | Zoom:{' '}
            <strong className="text-active-cyan">{viewport.scale.toFixed(2)}</strong>
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 pl-3 border-l border-outline-variant">
            <CheckSquare className="w-3.5 h-3.5 text-active-cyan" />
            <span className="text-active-cyan font-semibold">
              {selectedCount} Selected (₹{totalPrice})
            </span>
            <button
              onClick={clearSelection}
              className="text-[10px] text-on-surface-variant hover:text-error underline transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Center: Quick Checkout Callout */}
      {selectedCount > 0 && (
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={openCheckoutModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded transition-colors shadow"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Checkout & Claim for ₹{totalPrice}
          </button>
        </div>
      )}

      {/* Right: Engine FPS Metrics */}
      <div className="flex items-center gap-3 font-mono text-[11px] bg-surface-container px-2.5 py-1 rounded border border-outline-variant">
        <Activity className="w-3 h-3 text-[#81C995]" />
        <span className="text-[#81C995] font-bold">{fps} FPS</span>
        <span className="text-on-surface-variant text-[10px]">({renderedTilesCount} tiles)</span>
      </div>
    </footer>
  );
};
