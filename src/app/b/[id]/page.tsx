'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Youtube,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Send,
  MessageSquare,
  ExternalLink,
  ArrowLeft,
  Share2,
  Check,
} from 'lucide-react';

export default function BlockDetailPage() {
  const params = useParams();
  const blockId = params.id as string;

  const [block, setBlock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ seconds: number; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBlock() {
      try {
        const res = await fetch(`/api/blocks`);
        if (res.ok) {
          const data = await res.json();
          const target = Object.values(data.blocks || {}).find(
            (b: any) => b.id === blockId || b.id === `b_${blockId}`
          );
          setBlock(target || null);
        }
      } catch (e) {
        console.warn('Error loading block:', e);
      } finally {
        setLoading(false);
      }
    }
    loadBlock();
  }, [blockId]);

  const handleLinkClick = async (link: any) => {
    try {
      fetch('/api/links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id }),
      }).catch(() => {});
    } catch (e) {}

    if (link.delay_seconds && link.delay_seconds > 0) {
      setCountdown({ seconds: link.delay_seconds, url: link.redirect_url });

      let remaining = link.delay_seconds;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(null);
          window.open(link.redirect_url, '_blank');
        } else {
          setCountdown((prev) => (prev ? { ...prev, seconds: remaining } : null));
        }
      }, 1000);
    } else {
      window.open(link.redirect_url, '_blank');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-400" />;
      case 'x':
      case 'twitter':
        return <Twitter className="w-5 h-5 text-white" />;
      case 'github':
        return <Github className="w-5 h-5 text-white" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5 text-blue-400" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-400" />;
      case 'telegram':
        return <Send className="w-5 h-5 text-sky-400" />;
      case 'discord':
        return <MessageSquare className="w-5 h-5 text-indigo-400" />;
      default:
        return <Globe className="w-5 h-5 text-active-cyan" />;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d11] flex items-center justify-center text-neutral-400 text-xs font-mono">
        Loading Sovereign Block...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-active-cyan/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-active-lavender/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Top Floating Navigation */}
      <div className="fixed top-4 left-4 right-4 max-w-lg mx-auto flex items-center justify-between z-30">
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg bg-[#18181e]/80 backdrop-blur-md border border-[#333] text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>vist.bio Canvas</span>
        </Link>

        <button
          onClick={handleShare}
          className="px-3 py-1.5 rounded-lg bg-[#18181e]/80 backdrop-blur-md border border-[#333] text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Central Linktree Card */}
      <div className="relative z-20 max-w-md w-full bg-[#141418]/90 border border-[#2a2a34] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-16">
        
        {/* Avatar & Badges */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            {block?.owner_avatar ? (
              <img
                src={block.owner_avatar}
                alt={block.owner_name || 'Owner'}
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-active-cyan shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-active-cyan/30 to-active-lavender/30 text-white font-black text-3xl flex items-center justify-center mx-auto border-2 border-active-cyan shadow-xl">
                {(block?.owner_name || 'B')[0]}
              </div>
            )}
            <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full bg-[#181820] border border-[#333] text-[10px] font-mono text-active-cyan font-bold">
              100px
            </span>
          </div>

          <div>
            <h1 className="text-xl font-black text-white">{block?.owner_name || 'Sovereign Land Owner'}</h1>
            <p className="text-xs text-active-cyan font-mono font-semibold">
              @{block?.owner_username || 'creator'} • Block [{block?.grid_x || 0}, {block?.grid_y || 0}]
            </p>
          </div>

          {block?.config?.bio && (
            <p className="text-xs text-neutral-300 leading-relaxed bg-[#181822] p-3 rounded-2xl border border-[#282834]">
              {block.config.bio}
            </p>
          )}
        </div>

        {/* Links List */}
        <div className="space-y-3">
          {block?.links && block.links.length > 0 ? (
            block.links.map((link: any) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="w-full p-4 rounded-2xl bg-[#1c1c26] hover:bg-[#242432] border border-[#2e2e3e] hover:border-active-cyan/50 text-left transition-all group flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#282836] group-hover:bg-[#303042] transition-colors">
                    {getPlatformIcon(link.platform)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white group-hover:text-active-cyan transition-colors">
                      {link.title}
                    </h2>
                    <span className="text-[10px] text-neutral-400 truncate max-w-[180px] block">
                      {link.redirect_url.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {link.delay_seconds > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-bright text-neutral-300">
                      {link.delay_seconds}s
                    </span>
                  )}
                  <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-neutral-500 bg-[#181822] rounded-2xl border border-[#262634]">
              No custom links attached to this sovereign block yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-[#262630]">
          <Link
            href="/"
            className="text-[11px] font-bold text-neutral-400 hover:text-active-cyan transition-colors"
          >
            Powered by vist.bio — Claim Your Sovereign Land
          </Link>
        </div>

      </div>

      {/* Delayed Redirect Notification */}
      {countdown && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-active-cyan text-black px-6 py-3 rounded-full font-black text-xs shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-150">
          <span>Opening destination in {countdown.seconds}s...</span>
          <button
            onClick={() => {
              setCountdown(null);
              window.open(countdown.url, '_blank');
            }}
            className="px-3 py-1 rounded-full bg-black text-white text-[10px]"
          >
            Open Immediately
          </button>
        </div>
      )}
    </div>
  );
}
