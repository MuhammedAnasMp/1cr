'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePixelStore } from '@/store/usePixelStore';
import { Search, User as UserIcon, Shield, ShoppingBag, Sparkles, LogOut } from 'lucide-react';
import { signInWithGoogle, logoutUser, auth, signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    selectedCoords,
    openCheckoutModal,
    jumpToCoords,
    togglePixelSelection,
    setSelectionMode,
    pixels,
  } = usePixelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleOpenAuthModal = () => {
    setEmail('');
    setPassword('');
    setIsSignUp(false);
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      let user;
      if (isSignUp) {
        user = await signUpWithEmail(email, password);
      } else {
        user = await signInWithEmail(email, password);
      }

      if (user) {
        setCurrentUser({
          id: user.uid,
          firebase_uid: user.uid,
          email: user.email || 'user@crorepixels.io',
          name: user.displayName || user.email?.split('@')[0] || 'Pixel Collector',
          avatar: user.photoURL || 'https://i.pravatar.cc/200?img=12',
          created_at: new Date().toISOString(),
        });
        setShowAuthModal(false);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address.';
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Subscribe to live Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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
    });
    return () => unsubscribe();
  }, [setCurrentUser]);

  const selectedCount = selectedCoords.size;

  const handleClaimLandClick = () => {
    setSelectionMode(true);
    if (selectedCount === 0) {
      togglePixelSelection(500, 200);
      jumpToCoords(500, 200);
    } else {
      openCheckoutModal();
    }
  };

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

    const foundPixel = Object.values(pixels).find(
      (p) => p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundPixel) {
      jumpToCoords(foundPixel.x, foundPixel.y);
      setSearchQuery('');
    } else {
      alert(`No pixel or creator found matching "${searchQuery}". Try coordinates like "500, 200".`);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 py-2.5 flex items-center justify-between shadow-md transition-all">
        {/* TopBar Title */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              🌎 <strong className="text-active-cyan">10,000,000</strong> Pixels
            </span>
            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">
              • Internet World
            </span>
          </Link>
        </div>

        {/* Minimal Search & Jump Box */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative max-w-sm w-full mx-4">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coordinates (e.g. 500, 200) or creator..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-container-lowest border border-outline-variant rounded text-xs text-white placeholder-on-surface-variant/50 focus:outline-none focus:border-outline transition-colors"
          />
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-3">
          {selectedCount > 0 ? (
            <button
              onClick={openCheckoutModal}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded transition-colors shadow-sm animate-pulse"
            >
              <ShoppingBag className="w-4 h-4" />
              Buy {selectedCount} Pixel{selectedCount > 1 ? 's' : ''} (₹{selectedCount * 10})
            </button>
          ) : (
            <button
              onClick={handleClaimLandClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Claim Land (₹10/px)
            </button>
          )}

          {currentUser && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-white bg-surface-container hover:bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded transition-colors"
            >
              <UserIcon className="w-4 h-4 text-active-cyan" />
              Dashboard
            </Link>
          )}

          <Link
            href="/admin"
            className="p-1.5 text-on-surface-variant hover:text-white hover:bg-surface-container rounded transition-colors"
            title="Admin Panel"
          >
            <Shield className="w-4.5 h-4.5" />
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-outline-variant">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border border-active-cyan object-cover"
              />
              <span className="text-xs font-semibold text-white hidden md:inline truncate max-w-[100px]">
                {currentUser.name}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1 text-on-surface-variant hover:text-error transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAuthModal}
              className="text-xs font-bold text-white bg-surface-container hover:bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant rounded-modal p-6 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">
              {isSignUp ? 'Create Account' : 'Sign In with Firebase'}
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              {isSignUp 
                ? 'Sign up with email and password to claim land.' 
                : 'Sign in with email/password or Google OAuth to claim land.'}
            </p>

            {/* Email/Password form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3 mt-4 mb-3">
              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-outline"
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant font-bold uppercase block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-outline"
                />
              </div>

              {authError && (
                <div className="text-[10px] text-error bg-error-container/10 p-2 rounded border border-error/20">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded transition-colors"
              >
                {authLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-[10px] text-active-cyan hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-surface-container px-2 text-on-surface-variant font-semibold">Or</span>
              </div>
            </div>

            <div className="space-y-3">
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
                    setShowAuthModal(false);
                  }
                }}
                className="w-full py-3 px-4 bg-surface-container-highest hover:bg-surface-bright text-white font-bold text-xs rounded flex items-center justify-center gap-2 border border-outline-variant transition-colors shadow-lg"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google OAuth
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 w-full py-2 text-xs text-on-surface-variant hover:text-white text-center block"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
