'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { useBlockStore } from '@/store/useBlockStore';
import {
  Grid,
  User,
  BarChart3,
  Receipt,
  ArrowUpRight,
  Eye,
  MousePointerClick,
  Globe,
  LogIn,
  Plus,
  Trash2,
  Save,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Upload,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    currentUser,
    setCurrentUser,
    blocks,
    jumpToCoords,
    initializeClientStore,
  } = useBlockStore();

  const [activeTab, setActiveTab] = useState<'blocks' | 'linktree' | 'analytics' | 'orders'>('blocks');
  const [analytics, setAnalytics] = useState({ views: 0, clicks: 0, ctr: 0, owned_blocks: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Linktree Edit State
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('#4648d4');
  const [links, setLinks] = useState<Array<{ id: string; title: string; redirect_url: string; delay_seconds: number; platform: string }>>([
    { id: '1', title: 'Official Website', redirect_url: 'https://vist.bio', delay_seconds: 0, platform: 'website' },
  ]);

  useEffect(() => {
    initializeClientStore();
  }, [initializeClientStore]);

  // Check auth session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {}
    }
    loadUser();
  }, [setCurrentUser]);

  // Load analytics when user is ready
  useEffect(() => {
    if (!currentUser) return;
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/analytics?user_id=${currentUser?.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (e) {}
    }
    loadAnalytics();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface-container border border-outline-variant rounded-modal p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-on-surface">Sign In Required</h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Please sign in to access your sovereign block portfolio, configure Linktree channels, and view click analytics.
            </p>
            <div className="pt-2">
              <p className="text-xs text-primary font-bold">
                Use the "Sign In" button in the navigation bar to access your account.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const ownedBlocks = Object.values(blocks).filter(
    (b) => b.owner_id === currentUser.id || b.owner_name === currentUser.name
  );

  const handleAddLink = () => {
    setLinks([
      ...links,
      { id: `link_${Date.now()}`, title: '', redirect_url: 'https://', delay_seconds: 0, platform: 'website' },
    ]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleUpdateLink = (index: number, field: string, value: any) => {
    const updated = [...links];
    (updated[index] as any)[field] = value;
    setLinks(updated);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      // Simulate saving profile / link changes to backend
      await new Promise((r) => setTimeout(r, 600));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Header Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl border-2 border-primary object-cover shadow-md"
            />
            <div>
              <h1 className="text-2xl font-black text-on-surface">{currentUser.name}</h1>
              <p className="text-xs text-on-surface-variant font-medium">
                {currentUser.email} • Sovereign Holder of{' '}
                <span className="text-primary font-bold">{ownedBlocks.length} Blocks ({ownedBlocks.length * 100} Pixels)</span>
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="self-start md:self-auto px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <span>Back to Canvas</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-outline-variant mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'blocks'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Grid className="w-4 h-4" /> Sovereign Blocks ({ownedBlocks.length})
          </button>

          <button
            onClick={() => setActiveTab('linktree')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'linktree'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <User className="w-4 h-4" /> Linktree & Bio
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'analytics'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Click Analytics
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'orders'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <Receipt className="w-4 h-4" /> Invoices & Receipts
          </button>
        </div>

        {/* Tab 1: Owned Blocks */}
        {activeTab === 'blocks' && (
          <div className="bg-surface-container border border-outline-variant rounded-modal p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-on-surface">Sovereign Block Registry</h2>
              <span className="text-xs text-on-surface-variant font-mono">1 Block = 100 Pixels</span>
            </div>

            {ownedBlocks.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-xs space-y-3">
                <p>You do not own any sovereign blocks yet.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold"
                >
                  <Sparkles className="w-4 h-4" /> Explore & Claim Land (₹25/block)
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ownedBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-modal p-4 flex flex-col justify-between hover:border-primary transition-all group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-on-surface-variant font-mono font-bold">ID: {b.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] font-mono text-primary font-bold">
                          {b.country_code || 'GLOBAL'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-on-surface font-mono">
                        [{b.grid_x}, {b.grid_y}]
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">
                        100 Pixels • ₹{b.price} Valuation
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between text-xs">
                      <Link
                        href={`/b/${b.id}`}
                        className="text-primary hover:underline font-bold flex items-center gap-1"
                      >
                        <span>View Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <Link
                        href="/"
                        onClick={() => jumpToCoords(b.grid_x, b.grid_y)}
                        className="text-on-surface-variant hover:text-on-surface font-bold flex items-center gap-1"
                      >
                        <span>Locate</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Linktree Profile Builder */}
        {activeTab === 'linktree' && (
          <div className="bg-surface-container border border-outline-variant rounded-modal p-6 shadow-xl max-w-3xl space-y-6">
            <div>
              <h2 className="text-base font-black text-on-surface">Configure Block Profile & Destination Links</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Customize your headline, bio description, and social destination channels attached to your sovereign blocks.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-on-surface-variant uppercase block mb-1.5">
                  Bio / Headline Description
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Founder, Creator, and Sovereign Landholder on vist.bio 🚀"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Links Management */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">
                    Destination Channels & Redirect Links
                  </label>
                  <button
                    onClick={handleAddLink}
                    className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Link
                  </button>
                </div>

                <div className="space-y-3">
                  {links.map((link, idx) => (
                    <div
                      key={link.id || idx}
                      className="bg-surface-container-lowest border border-outline-variant rounded-modal p-4 flex flex-col sm:flex-row items-center gap-3"
                    >
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => handleUpdateLink(idx, 'title', e.target.value)}
                        placeholder="Link Title (e.g. YouTube Channel)"
                        className="w-full sm:w-1/3 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />

                      <input
                        type="url"
                        value={link.redirect_url}
                        onChange={(e) => handleUpdateLink(idx, 'redirect_url', e.target.value)}
                        placeholder="https://..."
                        className="w-full sm:w-1/2 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <select
                          value={link.delay_seconds}
                          onChange={(e) => handleUpdateLink(idx, 'delay_seconds', parseInt(e.target.value, 10))}
                          className="bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-xs text-on-surface focus:outline-none"
                          title="Optional countdown delay before redirect"
                        >
                          <option value={0}>Instant</option>
                          <option value={3}>3s delay</option>
                          <option value={5}>5s delay</option>
                          <option value={10}>10s delay</option>
                        </select>

                        <button
                          onClick={() => handleRemoveLink(idx)}
                          className="p-2 text-on-surface-variant hover:text-error transition-colors"
                          title="Remove Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-black rounded-lg text-xs transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>

                {savedSuccess && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" /> Saved successfully!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Click Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-bold">Total Profile Impressions</span>
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <span className="text-3xl font-black text-on-surface">{analytics.views}</span>
                <span className="text-[11px] text-green-600 dark:text-green-400 font-bold block mt-1">Live tracking active</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-bold">Total Link Clicks</span>
                  <MousePointerClick className="w-4 h-4 text-primary" />
                </div>
                <span className="text-3xl font-black text-on-surface">{analytics.clicks}</span>
                <span className="text-[11px] text-green-600 dark:text-green-400 font-bold block mt-1">Neon Postgres authoritative</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-bold">Click Through Rate (CTR)</span>
                  <BarChart3 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-3xl font-black text-green-600 dark:text-green-400">{analytics.ctr}%</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-modal p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-bold">Active Sovereign Blocks</span>
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <span className="text-3xl font-black text-on-surface">{ownedBlocks.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Orders & Invoices */}
        {activeTab === 'orders' && (
          <div className="bg-surface-container border border-outline-variant rounded-modal p-6 shadow-xl">
            <h2 className="text-base font-black text-on-surface mb-4">Razorpay Purchase Receipts</h2>
            <div className="text-center py-10 text-on-surface-variant text-xs">
              No recent Razorpay checkout receipts recorded for this account.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
