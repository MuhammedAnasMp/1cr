'use client';

import React from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { Map, Grid, Globe } from 'lucide-react';

export const ViewSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { viewMode, setViewMode } = useBlockStore();

  return (
    <div
      className={`inline-flex items-center bg-[#181818] border border-[#2e2e2e] rounded p-1 shadow-md gap-1 ${className}`}
    >
      <button
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
          viewMode === 'grid'
            ? 'bg-[#2a2a2a] text-white shadow-sm border border-[#444]'
            : 'text-neutral-400 hover:text-white hover:bg-[#202020]'
        }`}
        title="Grid View — Million Dollar Homepage Canvas"
      >
        <Grid className="w-3.5 h-3.5 text-active-cyan" />
        <span>Grid Canvas</span>
      </button>

      <button
        onClick={() => setViewMode('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
          viewMode === 'map'
            ? 'bg-[#2a2a2a] text-white shadow-sm border border-[#444]'
            : 'text-neutral-400 hover:text-white hover:bg-[#202020]'
        }`}
        title="Map View — Interactive World Map & Country Drilldown"
      >
        <Map className="w-3.5 h-3.5 text-active-lavender" />
        <span>World Map</span>
      </button>
    </div>
  );
};
