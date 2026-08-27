'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useBlockStore } from '@/store/useBlockStore';
import { Shield, DollarSign, Users, Sparkles, Save, Check, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { PricingTier } from '@/types';

export default function AdminPage() {
  const {
    blocks,
    baseBlockPriceINR,
    pricingTiers,
    fetchPricingConfig,
  } = useBlockStore();

  const [basePrice, setBasePrice] = useState(baseBlockPriceINR || 25);
  const [tiers, setTiers] = useState<PricingTier[]>(pricingTiers || []);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchPricingConfig();
  }, [fetchPricingConfig]);

  useEffect(() => {
    if (pricingTiers && pricingTiers.length > 0) {
      setTiers(pricingTiers);
      setBasePrice(baseBlockPriceINR || 25);
    }
  }, [pricingTiers, baseBlockPriceINR]);

  const soldBlocks = Object.values(blocks).filter((b) => b.status === 'sold');
  const totalRevenue = soldBlocks.reduce((acc, b) => acc + (b.price || 25), 0);
  const uniqueOwners = new Set(soldBlocks.map((b) => b.owner_id || b.owner_name)).size;

  const handleUpdateTier = (index: number, field: string, value: any) => {
    const updated = [...tiers];
    (updated[index] as any)[field] = value;
    setTiers(updated);
  };

  const handleAddTier = () => {
    const nextMin = (tiers[tiers.length - 1]?.max_blocks || 100) + 1;
    setTiers([
      ...tiers,
      {
        id: `tier_${Date.now()}`,
        min_blocks: nextMin,
        max_blocks: null,
        discount_percent: 35,
        price_per_block: 15,
        is_active: true,
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSavePricing = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePriceINR: Number(basePrice),
          tiers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update pricing configuration');
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      fetchPricingConfig();
    } catch (err: any) {
      alert(err.message || 'Error updating pricing');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-black text-on-surface">Platform Administration</h1>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              Dynamic volume pricing configuration, platform revenue metrics, and sovereign registry oversight.
            </p>
          </div>

          <Link
            href="/"
            className="self-start md:self-auto px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <span>Back to Canvas</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-bold">Total Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-3xl font-black text-green-600 dark:text-green-400">
              ₹{totalRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-on-surface-variant font-medium block mt-1">Authoritative Neon DB</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-bold">Sovereign Blocks Claimed</span>
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="text-3xl font-black text-on-surface">{soldBlocks.length.toLocaleString()}</span>
            <span className="text-[11px] text-primary font-bold block mt-1">
              {((soldBlocks.length / 100000) * 100).toFixed(2)}% of 100,000 blocks
            </span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-bold">Active Land Sovereigns</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-3xl font-black text-on-surface">{uniqueOwners}</span>
            <span className="text-[11px] text-on-surface-variant font-medium block mt-1">Unique buyer accounts</span>
          </div>
        </div>

        {/* Dynamic Pricing Configuration Panel */}
        <div className="bg-surface-container border border-outline-variant rounded-modal p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-base font-black text-on-surface flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Dynamic Volume Pricing Tiers (Postgres Authoritative)
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Configure base block price and automatic volume breakpoint discounts without modifying application code.
              </p>
            </div>

            <button
              onClick={handleAddTier}
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          </div>

          {/* Base Block Price Input */}
          <div className="max-w-xs">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1.5">
              Base Price per Block (INR)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-on-surface">₹</span>
              <input
                type="number"
                min={1}
                value={basePrice}
                onChange={(e) => setBasePrice(parseInt(e.target.value, 10) || 25)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Pricing Tiers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant uppercase tracking-wider font-bold">
                  <th className="pb-3">Min Blocks</th>
                  <th className="pb-3">Max Blocks</th>
                  <th className="pb-3">Discount %</th>
                  <th className="pb-3">Effective Price (INR)</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-medium">
                {tiers.map((t, idx) => (
                  <tr key={t.id || idx} className="text-on-surface">
                    <td className="py-3">
                      <input
                        type="number"
                        min={1}
                        value={t.min_blocks}
                        onChange={(e) => handleUpdateTier(idx, 'min_blocks', parseInt(e.target.value, 10) || 1)}
                        className="w-20 bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="text"
                        placeholder="No limit"
                        value={t.max_blocks === null ? '' : t.max_blocks}
                        onChange={(e) =>
                          handleUpdateTier(idx, 'max_blocks', e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        className="w-20 bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={t.discount_percent}
                          onChange={(e) =>
                            handleUpdateTier(idx, 'discount_percent', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface"
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono font-bold text-primary">
                      ₹{Math.round(basePrice * (1 - (t.discount_percent || 0) / 100))}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemoveTier(idx)}
                        className="p-1.5 text-on-surface-variant hover:text-error transition-colors"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
            <button
              onClick={handleSavePricing}
              disabled={isSaving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-black rounded-lg text-xs transition-colors shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Commit Pricing to Postgres'}
            </button>

            {savedSuccess && (
              <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" /> Pricing updated successfully!
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
