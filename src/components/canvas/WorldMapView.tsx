'use client';

import React, { useState } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { Globe, ArrowRight, Shield, Sparkles, Check, Layers } from 'lucide-react';

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
    <div className="relative w-full h-full bg-[#0d0d11] overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8">
      {/* Map Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🌍</span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Global Land & Sovereign Territory Map
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400">
              Select a territory to inspect sovereign land holdings, view owners, or acquire country blocks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-lg bg-[#181818] border border-[#2e2e2e] text-xs font-semibold text-neutral-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span>100,000 Total Blocks (10M Pixels)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Global SVG Visualizer */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="relative bg-[#141418] border border-[#262626] rounded-2xl p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-active-cyan" />
              World Sharded Territorial Grid
            </span>
            <span className="text-[11px] text-neutral-500">Click any territory to zoom in</span>
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
                  className={`relative p-3 rounded-xl border text-left transition-all group flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'bg-active-cyan/15 border-active-cyan shadow-lg shadow-active-cyan/10'
                      : 'bg-[#181818] hover:bg-[#202024] border-[#2a2a2a] hover:border-[#444]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{c.flag || '🌐'}</span>
                      <span className="text-[10px] font-mono text-neutral-400">{c.code}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-active-cyan transition-colors">
                      {c.name}
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                      <span>{c.sold_blocks.toLocaleString()} sold</span>
                      <span className="font-semibold text-active-cyan">{soldPct}%</span>
                    </div>
                    <div className="w-full bg-[#101014] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-active-cyan to-active-lavender h-full rounded-full transition-all duration-500"
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
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-active-lavender" />
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
                className="bg-[#141418] border border-[#262626] rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between hover:border-[#383838] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{country.flag || '🌐'}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{country.name}</h3>
                        <p className="text-[11px] text-neutral-400 font-mono">Code: {country.code}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-bright text-[11px] font-semibold text-white">
                      ₹25 / Block
                    </span>
                  </div>

                  <div className="space-y-2 py-2 border-y border-[#222] my-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Total Territory Blocks:</span>
                      <span className="font-semibold text-white">{country.total_blocks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Available to Claim:</span>
                      <span className="font-semibold text-green-400">{availableCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Claimed & Sovereign:</span>
                      <span className="font-semibold text-active-cyan">{soldCount.toLocaleString()} ({soldPercentage}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleCountryDrilldown(country.code)}
                    className="flex-1 py-2 bg-[#202024] hover:bg-[#2a2a30] text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-[#333]"
                  >
                    <span>Zoom into Grid</span>
                    <ArrowRight className="w-3.5 h-3.5 text-active-cyan" />
                  </button>

                  <button
                    onClick={() => {
                      selectAllInCountry(country.code);
                      handleCountryDrilldown(country.code);
                    }}
                    className="px-3 py-2 bg-active-cyan/15 hover:bg-active-cyan/25 text-active-cyan rounded text-xs font-bold transition-colors border border-active-cyan/30"
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
