'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBlockStore } from '@/store/useBlockStore';
import { ViewSwitcher } from '@/components/canvas/ViewSwitcher';
import { Search, User as UserIcon, Shield, Sparkles, LogOut, Users, Globe, Lock, Mail, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    selectedBlockIds,
    openCheckoutModal,
    jumpToCoords,
    blocks,
    presence,
  } = useBlockStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    async function loadUserSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
        // non-fatal
      }
    }
    loadUserSession();
  }, [setCurrentUser]);

  const handleOpenAuthModal = () => {
    setEmail('');
    setPassword('');
    setName('');
    setIsSignUp(false);
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user) {
        setCurrentUser(data.user);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
  };

  const selectedCount = selectedBlockIds.size;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = searchQuery.match(/^(\d+)[,\s]+(\d+)$/);
    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      jumpToCoords(x, y);
      setSearchQuery('');
      return;
    }

    const foundBlock = Object.values(blocks).find(
      (b) =>
        b.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.owner_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundBlock) {
      jumpToCoords(foundBlock.grid_x, foundBlock.grid_y);
      setSearchQuery('');
    } else {
      alert(`No sovereign block found matching "${searchQuery}". Try coordinates like "100, 50".`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 py-2.5 flex items-center justify-between shadow-md transition-all">
        {/* Brand & View Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base font-black text-on-surface tracking-tight flex items-center gap-1.5">
              <span className="text-xl">🪐</span>
              <strong className="text-primary font-black text-lg">vist</strong>
              <span className="text-on-surface-variant font-mono text-xs">.bio</span>
            </span>
          </Link>

          {/* View Switcher: Map <-> Grid */}
          <ViewSwitcher className="hidden sm:inline-flex" />
        </div>

        {/* Search & Coordinate Jump Box */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full mx-3">
          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coords (e.g. 50, 20) or creator..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
          />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Right Section: Presence, Auth, Admin & CTA */}
        <div className="flex items-center gap-2.5">
          {/* PartyKit Realtime Live Presence Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant text-[11px] font-semibold text-on-surface-variant"
            title="Real-time connected viewers across the world via PartyKit"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>{presence?.viewer_count || 1} online</span>
          </div>

          {currentUser && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          <Link
            href="/admin"
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            title="Admin & Pricing Configuration"
          >
            <Shield className="w-4 h-4" />
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border-2 border-primary object-cover"
              />
              <span className="text-xs font-bold text-on-surface hidden md:inline truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1 text-on-surface-variant hover:text-error transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAuthModal}
              className="text-xs font-extrabold text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Self-Hosted Neon Postgres Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container border border-outline-variant rounded-modal p-6 max-w-sm w-full shadow-2xl relative">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-on-surface">
                {isSignUp ? 'Create Sovereign Account' : 'Sign In to vist.bio'}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {isSignUp
                  ? 'Self-hosted Neon account for managing your land & linktrees.'
                  : 'Enter your email credentials to access your sovereign blocks.'}
              </p>
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sovereign Creator"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@vist.bio"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {authError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary font-black text-xs rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {authLoading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-xs text-primary hover:underline font-bold"
              >
                {isSignUp ? 'Already registered? Sign In instead' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-3 w-full py-1.5 text-xs text-on-surface-variant hover:text-on-surface text-center block font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
