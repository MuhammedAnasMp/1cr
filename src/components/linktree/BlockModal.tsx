'use client';

import React, { useState } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import {
  X,
  ExternalLink,
  Globe,
  Youtube,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Send,
  MessageSquare,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import Link from 'next/link';

export const BlockModal: React.FC = () => {
  const { activeBlockDetail, setActiveBlockDetail } = useBlockStore();
  const [countdownLink, setCountdownLink] = useState<{ id: string; seconds: number; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!activeBlockDetail) return null;

  const handleLinkClick = async (link: any) => {
    // 1. Log click analytics on backend
    try {
      fetch('/api/links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id }),
      }).catch(() => {});
    } catch (e) {}

    // 2. Handle Countdown Delay if configured
    if (link.delay_seconds && link.delay_seconds > 0) {
      setCountdownLink({ id: link.id, seconds: link.delay_seconds, url: link.redirect_url });

      let remaining = link.delay_seconds;
      const interval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdownLink(null);
          window.open(link.redirect_url, '_blank');
        } else {
          setCountdownLink((prev) => (prev ? { ...prev, seconds: remaining } : null));
        }
      }, 1000);
    } else {
      window.open(link.redirect_url, '_blank');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-400" />;
      case 'x':
      case 'twitter':
        return <Twitter className="w-4 h-4 text-white" />;
      case 'github':
        return <Github className="w-4 h-4 text-white" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-400" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-400" />;
      case 'discord':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      default:
        return <Globe className="w-4 h-4 text-active-cyan" />;
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/b/${activeBlockDetail.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#141418] border border-[#2e2e2e] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        
        {/* Banner Area */}
        <div className="relative h-32 w-full bg-gradient-to-r from-[#1c1b29] to-[#121624] overflow-hidden shrink-0">
          {activeBlockDetail.image_url && (
            <img
              src={activeBlockDetail.image_url}
              alt={activeBlockDetail.owner_name || 'Block'}
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent"></div>

          {/* Close & Share buttons */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-black/60 hover:bg-black text-neutral-300 hover:text-white transition-colors backdrop-blur-sm"
              title="Copy share link"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveBlockDetail(null)}
              className="p-2 rounded-full bg-black/60 hover:bg-black text-neutral-300 hover:text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Info */}
        <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto custom-scrollbar">
          {/* Avatar */}
          <div className="-mt-12 mb-3 flex items-end justify-between">
            {activeBlockDetail.owner_avatar ? (
              <img
                src={activeBlockDetail.owner_avatar}
                alt={activeBlockDetail.owner_name || 'Owner'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#333] shadow-xl bg-[#18181c]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-active-cyan/30 to-active-lavender/30 text-white font-black text-2xl flex items-center justify-center border-2 border-[#333] shadow-xl">
                {(activeBlockDetail.owner_name || 'B')[0]}
              </div>
            )}

            <span className="px-3 py-1 rounded-full bg-[#202028] border border-[#333] text-[11px] font-mono text-active-cyan font-semibold">
              Block [{activeBlockDetail.grid_x}, {activeBlockDetail.grid_y}]
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-black text-white">{activeBlockDetail.owner_name || 'Block Sovereign'}</h3>
            <p className="text-xs text-active-cyan font-mono font-medium">
              @{activeBlockDetail.owner_username || 'creator'}
            </p>
          </div>

          {activeBlockDetail.config?.bio && (
            <p className="text-xs text-neutral-300 mb-5 leading-relaxed bg-[#181820] p-3 rounded-xl border border-[#282832]">
              {activeBlockDetail.config.bio}
            </p>
          )}

          {/* Links Section */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Connected Channels & Links
            </h4>

            {activeBlockDetail.links && activeBlockDetail.links.length > 0 ? (
              activeBlockDetail.links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className="w-full p-3 rounded-xl bg-[#1c1c24] hover:bg-[#242430] border border-[#2e2e3a] hover:border-active-cyan/40 text-left transition-all group flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#282834] group-hover:bg-[#303040] transition-colors">
                      {getPlatformIcon(link.platform)}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-active-cyan transition-colors">
                        {link.title}
                      </h5>
                      <span className="text-[10px] text-neutral-400 truncate max-w-[200px] block">
                        {link.redirect_url.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {link.delay_seconds > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-bright text-neutral-300">
                        {link.delay_seconds}s delay
                      </span>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-neutral-500 bg-[#181820] rounded-xl border border-[#262630]">
                No external links configured for this block.
              </div>
            )}
          </div>

          {/* Direct Link to Standalone Page */}
          <div className="mt-6 pt-4 border-t border-[#26262e] flex items-center justify-between text-xs">
            <span className="text-neutral-400">Standalone Micro-Page:</span>
            <Link
              href={`/b/${activeBlockDetail.id}`}
              className="text-active-cyan hover:underline font-semibold flex items-center gap-1"
            >
              <span>vist.bio/b/{activeBlockDetail.id}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Countdown Redirect Toast */}
        {countdownLink && (
          <div className="p-3 bg-active-cyan text-black font-extrabold text-xs flex items-center justify-between shrink-0">
            <span>Redirecting to destination in {countdownLink.seconds}s...</span>
            <button
              onClick={() => {
                setCountdownLink(null);
                window.open(countdownLink.url, '_blank');
              }}
              className="px-2 py-0.5 rounded bg-black text-white text-[10px]"
            >
              Skip Countdown
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
