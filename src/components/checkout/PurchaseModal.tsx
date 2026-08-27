'use client';

import React, { useState, useEffect } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  User, 
  AtSign, 
  Globe, 
  Plus, 
  Trash2, 
  Layers, 
  Lock,
  Grid,
  Split
} from 'lucide-react';
import confetti from 'canvas-confetti';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PurchaseModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckoutModal,
    selectedCoords,
    currentUser,
    completePurchase,
    sessionId,
  } = usePixelStore();

  const coords = Array.from(selectedCoords);
  const selectedCount = coords.length;
  const totalPrice = selectedCount * 10;

  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Building on 10M Pixel World 🚀');
  const [checkoutLinks, setCheckoutLinks] = useState<{ title: string; url: string; assignedPixels: string[] }[]>([
    { title: '🌐 Official Website', url: 'https://example.com', assignedPixels: [] }
  ]);
  const [openGroupSelector, setOpenGroupSelector] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.name.toLowerCase().replace(/\s+/g, ''));
    }
  }, [currentUser]);

  useEffect(() => {
    // Populate default assignedPixels with all coords if empty
    if (coords.length > 0 && checkoutLinks.length > 0 && checkoutLinks[0].assignedPixels.length === 0) {
      setCheckoutLinks(checkoutLinks.map(l => ({ ...l, assignedPixels: [...coords] })));
    }
  }, [selectedCoords]);

  const addLink = () => {
    setCheckoutLinks([...checkoutLinks, { title: '🌐 Additional Link', url: 'https://', assignedPixels: [...coords] }]);
  };

  const removeLink = (index: number) => {
    if (checkoutLinks.length <= 1) return;
    setCheckoutLinks(checkoutLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...checkoutLinks];
    updated[index] = { ...updated[index], [field]: value };
    setCheckoutLinks(updated);
  };

  const togglePixelInLink = (linkIdx: number, pixelKey: string) => {
    const updated = [...checkoutLinks];
    const currentAssigned = updated[linkIdx].assignedPixels || [];
    if (currentAssigned.includes(pixelKey)) {
      updated[linkIdx].assignedPixels = currentAssigned.filter(k => k !== pixelKey);
    } else {
      updated[linkIdx].assignedPixels = [...currentAssigned, pixelKey];
    }
    setCheckoutLinks(updated);
  };

  const assignAllPixelsToLink = (linkIdx: number) => {
    const updated = [...checkoutLinks];
    updated[linkIdx].assignedPixels = [...coords];
    setCheckoutLinks(updated);
  };

  const autoSplitPixelsEqually = () => {
    if (checkoutLinks.length === 0 || coords.length === 0) return;
    const chunkSize = Math.ceil(coords.length / checkoutLinks.length);
    const updated = checkoutLinks.map((link, idx) => {
      const slice = coords.slice(idx * chunkSize, (idx + 1) * chunkSize);
      return {
        ...link,
        assignedPixels: slice.length > 0 ? slice : [...coords],
      };
    });
    setCheckoutLinks(updated);
  };

  if (!isCheckoutOpen) return null;

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setConflictError(null);

    try {
      const isLoaded = await loadRazorpayScript();

      // Step 1: Call Backend API to create Razorpay Order + reserve pixels atomically
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          count: selectedCount,
          coords,           // pass pixel coords for reservation
          session_id: sessionId, // unique browser-tab session
        }),
      });

      // Handle conflict (409) — pixels were sold/reserved by someone else
      if (res.status === 409) {
        const conflictData = await res.json();
        const takenCount = conflictData.taken?.length || 0;
        const reason = conflictData.reason === 'sold' ? 'already purchased' : 'currently being purchased by another user';
        setConflictError(
          `⚠️ ${takenCount} pixel${takenCount > 1 ? 's are' : ' is'} ${reason}. They have been removed from your selection. Please review and try again.`
        );
        setIsProcessing(false);
        return;
      }

      const orderData = await res.json();

      if (isLoaded && (window as any).Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SV6F6KkRKtMuKm',
          amount: orderData.amount || totalPrice * 100,
          currency: 'INR',
          name: '10 Million Pixels',
          description: `Claim ${selectedCount} Pixel${selectedCount > 1 ? 's' : ''}`,
          order_id: orderData.id,
          handler: function (response: any) {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });

            completePurchase({
              name: name || currentUser?.name || 'Pixel Master',
              username: username || `user_${Date.now()}`,
              bio,
              links: checkoutLinks,
            });
            setIsProcessing(false);
          },
          prefill: {
            name: name || currentUser?.name || 'Pixel Buyer',
            email: currentUser?.email || 'buyer@crorepixels.io',
          },
          theme: {
            color: '#00e5ff',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct allocation if script offline
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        completePurchase({
          name: name || currentUser?.name || 'Pixel Master',
          username: username || `user_${Date.now()}`,
          bio,
          links: checkoutLinks,
        });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Razorpay payment error:', err);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      completePurchase({
        name: name || currentUser?.name || 'Pixel Master',
        username: username || `user_${Date.now()}`,
        bio,
        links: checkoutLinks,
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6">
      <div className="bg-surface-container border border-outline-variant rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        
        {/* Top Accent Gradient Line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent shrink-0"></div>

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant text-primary shadow-sm">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-on-surface tracking-wide">Acquire Land Assets</h3>
              <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium">Configure display metadata & destination links</p>
            </div>
          </div>
          <button 
            onClick={closeCheckoutModal} 
            className="p-1.5 sm:p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-high"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Order Summary & Investment Breakdown */}
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Selected Land</span>
              </div>
              <span className="text-base sm:text-lg font-black text-on-surface block">{selectedCount} Pixel{selectedCount > 1 ? 's' : ''}</span>
              <span className="text-[11px] text-primary font-mono block">Rate: ₹10.00 / pixel</span>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-outline-variant pt-2.5 sm:pt-0 sm:pl-6">
              <span className="text-[10px] sm:text-xs text-on-surface-variant font-semibold uppercase tracking-wider block">Total Payable Cost</span>
              <span className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">₹{totalPrice}</span>
            </div>
          </div>

          {/* Conflict / Availability Error Banner */}
          {conflictError && (
            <div className="bg-red-950/60 border border-red-500/40 rounded-xl px-4 py-3 text-xs text-red-300 font-medium flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{conflictError}</span>
            </div>
          )}

          {/* Selected Pixel Numbers Chip Grid (1 - 10,000,000) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold uppercase tracking-wider">
              <span>Acquired Pixel Numbers (1 - 10,000,000)</span>
              <span className="font-mono text-primary text-[11px] sm:text-xs">{selectedCount} Total</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-2.5 sm:p-3 max-h-24 overflow-y-auto flex flex-wrap gap-1.5 text-[11px] sm:text-xs font-mono">
              {coords.slice(0, 30).map((c) => {
                const [x, y] = c.split(',').map(Number);
                const pixelId = y * 4000 + x + 1;
                return (
                  <span key={c} className="bg-surface-container-lowest px-2 py-0.5 rounded-md border border-outline-variant text-on-surface font-medium">
                    #{pixelId.toLocaleString()}
                  </span>
                );
              })}
              {selectedCount > 30 && (
                <span className="self-center px-1.5 text-primary font-semibold text-[11px]">
                  + {selectedCount - 30} more
                </span>
              )}
            </div>
          </div>

          {/* Profile & Linktree Form */}
          <div className="space-y-4 pt-3 border-t border-outline-variant">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Public Linktree & Profile Setup
              </h4>
            </div>

            {/* 2-Column Responsive Inputs on Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Display Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Display Name</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Acquirer / Brand Name"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/40"
                />
              </div>

              {/* Username Slug Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Username Handle (URL Slug)</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-surface-container-lowest border border-r-0 border-outline-variant rounded-l-xl px-3 py-2.5 text-[11px] sm:text-xs text-on-surface-variant font-mono shrink-0">
                    /@
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="handle"
                    className="w-full min-w-0 bg-surface-container-low border border-outline-variant rounded-r-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all font-mono placeholder:text-on-surface-variant/40"
                  />
                </div>
              </div>
            </div>

            {/* Linktree Multiple Destination URLs with Pixel Grouping */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span>Destination URLs & Pixel Groupings</span>
                </label>
                <div className="flex items-center gap-2">
                  {checkoutLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={autoSplitPixelsEqually}
                      className="text-xs text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1 transition-colors bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant"
                      title="Split acquired pixels equally between links"
                    >
                      <Split className="w-3 h-3 text-primary" />
                      <span>Split Equally</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-xs text-primary hover:text-primary-container font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {checkoutLinks.map((link, idx) => {
                  const assignedCount = (link.assignedPixels || coords).length;
                  return (
                    <div key={idx} className="bg-surface-container-low p-3 sm:p-3.5 rounded-xl border border-outline-variant space-y-2.5 relative group">
                      <div className="flex items-center justify-between border-b border-outline-variant pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-on-surface-variant font-bold uppercase tracking-wider">
                            Destination #{idx + 1}
                          </span>
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 rounded font-mono font-semibold">
                            {assignedCount} / {coords.length} Pixels
                          </span>
                        </div>
                        {checkoutLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLink(idx)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1"
                            title="Remove Destination"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={link.title}
                          onChange={(e) => updateLink(idx, 'title', e.target.value)}
                          placeholder="Button Title (e.g., Visit Website)"
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all placeholder:text-on-surface-variant/40"
                        />
                        <input
                          type="text"
                          required
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                          placeholder="URL (https://...)"
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-all font-mono placeholder:text-on-surface-variant/40"
                        />
                      </div>

                      {/* Pixel Grouping Sub-Selector */}
                      <div className="pt-2 border-t border-outline-variant space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-on-surface-variant font-medium flex items-center gap-1">
                            <Grid className="w-3 h-3 text-primary" />
                            <span>Assigned Pixel Group ({assignedCount} pixels)</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => assignAllPixelsToLink(idx)}
                              className="text-[10px] text-on-surface-variant hover:text-on-surface underline"
                            >
                              Assign All
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenGroupSelector(openGroupSelector === idx ? null : idx)}
                              className="text-[10px] text-primary font-bold hover:underline"
                            >
                              {openGroupSelector === idx ? 'Close Grouping' : 'Custom Pixel Grouping'}
                            </button>
                          </div>
                        </div>

                        {openGroupSelector === idx && (
                          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 max-h-32 overflow-y-auto space-y-1.5 animate-in fade-in duration-150">
                            <span className="text-[10px] text-on-surface-variant block font-mono">
                              Click pixel numbers to include/exclude from Destination #{idx + 1}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {coords.map((c) => {
                                const [x, y] = c.split(',').map(Number);
                                const pixelId = y * 4000 + x + 1;
                                const isAssigned = (link.assignedPixels || coords).includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => togglePixelInLink(idx, c)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all border ${
                                      isAssigned
                                        ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                                        : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
                                    }`}
                                  >
                                    #{pixelId.toLocaleString()} {isAssigned ? '✓' : ''}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Security Guarantee Badge */}
          <div className="bg-surface-container-low p-3 sm:p-3.5 rounded-xl border border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">256-bit Encrypted Checkout Gateway</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-on-surface bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant shrink-0">
              <Lock className="w-3 h-3 text-primary" />
              <span>Razorpay Verified</span>
            </div>
          </div>

          {/* CTA Action Button */}
          <button
            onClick={handleRazorpayPayment}
            disabled={isProcessing}
            className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4 text-on-primary" />
            {isProcessing ? 'Connecting Gateway...' : `Proceed to Pay ₹${totalPrice}`}
          </button>

        </div>
      </div>
    </div>
  );
};
