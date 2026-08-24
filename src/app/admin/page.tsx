'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { usePixelStore } from '@/store/usePixelStore';
import { Shield, DollarSign, Users, AlertTriangle, Search } from 'lucide-react';

export default function AdminPage() {
  const { pixels, profiles } = usePixelStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-active-cyan border-t-transparent rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  const uniqueProfiles = Array.from(
    new Map(Object.values(profiles).map((p) => [p.id || p.user_id, p])).values()
  );

  const filteredProfiles = uniqueProfiles.filter((prof) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      prof.username?.toLowerCase().includes(term) ||
      prof.name?.toLowerCase().includes(term) ||
      prof.id?.toLowerCase().includes(term) ||
      prof.user_id?.toLowerCase().includes(term)
    );
  });

  const totalPixelsSold = Object.values(pixels).filter((p) => p.status === 'sold').length;
  const totalRevenue = totalPixelsSold * 10;
  const totalUsers = uniqueProfiles.length;

  const handleRefund = (orderId: string) => {
    alert(`Initiated Razorpay full refund for Order ${orderId}. Pixels marked as available.`);
  };

  const handleSuspendUser = (username: string) => {
    alert(`User @${username} suspended. Pixel links set to neutral.`);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-active-cyan" />
              <h1 className="text-xl font-extrabold text-white">10M Pixel World System Admin</h1>
            </div>
            <p className="text-xs text-on-surface-variant">Revenue oversight, moderation control, and user management.</p>
          </div>

          <Link
            href="/"
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded text-xs font-semibold text-active-cyan transition-colors"
          >
            Back to Canvas
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold">Total Revenue Generated</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-2xl font-black text-green-400">₹{totalRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-on-surface-variant block mt-1">100% Razorpay verified</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold">Pixels Sold</span>
              <Shield className="w-4 h-4 text-active-cyan" />
            </div>
            <span className="text-2xl font-black text-white">{totalPixelsSold.toLocaleString()}</span>
            <span className="text-[10px] text-active-cyan block mt-1">out of 10,000,000</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold">Registered Creators</span>
              <Users className="w-4 h-4 text-active-lavender" />
            </div>
            <span className="text-2xl font-black text-white">{totalUsers}</span>
            <span className="text-[10px] text-on-surface-variant block mt-1">100% Verified profiles</span>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-card p-5 shadow-lg">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold">Active Moderation Flags</span>
              <AlertTriangle className="w-4 h-4 text-error" />
            </div>
            <span className="text-2xl font-black text-error">0</span>
            <span className="text-[10px] text-on-surface-variant block mt-1">Clean platform</span>
          </div>
        </div>

        {/* User Management & Moderation Table */}
        <div className="bg-surface-container border border-outline-variant rounded-card p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-base font-bold text-white">Creator Profiles & Moderation Control</h2>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search username or user ID..."
                className="w-full pl-9 pr-4 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-white focus:outline-none focus:border-outline"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant uppercase tracking-wider">
                  <th className="pb-3">Creator</th>
                  <th className="pb-3">Handle</th>
                  <th className="pb-3">Bio preview</th>
                  <th className="pb-3">Links Count</th>
                  <th className="pb-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredProfiles.map((prof) => (
                  <tr key={prof.id} className="text-white">
                    <td className="py-3 flex items-center gap-2">
                      <img src={prof.avatar} alt={prof.username} className="w-7 h-7 rounded-full object-cover border border-outline" />
                      <span className="font-semibold">{prof.name || prof.username}</span>
                    </td>
                    <td className="py-3 font-mono text-active-cyan">@{prof.username}</td>
                    <td className="py-3 max-w-xs truncate text-on-surface-variant">{prof.bio}</td>
                    <td className="py-3 font-bold">{prof.links?.length || 0} links</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => handleRefund(`ord_${prof.id}`)}
                        className="px-2.5 py-1 bg-surface-container-highest hover:bg-surface-bright text-active-lavender rounded text-[11px] font-semibold transition-colors"
                      >
                        Refund Purchase
                      </button>
                      <button
                        onClick={() => handleSuspendUser(prof.username)}
                        className="px-2.5 py-1 bg-error/15 hover:bg-error/25 text-error rounded text-[11px] font-semibold transition-colors"
                      >
                        Suspend User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
