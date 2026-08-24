'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { ProfileEditor } from '@/components/linktree/ProfileEditor';
import { usePixelStore } from '@/store/usePixelStore';
import { Grid, User, BarChart3, Receipt, ArrowUpRight, Eye, MousePointerClick, Globe, Smartphone, Monitor, LogIn } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase';

export default function DashboardPage() {
  const { currentUser, setCurrentUser, pixels, orders, jumpToCoords, initializeClientStore, fetchPixels } = usePixelStore();
  const [activeTab, setActiveTab] = useState<'pixels' | 'profile' | 'analytics' | 'payments'>('pixels');

  useEffect(() => {
    initializeClientStore();
    fetchPixels();
  }, [initializeClientStore, fetchPixels]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface-container border border-outline-variant rounded-card p-8 max-w-md w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-active-cyan/15 text-active-cyan flex items-center justify-center mx-auto">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Sign In Required</h2>
            <p className="text-xs text-on-surface-variant">Please sign in with your Google account to access your pixel holdings, Linktree profile builder, and analytics.</p>
            <button
              onClick={async () => {
                const firebaseUser = await signInWithGoogle();
                if (firebaseUser) {
                  setCurrentUser({
                    id: firebaseUser.uid,
                    firebase_uid: firebaseUser.uid,
                    email: firebaseUser.email || 'user@crorepixels.io',
                    name: firebaseUser.displayName || 'Pixel Collector',
                    avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/200?img=12',
                    created_at: new Date().toISOString(),
                  });
                }
              }}
              className="w-full py-3 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              Sign In with Google
            </button>
          </div>
        </main>
      </div>
    );
  }

  const ownedPixels = Object.values(pixels).filter(
    (p) => p.owner_id === currentUser.id
  );

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Header Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt="Avatar"
              className="w-14 h-14 rounded-full border-2 border-active-cyan object-cover shadow"
            />
            <div>
              <h1 className="text-xl font-bold text-white">{currentUser.name}</h1>
              <p className="text-xs text-on-surface-variant">
                Owner of <span className="text-active-cyan font-bold">{ownedPixels.length} Pixels</span> on 10M Pixel World
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="self-start md:self-auto px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded text-xs font-semibold text-active-cyan flex items-center gap-1.5 transition-colors"
          >
            Back to Interactive Canvas <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-outline-variant mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('pixels')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'pixels' ? 'bg-white text-background' : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
            }`}
          >
            <Grid className="w-4 h-4" /> My Pixels ({ownedPixels.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'profile' ? 'bg-white text-background' : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
            }`}
          >
            <User className="w-4 h-4" /> Profile & Linktree
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'analytics' ? 'bg-white text-background' : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics & Clicks
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-colors ${
              activeTab === 'payments' ? 'bg-white text-background' : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
            }`}
          >
            <Receipt className="w-4 h-4" /> Invoices & Receipts
          </button>
        </div>

        {/* Tab 1: My Pixels */}
        {activeTab === 'pixels' && (
          <div className="bg-surface-container border border-outline-variant rounded-card p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Owned Pixel Registry</h2>
            {ownedPixels.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-xs">
                You do not own any pixels yet. Claim land on the canvas for ₹10/pixel!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ownedPixels.map((px) => (
                  <div
                    key={px.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-card p-3 flex flex-col justify-between hover:border-active-cyan transition-colors group"
                  >
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-mono block mb-1">ID #{px.id}</span>
                      <span className="text-sm font-bold text-white font-mono block">
                        ({px.x}, {px.y})
                      </span>
                    </div>
                    <Link
                      href="/"
                      onClick={() => jumpToCoords(px.x, px.y)}
                      className="mt-3 text-[10px] text-active-cyan font-semibold flex items-center justify-between group-hover:underline"
                    >
                      Jump to Canvas <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile Builder */}
        {activeTab === 'profile' && <ProfileEditor />}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-semibold">Total Profile Views</span>
                  <Eye className="w-4 h-4 text-active-cyan" />
                </div>
                <span className="text-2xl font-black text-white">0</span>
                <span className="text-[10px] text-green-400 block mt-1">Live tracking active</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-semibold">Total Link Clicks</span>
                  <MousePointerClick className="w-4 h-4 text-active-lavender" />
                </div>
                <span className="text-2xl font-black text-white">0</span>
                <span className="text-[10px] text-green-400 block mt-1">Live tracking active</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-semibold">Click Through Rate</span>
                  <BarChart3 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-2xl font-black text-green-400">0.0%</span>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-xs font-semibold">Unique Visitors</span>
                  <Globe className="w-4 h-4 text-active-cyan" />
                </div>
                <span className="text-2xl font-black text-white">0</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payments */}
        {activeTab === 'payments' && (
          <div className="bg-surface-container border border-outline-variant rounded-card p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4">Razorpay Purchase Receipts</h2>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-xs">
                No purchase receipts found for this account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                      <th className="pb-3">Order ID</th>
                      <th className="pb-3">Razorpay Ref</th>
                      <th className="pb-3">Pixels</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="text-white">
                        <td className="py-3 font-mono text-active-cyan">{ord.id}</td>
                        <td className="py-3 font-mono text-on-surface-variant">{ord.razorpay_order_id}</td>
                        <td className="py-3 font-bold">{ord.pixels_count} px</td>
                        <td className="py-3 font-extrabold text-green-400">₹{ord.amount}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold text-[10px] uppercase">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
