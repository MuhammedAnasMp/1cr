'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { WorldMapView } from '@/components/canvas/WorldMapView';
import { VirtualizedGridView } from '@/components/canvas/VirtualizedGridView';
import { BlockSelectionHUD } from '@/components/canvas/BlockSelectionHUD';
import { BlockModal } from '@/components/linktree/BlockModal';
import { BlockPurchaseModal } from '@/components/checkout/BlockPurchaseModal';
import { useBlockStore } from '@/store/useBlockStore';
import { usePartyKitRealtime } from '@/lib/partykit';

export default function HomePage() {
  const {
    viewMode,
    initializeClientStore,
    setPresence,
    addPulse,
    patchBlock,
  } = useBlockStore();

  // 1. Initialize client store (pricing, countries, blocks)
  useEffect(() => {
    initializeClientStore();
  }, [initializeClientStore]);

  // 2. Wire PartyKit Realtime Sync (Presence, Pulses, Reservations)
  usePartyKitRealtime({
    onPresenceUpdate: (pres) => {
      setPresence(pres);
    },
    onPulse: (pulse) => {
      addPulse(pulse);
      // If purchase pulse, fetch latest blocks or patch
      if (pulse.block_ids && pulse.block_ids.length > 0) {
        pulse.block_ids.forEach((id) => {
          const coords = id.replace('b_', '').split('_');
          if (coords.length === 2) {
            patchBlock({
              id,
              grid_x: parseInt(coords[0], 10),
              grid_y: parseInt(coords[1], 10),
              owner_name: pulse.owner_name,
              status: 'sold',
            });
          }
        });
      }
    },
    onReservationChange: (data) => {
      if (data.block_ids) {
        data.block_ids.forEach((id) => {
          const coords = id.replace('b_', '').split('_');
          if (coords.length === 2) {
            patchBlock({
              id,
              grid_x: parseInt(coords[0], 10),
              grid_y: parseInt(coords[1], 10),
              status: data.status === 'reserved' ? 'reserved' : 'available',
            });
          }
        });
      }
    },
  });

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans overflow-hidden">
      {/* Top Navbar with View Switcher, Live Presence & Auth */}
      <Navbar />

      {/* Main Interactive Canvas Area (Pure View/Layout Switch) */}
      <main className="relative flex-1 w-full h-[calc(100vh-53px)] overflow-hidden">
        {viewMode === 'map' ? (
          <WorldMapView />
        ) : (
          <VirtualizedGridView />
        )}

        {/* Floating Multi-Block Selection & Volume Pricing HUD */}
        <BlockSelectionHUD />
      </main>

      {/* Interactive Linktree Profile & Socials Modal */}
      <BlockModal />

      {/* Multi-Currency Sovereign Block Checkout Modal */}
      <BlockPurchaseModal />
    </div>
  );
}
