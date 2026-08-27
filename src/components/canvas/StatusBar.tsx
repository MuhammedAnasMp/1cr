'use client';

import React from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { ShoppingBag, X, RotateCcw, RotateCw } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const {
    selectedCoords,
    openCheckoutModal,
    clearSelection,
    undoSelection,
    redoSelection,
    historyIndex,
    selectionHistory,
  } = usePixelStore();

  const selectedCount = selectedCoords.size;
  const totalPrice = selectedCount * 10;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < selectionHistory.length - 1;

  // Only render when pixels are selected!
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-surface-container/95 border border-primary/40 rounded-full px-4 py-2.5 shadow-[0_10px_40px_rgba(70,72,212,0.25)] backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
      {/* Primary Checkout Action Button */}
      <button
        onClick={openCheckoutModal}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-extrabold text-xs uppercase tracking-wider rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
      >
        <ShoppingBag className="w-4 h-4 text-on-primary" />
        <span>Checkout & Claim (₹{totalPrice})</span>
      </button>

      {/* Undo Selection Button */}
      <button
        onClick={undoSelection}
        disabled={!canUndo}
        className="p-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-bold text-xs rounded-full transition-all border border-outline-variant disabled:opacity-30 disabled:pointer-events-none"
        title="Undo Selection (Ctrl+Z / Cmd+Z)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      {/* Redo Selection Button */}
      <button
        onClick={redoSelection}
        disabled={!canRedo}
        className="p-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-bold text-xs rounded-full transition-all border border-outline-variant disabled:opacity-30 disabled:pointer-events-none"
        title="Redo Selection (Ctrl+Shift+Z / Cmd+Shift+Z)"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>

      {/* Clear Selection Button with Pixel Count */}
      <button
        onClick={clearSelection}
        className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-on-surface font-bold text-xs rounded-full transition-all border border-outline-variant"
        title="Clear Selection"
      >
        <X className="w-3.5 h-3.5 text-on-surface-variant" />
        <span>Clear ({selectedCount})</span>
      </button>
    </div>
  );
};
