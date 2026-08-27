'use client';

import React, { useState } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { Plus, Minus, Maximize2, Minimize2, Search, Map, MousePointerClick, ShoppingBag } from 'lucide-react';

interface FloatingControlsProps {
  showMiniMap: boolean;
  setShowMiniMap: (show: boolean) => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({ showMiniMap, setShowMiniMap }) => {
  const {
    zoomIn,
    zoomOut,
    resetView,
    fitToFrame,
    jumpToCoords,
    isSelectionMode,
    toggleSelectionMode,
    selectedCoords,
    openCheckoutModal,
  } = usePixelStore();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchX, setSearchX] = useState('500');
  const [searchY, setSearchY] = useState('200');

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const x = parseInt(searchX, 10);
    const y = parseInt(searchY, 10);
    if (!isNaN(x) && !isNaN(y)) {
      jumpToCoords(x, y);
      setShowSearchModal(false);
    }
  };

  const selectedCount = selectedCoords.size;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* HUD Zoom & Navigation Tools */}
      <div className="bg-surface-container border border-outline-variant rounded-card p-1 shadow-2xl flex flex-col divide-y divide-outline-variant">
        {/* Purchase Mode / Slot Selection Toggle Button */}
        <button
          onClick={toggleSelectionMode}
          className={`p-2.5 transition-colors rounded-t-xl relative ${isSelectionMode ? 'text-primary bg-surface-container-lowest' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          title={isSelectionMode ? 'Slot Selection Active (Click/Drag to select land)' : 'Enable Slot Selection Mode'}
        >
          <MousePointerClick className="w-4.5 h-4.5" />

        </button>

        <button
          onClick={zoomIn}
          className="p-2.5 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={zoomOut}
          className="p-2.5 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={resetView}
          className="p-2.5 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Reset Center View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={fitToFrame}
          className="p-2.5 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Fit All 10,000,000 Pixels in One Frame"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowSearchModal(true)}
          className="p-2.5 text-on-surface hover:text-primary hover:bg-surface-container-high transition-colors"
          title="Search Coordinates"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowMiniMap(!showMiniMap)}
          className={`p-2.5 transition-colors rounded-b-xl ${showMiniMap ? 'text-primary bg-surface-container-lowest' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          title="Toggle Mini Map Radar"
        >
          <Map className="w-4 h-4" />
        </button>
      </div>

      {/* Checkout Floating Button (when items selected) */}
      {selectedCount > 0 && (
        <button
          onClick={openCheckoutModal}
          className="p-3 bg-primary hover:bg-primary-container text-on-primary rounded shadow-2xl flex items-center justify-center font-bold transition-transform hover:scale-105"
          title={`Checkout ${selectedCount} selected pixel(s)`}
        >
          <ShoppingBag className="w-5 h-5" />
        </button>
      )}

      {/* Coordinate Search Popup Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-modal p-5 max-w-xs w-full shadow-2xl">
            <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Jump to Coordinate
            </h4>
            <form onSubmit={handleJump} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">X Coord (0-9999)</label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={searchX}
                    onChange={(e) => setSearchX(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-outline"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">Y Coord (0-999)</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={searchY}
                    onChange={(e) => setSearchY(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-outline"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded transition-colors"
                >
                  Jump View
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs rounded border border-outline-variant transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
