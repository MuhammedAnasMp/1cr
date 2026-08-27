'use client';

import React from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { ShoppingBag, Sparkles, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@/lib/pricing';

export const BlockSelectionHUD: React.FC = () => {
  const {
    selectedBlockIds,
    clearSelection,
    openCheckoutModal,
    selectedCurrency,
    setSelectedCurrency,
    getPriceCalculation,
  } = useBlockStore();

  const count = selectedBlockIds.size;
  if (count === 0) return null;

  const pricing = getPriceCalculation();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-[#141418]/95 border border-[#333] backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        
        {/* Selection & Volume Discount Summary */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative p-2.5 rounded-xl bg-active-cyan/15 border border-active-cyan/30 text-active-cyan shrink-0">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-active-cyan text-black text-[10px] font-black leading-none">
              {count}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                {count} Block{count > 1 ? 's' : ''} Selected
              </h3>
              <span className="text-[11px] text-neutral-400 font-mono font-medium">
                ({pricing.pixelCount.toLocaleString()} Pixels)
              </span>
            </div>

            {pricing.discountPercent > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {pricing.discountPercent}% Volume Discount applied! (Save {pricing.selectedCurrency.symbol}{pricing.discountAmountSelectedCurrency})
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Select 5+ blocks to unlock volume discount
              </p>
            )}
          </div>
        </div>

        {/* Pricing, Currency Selector & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 border-[#262626] pt-2.5 sm:pt-0">
          
          {/* Currency Dropdown */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="appearance-none bg-[#202024] hover:bg-[#282830] border border-[#383838] rounded-lg px-2.5 py-1.5 pr-7 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Price */}
          <div className="text-right">
            <div className="text-sm font-black text-white">
              {pricing.selectedCurrency.symbol}{pricing.netAmountSelectedCurrency.toLocaleString()}
            </div>
            {pricing.discountPercent > 0 && (
              <div className="text-[10px] text-neutral-500 line-through">
                {pricing.selectedCurrency.symbol}{pricing.grossAmountINR * pricing.selectedCurrency.rateFromINR}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={openCheckoutModal}
            className="px-4 py-2 bg-gradient-to-r from-active-cyan to-active-lavender hover:opacity-90 text-black font-extrabold rounded-lg text-xs transition-opacity shadow-lg shadow-active-cyan/20 flex items-center gap-1.5 shrink-0"
          >
            <span>Claim Blocks</span>
          </button>

          <button
            onClick={clearSelection}
            className="p-2 text-neutral-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
