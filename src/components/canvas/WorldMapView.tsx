'use client';

import React, { useState } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { Globe, ArrowRight, Shield, Sparkles, Check, Layers, Compass, TrendingUp } from 'lucide-react';

export const WorldMapView: React.FC = () => {
  const {
    countries,
    selectedCountry,
    setSelectedCountry,
    setViewMode,
    selectAllInCountry,
    jumpToCoords,
    blocks,
  } = useBlockStore();

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const countryList = Object.values(countries);

  const handleCountryDrilldown = (code: string) => {
    setSelectedCountry(code);
    const country = countries[code];
    if (country) {
      const centerX = Math.floor((country.bounding_box.minX + country.bounding_box.maxX) / 2);
      const centerY = Math.floor((country.bounding_box.minY + country.bounding_box.maxY) / 2);
      jumpToCoords(centerX, centerY);
    }
    setViewMode('grid');
  };

  return (
    <div className="relative w-full h-full bg-background overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
      {/* Map Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-2xl">🌍</span>
              <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
                Global Sovereign Territory Map
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              Explore sovereign land sharded across world territories. Select a country to zoom into its live pixel canvas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-surface-container border border-outline-variant text-xs font-bold text-on-surface flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>100,000 Total Blocks (10M Pixels)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Global Visualizer */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="relative bg-surface-container border border-outline-variant rounded-modal p-6 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              World Sharded Territorial Grid
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium">Click any territory to drilldown into canvas</span>
          </div>

          {/* Interactive World Map Grid Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {countryList.map((c) => {
              const soldPct = c.total_blocks > 0 ? Math.round((c.sold_blocks / c.total_blocks) * 100) : 0;
              const isSelected = selectedCountry === c.code;

              return (
                <button
                  key={c.code}
                  onClick={() => handleCountryDrilldown(c.code)}
                  onMouseEnter={() => setHoveredCountry(c.code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className={`relative p-3 rounded-card border text-left transition-all group flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-md shadow-primary/10'
                      : 'bg-surface-container-lowest hover:bg-surface-container-high border-outline-variant hover:border-outline'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{c.flag || '🌐'}</span>
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant">{c.code}</span>
                    </div>
                    <h3 className="text-xs font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-semibold mb-1">
                      <span>{c.sold_blocks.toLocaleString()} sold</span>
                      <span className="font-bold text-primary">{soldPct}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, soldPct)}%` }}
                      ></div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Territory Details & Bulk Selection Grid */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          Country Sovereign Allocations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countryList.map((country) => {
            const soldCount = country.sold_blocks;
            const availableCount = country.total_blocks - soldCount;
            const soldPercentage = Math.round((soldCount / country.total_blocks) * 100);

            return (
              <div
                key={country.code}
                className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg flex flex-col justify-between hover:border-outline transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag || '🌐'}</span>
                      <div>
                        <h3 className="text-sm font-black text-on-surface">{country.name}</h3>
                        <p className="text-[11px] text-on-surface-variant font-mono font-medium">Code: {country.code}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-[11px] font-bold text-on-surface">
                      ₹25 / Block
                    </span>
                  </div>

                  <div className="space-y-2 py-3 border-y border-outline-variant my-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Total Territory Blocks:</span>
                      <span className="font-bold text-on-surface">{country.total_blocks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Available to Claim:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{availableCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">Claimed & Sovereign:</span>
                      <span className="font-bold text-primary">{soldCount.toLocaleString()} ({soldPercentage}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleCountryDrilldown(country.code)}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Zoom into Grid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      selectAllInCountry(country.code);
                      handleCountryDrilldown(country.code);
                    }}
                    className="px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors border border-primary/20"
                    title="Select all blocks in territory"
                  >
                    Select All
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
