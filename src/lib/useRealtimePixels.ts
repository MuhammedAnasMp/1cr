'use client';

import { useEffect, useRef } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { usePixelStore } from '@/store/usePixelStore';

/**
 * useRealtimePixels
 *
 * Subscribes to Firebase Realtime Database `/pixels/events` node.
 * When any pixel event fires (reserve / sold / available), it patches
 * the Zustand pixel store in real time — causing the canvas to re-render
 * with the updated pixel status WITHOUT a full page refresh.
 *
 * Free Spark plan note: supports up to 100 simultaneous connections.
 * This uses a single shared listener per browser tab — 1 connection per tab.
 */
export function useRealtimePixels() {
  const patchPixel = usePixelStore((s) => s.patchPixel);
  const listenerRef = useRef<DatabaseReference | null>(null);

  useEffect(() => {
    if (!rtdb) return;
    try {
      const eventsRef = ref(rtdb, '/pixels/events');
      listenerRef.current = eventsRef;

      // onValue fires immediately with current data, then on every change
      const unsubscribe = onValue(
        eventsRef,
        (snapshot) => {
          if (!snapshot.exists()) return;
          snapshot.forEach((child) => {
            const data = child.val();
            if (data && typeof data.x === 'number' && typeof data.y === 'number') {
              patchPixel({
                id: Number(child.key),
                x: data.x,
                y: data.y,
                status: data.status,
                color: data.status === 'reserved'
                  ? '#F59E0B'   // amber — being purchased
                  : data.status === 'sold'
                  ? (data.color || '#00e5ff')  // cyan — owned
                  : undefined,  // available — use default
                owner_id: data.owner_id,
                owner_name: data.owner_name,
                owner_avatar: data.owner_avatar,
                profile_id: data.profile_id,
                price: 10,
              });
            }
          });
        },
        (error) => {
          // RTDB errors are non-critical — canvas still works from initial fetch
          console.warn('Firebase RTDB listener error (non-critical):', error);
        }
      );

      return () => {
        off(eventsRef);
        unsubscribe();
      };
    } catch (err) {
      console.warn('Firebase RTDB setup failed (non-critical):', err);
    }
  }, [patchPixel]);
}

/**
 * useCanvasStats
 *
 * Subscribes to Firebase RTDB `/canvas/stats` for live online count,
 * total sold, and currently reserved pixel counts.
 */
export function useCanvasStats(onUpdate: (stats: {
  total_sold: number;
  total_reserved: number;
  updated_at?: number;
}) => void) {
  useEffect(() => {
    if (!rtdb) return;
    try {
      const statsRef = ref(rtdb, '/canvas/stats');

      const unsubscribe = onValue(
        statsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            onUpdate(snapshot.val());
          }
        },
        (error) => {
          console.warn('Firebase RTDB stats error (non-critical):', error);
        }
      );

      return () => {
        off(statsRef);
        unsubscribe();
      };
    } catch (err) {
      console.warn('Firebase RTDB stats setup failed:', err);
    }
  }, [onUpdate]);
}
