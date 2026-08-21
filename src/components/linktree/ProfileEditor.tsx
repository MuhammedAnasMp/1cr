'use client';

import React, { useState } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { Plus, Trash2, Save, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export const ProfileEditor: React.FC = () => {
  const { userProfile, updateProfile } = usePixelStore();

  const [username, setUsername] = useState(userProfile?.username || 'creator');
  const [name, setName] = useState(userProfile?.name || 'Sarah Chen');
  const [bio, setBio] = useState(userProfile?.bio || 'Building future tech on PixelVerse.');
  const [avatar, setAvatar] = useState(userProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [links, setLinks] = useState(
    userProfile?.links || [
      { id: '1', profile_id: 'p1', title: '🚀 My Website', url: 'https://mysite.com', sort_order: 1, clicks: 120 },
      { id: '2', profile_id: 'p1', title: '🐦 X Profile', url: 'https://x.com', sort_order: 2, clicks: 84 },
    ]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddLink = () => {
    setLinks([
      ...links,
      {
        id: `link_${Date.now()}`,
        profile_id: userProfile?.id || 'prof_1',
        title: 'New Custom Link',
        url: 'https://',
        sort_order: links.length + 1,
        clicks: 0,
      },
    ]);
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const handleLinkChange = (id: string, field: 'title' | 'url', value: string) => {
    setLinks(
      links.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      username,
      name,
      bio,
      avatar,
      links,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto p-4 md:p-6">
      {/* Left Column: Profile Config Form */}
      <div className="lg:col-span-7 bg-surface-container border border-outline-variant rounded-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Linktree Micro-Page Editor</h2>
            <p className="text-xs text-on-surface-variant">Customize what visitors see when clicking your pixels.</p>
          </div>
          {savedSuccess && (
            <div className="flex items-center gap-1 text-xs text-on-secondary-container font-semibold bg-secondary-container px-3 py-1 rounded">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-on-surface-variant font-medium block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
              />
            </div>
            <div>
              <label className="text-xs text-on-surface-variant font-medium block mb-1">Username / Public URL</label>
              <div className="flex items-center">
                <span className="bg-surface-container-lowest border border-r-0 border-outline-variant rounded-l px-3 py-2 text-xs text-on-surface-variant">
                  /@
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-r px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-on-surface-variant font-medium block mb-1">Avatar Image URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
            />
          </div>

          <div>
            <label className="text-xs text-on-surface-variant font-medium block mb-1">Bio Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-outline"
            />
          </div>

          {/* Links Section */}
          <div className="pt-4 border-t border-outline-variant">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Social Links & Buttons</h3>
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1 text-xs text-active-cyan hover:text-active-cyan/80 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Link
              </button>
            </div>

            <div className="space-y-3">
              {links.map((link, idx) => (
                <div key={link.id} className="bg-surface-container-lowest border border-outline-variant rounded-card p-3 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-on-surface-variant font-mono">Link #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Button Title (e.g. 🚀 My Store)"
                    value={link.title}
                    onChange={(e) => handleLinkChange(link.id, 'title', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-outline"
                  />
                  <input
                    type="text"
                    placeholder="Destination URL (https://...)"
                    value={link.url}
                    onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface-variant focus:outline-none focus:border-outline"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-white hover:bg-neutral-200 text-background font-bold text-xs rounded flex items-center justify-center gap-2 transition-colors mt-6 shadow"
          >
            <Save className="w-4 h-4" /> Save Profile Changes
          </button>
        </form>
      </div>

      {/* Right Column: Live Mobile Preview */}
      <div className="lg:col-span-5 flex flex-col items-center justify-start">
        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-active-cyan" /> Live Mobile View
        </div>
        <div className="w-[280px] h-[520px] bg-background border-4 border-outline-variant rounded-[36px] shadow-2xl p-4 flex flex-col items-center text-center overflow-y-auto relative">
          <div className="w-20 h-4 bg-outline-variant rounded-full mb-4"></div>
          <img src={avatar} alt={name} className="w-16 h-16 rounded-full border-2 border-active-cyan object-cover mb-2" />
          <h4 className="text-sm font-bold text-white mb-0.5">{name}</h4>
          <span className="text-[10px] text-active-cyan font-mono mb-2">@{username}</span>
          <p className="text-[11px] text-on-surface-variant mb-4 leading-tight">{bio}</p>

          <div className="w-full space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="w-full py-2 px-3 bg-surface-container border border-outline-variant rounded text-[11px] text-white font-medium flex items-center justify-between truncate hover:border-active-cyan hover:text-active-cyan transition-colors"
              >
                <span className="truncate">{link.title}</span>
                <ExternalLink className="w-3 h-3 text-on-surface-variant" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
