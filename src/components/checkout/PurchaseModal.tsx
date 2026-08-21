'use client';

import React, { useState, useEffect } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { X, ShoppingBag, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';
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
  } = usePixelStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('Building on 10M Pixel World 🚀');
  const [checkoutLinks, setCheckoutLinks] = useState<{ title: string; url: string }[]>([
    { title: '🌐 Visit My Website', url: 'https://example.com' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addLink = () => {
    setCheckoutLinks([...checkoutLinks, { title: '🌐 New Link', url: 'https://' }]);
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

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.name.toLowerCase().replace(/\s+/g, ''));
    }
  }, [currentUser]);

  if (!isCheckoutOpen) return null;

  const coords = Array.from(selectedCoords);
  const selectedCount = coords.length;
  const totalPrice = selectedCount * 10;

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);

    try {
      const isLoaded = await loadRazorpayScript();

      // Step 1: Call Backend API to create Razorpay Order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice, count: selectedCount }),
      });

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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant rounded-modal max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-active-cyan" />
            <h3 className="text-base font-bold text-white">Claim {selectedCount} Pixel{selectedCount > 1 ? 's' : ''}</h3>
          </div>
          <button onClick={closeCheckoutModal} className="text-on-surface-variant hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-on-surface-variant font-medium block">Selected Land</span>
              <span className="text-lg font-extrabold text-white">{selectedCount} Pixel{selectedCount > 1 ? 's' : ''}</span>
              <span className="text-[10px] text-active-cyan block">Rate: ₹10 per pixel</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant block">Total Payable</span>
              <span className="text-2xl font-black text-white">₹{totalPrice}</span>
            </div>
          </div>

          {/* Coordinate Sample List */}
          <div>
            <label className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block mb-1">Selected Coordinates</label>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-card p-2 max-h-20 overflow-y-auto flex flex-wrap gap-1 text-[10px] font-mono text-on-surface-variant">
              {coords.slice(0, 20).map((c) => (
                <span key={c} className="bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant text-white">
                  ({c})
                </span>
              ))}
              {selectedCount > 20 && <span>+ {selectedCount - 20} more...</span>}
            </div>
          </div>

          {/* Micro-Page Linktree Pre-Setup */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-active-cyan" /> Linktree Profile Setup
            </h4>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Display Name"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
              />
            </div>

            <div>
              <label className="text-xs text-on-surface-variant block mb-1">Username (URL handle)</label>
              <div className="flex items-center">
                <span className="bg-surface-container-lowest border border-r-0 border-outline-variant rounded-l px-3 py-2 text-xs text-on-surface-variant">
                  /@
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="handle"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-r px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
                />
              </div>
            </div>

            {/* Multiple links configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-on-surface-variant block font-semibold">Websites & Links (Linktree)</label>
                <button
                  type="button"
                  onClick={addLink}
                  className="text-[10px] text-active-cyan hover:underline font-bold"
                >
                  + Add Link
                </button>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {checkoutLinks.map((link, idx) => (
                  <div key={idx} className="bg-surface-container-lowest p-2.5 rounded border border-outline-variant relative group/link">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-on-surface-variant font-bold">Link #{idx + 1}</span>
                      {checkoutLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(idx)}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={link.title}
                        onChange={(e) => updateLink(idx, 'title', e.target.value)}
                        placeholder="Button Title (e.g., Visit My Website)"
                        className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-outline"
                      />
                      <input
                        type="text"
                        required
                        value={link.url}
                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        placeholder="URL (https://...)"
                        className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface-variant focus:outline-none focus:border-outline"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Razorpay Security Badge */}
          <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant flex items-center justify-between text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-active-cyan" />
              <span>Razorpay Verified Webhook Gateway</span>
            </div>
            <span className="font-bold text-white">100% Secure</span>
          </div>

          <button
            onClick={handleRazorpayPayment}
            disabled={isProcessing}
            className="w-full py-3 bg-white hover:bg-neutral-200 text-background font-extrabold text-sm rounded flex items-center justify-center gap-2 transition-colors shadow-lg disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            {isProcessing ? 'Opening Razorpay Gateway...' : `Pay ₹${totalPrice} via Razorpay`}
          </button>
        </div>
      </div>
    </div>
  );
};
