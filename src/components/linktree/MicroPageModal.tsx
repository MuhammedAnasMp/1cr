'use client';

import React from 'react';
import { usePixelStore } from '@/store/usePixelStore';

export const MicroPageModal: React.FC = () => {
  const { activeProfile, closeProfileModal } = usePixelStore();

  if (!activeProfile) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeProfileModal();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* Close button top right */}
      <div
        onClick={closeProfileModal}
        className="fixed top-5 right-6 text-3xl font-light text-white cursor-pointer hover:opacity-80 transition-opacity select-none z-50"
      >
        ×
      </div>

      {/* Profile Card Overlay */}
      <div className="w-[360px] max-w-[calc(100%-30px)] p-8 rounded-modal bg-surface-container/70 backdrop-blur-md border border-outline-variant text-center shadow-[0_30px_100px_rgba(0,0,0,0.7)] text-white relative">
        {/* Avatar */}
        <img
          src={activeProfile.avatar}
          alt={activeProfile.username}
          className="w-[90px] h-[90px] rounded-full object-cover border border-active-cyan mx-auto shadow-lg"
        />

        {/* Username */}
        <h2 className="text-xl font-bold mt-4 mb-1 text-white tracking-wide">
          @{activeProfile.username}
        </h2>

        {/* Bio */}
        <div className="text-sm text-on-surface-variant mb-5 leading-relaxed">
          {activeProfile.bio}
        </div>

        {/* Links */}
        <div className="space-y-2.5 w-full">
          {activeProfile.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 rounded bg-surface-container-highest hover:text-active-cyan border border-outline-variant text-white text-sm font-semibold text-center transition-all duration-200 shadow group"
            >
              <div>{link.title}</div>
              {link.assigned_pixels && link.assigned_pixels.length > 0 && (
                <span className="text-[10px] text-active-cyan/90 group-hover:text-active-cyan font-mono block font-medium mt-0.5">
                  Linked to {link.assigned_pixels.length} Pixel{link.assigned_pixels.length > 1 ? 's' : ''}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
