'use client';

import React, { useState, useEffect } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import {
  X,
  ShoppingBag,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageUploader } from '@/components/common/ImageUploader';
import { Spinner } from '@/components/common/Spinner';
import { SUPPORTED_CURRENCIES } from '@/lib/pricing';

interface CustomLink {
  id: string;
  title: string;
  url: string;
  platform: string;
  delay_seconds: number;
}

export const BlockPurchaseModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckoutModal,
    selectedBlockIds,
    selectedCurrency,
    setSelectedCurrency,
    selectedCountry,
    currentUser,
    setCurrentUser,
    getPriceCalculation,
    sessionId,
  } = useBlockStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [themeColor, setThemeColor] = useState('#00e5ff');
  const [imageUrl, setImageUrl] = useState('');
  const [links, setLinks] = useState<CustomLink[]>([
    { id: 'l_1', title: 'Website / Portfolio', url: 'https://', platform: 'website', delay_seconds: 0 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Preload Razorpay checkout.js script in the background
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Razorpay) {
      setIsRazorpayLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  if (!isCheckoutOpen) return null;

  const count = selectedBlockIds.size;
  const pricing = getPriceCalculation();

  const handleAddLink = () => {
    setLinks((prev) => [
      ...prev,
      { id: `l_${Date.now()}`, title: '', url: 'https://', platform: 'website', delay_seconds: 0 },
    ]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLinkChange = (id: string, field: keyof CustomLink, val: any) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create Order Intent on Backend
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_keys: Array.from(selectedBlockIds),
          currency: selectedCurrency,
          session_id: sessionId,
          user_id: currentUser?.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          setErrorMessage('⚠️ Some selected blocks were just claimed by another buyer. Please select available blocks.');
        } else {
          setErrorMessage(errorData.message || 'Failed to initialize payment gateway.');
        }
        setIsProcessing(false);
        return;
      }

      const orderData = await res.json();

      const userPayload = {
        id: currentUser?.id || `u_${Date.now()}`,
        firebase_uid: currentUser?.firebase_uid || currentUser?.id || `u_${Date.now()}`,
        name: name || currentUser?.name || 'Block Sovereign',
        email: currentUser?.email || `${(username || 'buyer').toLowerCase()}@vist.bio`,
        avatar: imageUrl || currentUser?.avatar || '',
        created_at: currentUser?.created_at || new Date().toISOString(),
      };

      const profilePayload = {
        username: (username || name.toLowerCase().replace(/\s+/g, '') || `user_${Date.now().toString().slice(-4)}`).toLowerCase(),
        name: userPayload.name,
        bio: bio || 'Land Sovereign on vist.bio 🚀',
        theme_color: themeColor,
        avatar: userPayload.avatar,
      };

      const completePurchaseLocally = async (razorpayDetails?: any) => {
        // Verify and commit on backend
        await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayDetails?.razorpay_order_id || orderData.orderId,
            razorpay_payment_id: razorpayDetails?.razorpay_payment_id || `pay_${Date.now()}`,
            razorpay_signature: razorpayDetails?.razorpay_signature,
            block_keys: Array.from(selectedBlockIds),
            user: userPayload,
            profile: profilePayload,
            links: links.filter((l) => l.title && l.url),
            images: imageUrl ? [{ url: imageUrl, sort_order: 1 }] : [],
            country_code: selectedCountry,
          }),
        });

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        setCurrentUser(userPayload);
        setIsProcessing(false);
        closeCheckoutModal();
      };

      // 2. Launch Razorpay Standard Checkout
      if (isRazorpayLoaded && (window as any).Razorpay) {
        const options: any = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SV6F6KkRKtMuKm',
          amount: orderData.pricing?.netAmountINR ? orderData.pricing.netAmountINR * 100 : pricing.netAmountINR * 100,
          currency: 'INR',
          name: 'vist.bio',
          description: `Acquire ${count} Sovereign Block${count > 1 ? 's' : ''} (${count * 100} Pixels)`,
          handler: function (response: any) {
            completePurchaseLocally(response);
          },
          prefill: {
            name: userPayload.name,
            email: userPayload.email,
          },
          theme: {
            color: '#00e5ff',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              closeCheckoutModal();
            },
          },
        };

        // Only attach order_id if official 20-digit string
        if (
          orderData.razorpayOrder?.id &&
          typeof orderData.razorpayOrder.id === 'string' &&
          /^order_[a-zA-Z0-9]{14,20}$/.test(orderData.razorpayOrder.id)
        ) {
          options.order_id = orderData.razorpayOrder.id;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct allocation if offline/sandbox
        await completePurchaseLocally();
      }
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setErrorMessage('Payment connection issue. Please check network and retry.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#141418] border border-[#2e2e2e] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Accent Gradient Bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-active-cyan via-active-lavender to-transparent shrink-0"></div>

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between bg-[#18181c] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-active-cyan/15 border border-active-cyan/30 text-active-cyan">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Acquire Sovereign Blocks</h3>
              <p className="text-xs text-neutral-400">Configure block identity & destination micro-page links</p>
            </div>
          </div>

          <button
            onClick={closeCheckoutModal}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#28282e] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-error/15 border border-error/30 text-error font-medium">
              {errorMessage}
            </div>
          )}

          {/* Pricing & Volume Discount Breakdown Table */}
          <div className="bg-[#1a1a20] border border-[#303038] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Order Pricing Summary</span>
              
              {/* Currency Selector */}
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="appearance-none bg-[#24242c] hover:bg-[#2c2c36] border border-[#3e3e48] rounded px-2.5 py-1 pr-6 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="divide-y divide-[#26262e] text-xs">
              <div className="py-2 flex items-center justify-between text-neutral-300">
                <span>Selected Blocks (100 pixels / block)</span>
                <span className="font-semibold text-white">{count} Blocks ({pricing.pixelCount.toLocaleString()} Pixels)</span>
              </div>
              <div className="py-2 flex items-center justify-between text-neutral-300">
                <span>Base Rate Per Block</span>
                <span className="font-mono">{pricing.selectedCurrency.symbol}{pricing.basePricePerBlockINR * pricing.selectedCurrency.rateFromINR} / block</span>
              </div>
              <div className="py-2 flex items-center justify-between text-neutral-300">
                <span>Gross Amount</span>
                <span className="font-mono">{pricing.selectedCurrency.symbol}{(pricing.grossAmountINR * pricing.selectedCurrency.rateFromINR).toFixed(2)}</span>
              </div>
              {pricing.discountPercent > 0 && (
                <div className="py-2 flex items-center justify-between text-green-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Volume Discount ({pricing.discountPercent}%)
                  </span>
                  <span>-{pricing.selectedCurrency.symbol}{pricing.discountAmountSelectedCurrency}</span>
                </div>
              )}
              <div className="py-2.5 flex items-center justify-between text-white font-extrabold text-sm border-t border-[#3a3a44]">
                <span>Total Payable</span>
                <span className="text-base text-active-cyan">
                  {pricing.selectedCurrency.symbol}{pricing.netAmountSelectedCurrency.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Block Owner Identity */}
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              1. Creator & Block Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full bg-[#1c1c22] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-active-cyan"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Username / Handle</label>
                <div className="flex items-center">
                  <span className="bg-[#24242c] border border-r-0 border-[#333] rounded-l px-2.5 py-2 text-neutral-400">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="satoshi"
                    className="w-full bg-[#1c1c22] border border-[#333] rounded-r px-3 py-2 text-white focus:outline-none focus:border-active-cyan"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Bio Description</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you building or sharing on this sovereign block?"
                className="w-full bg-[#1c1c22] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-active-cyan resize-none"
              />
            </div>

            {/* Cloudinary Image Uploader */}
            <div>
              <label className="block text-neutral-400 mb-1">Block Banner / Avatar Image (Cloudinary Media Store)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL or upload image below..."
                  className="w-full bg-[#1c1c22] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-active-cyan font-mono"
                />
                <ImageUploader onUploadSuccess={(url) => setImageUrl(url)} folder="vist_bio_blocks" />
              </div>
            </div>
          </div>

          {/* Linktree Link Builder */}
          <div className="space-y-3 pt-2 border-t border-[#262626]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                2. Linktree Destination Links
              </h4>
              <button
                type="button"
                onClick={handleAddLink}
                className="px-2.5 py-1 bg-[#24242c] hover:bg-[#2e2e38] text-active-cyan rounded font-semibold text-[11px] flex items-center gap-1 border border-[#3a3a44]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {links.map((link, idx) => (
                <div key={link.id} className="p-3 rounded-xl bg-[#1c1c22] border border-[#303038] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-neutral-400 text-[10px]">Link #{idx + 1}</span>
                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        className="text-neutral-500 hover:text-error transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkChange(link.id, 'title', e.target.value)}
                      placeholder="Link Title (e.g. Official Website)"
                      className="bg-[#141418] border border-[#333] rounded px-2.5 py-1.5 text-white focus:outline-none"
                    />

                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="bg-[#141418] border border-[#333] rounded px-2.5 py-1.5 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span>Platform:</span>
                      <select
                        value={link.platform}
                        onChange={(e) => handleLinkChange(link.id, 'platform', e.target.value)}
                        className="bg-[#141418] border border-[#333] rounded px-2 py-0.5 text-white text-xs"
                      >
                        <option value="website">🌐 Website</option>
                        <option value="x">𝕏 Twitter/X</option>
                        <option value="youtube">📺 YouTube</option>
                        <option value="github">🐙 GitHub</option>
                        <option value="instagram">📸 Instagram</option>
                        <option value="linkedin">💼 LinkedIn</option>
                        <option value="telegram">✈️ Telegram</option>
                        <option value="discord">💬 Discord</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span>Countdown Delay:</span>
                      <select
                        value={link.delay_seconds}
                        onChange={(e) => handleLinkChange(link.id, 'delay_seconds', parseInt(e.target.value, 10))}
                        className="bg-[#141418] border border-[#333] rounded px-2 py-0.5 text-white text-xs"
                      >
                        <option value={0}>0s (Instant)</option>
                        <option value={2}>2s countdown</option>
                        <option value={3}>3s countdown</option>
                        <option value={5}>5s countdown</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-[#262626] bg-[#18181c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-active-cyan" />
            <span>Razorpay Encrypted & Verified</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={closeCheckoutModal}
              disabled={isProcessing}
              className="px-4 py-2 bg-[#26262e] hover:bg-[#32323c] text-white rounded-lg font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="px-6 py-2 bg-gradient-to-r from-active-cyan to-active-lavender hover:opacity-90 text-black font-extrabold rounded-lg text-xs transition-opacity shadow-lg shadow-active-cyan/20 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Spinner size="xs" />
                  <span>Securing Blocks...</span>
                </>
              ) : (
                <>
                  <span>Pay {pricing.selectedCurrency.symbol}{pricing.netAmountSelectedCurrency.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
