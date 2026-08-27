'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PartySocket from 'partysocket';
import { CanvasPulseEvent, RealtimePresence } from '@/types';

export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'vist-bio.partykit.dev';

export function usePartyKitRealtime({
  onPulse,
  onReservationChange,
  onPresenceUpdate,
}: {
  onPulse?: (event: CanvasPulseEvent) => void;
  onReservationChange?: (data: { block_ids: string[]; session_id: string; status: 'reserved' | 'released'; expires_at?: string }) => void;
  onPresenceUpdate?: (presence: RealtimePresence) => void;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<RealtimePresence>({ viewer_count: 1, active_sessions: 1 });
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    let socket: PartySocket | null = null;

    try {
      socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: 'canvas-global',
      });
      socketRef.current = socket;

      socket.addEventListener('open', () => {
        setIsConnected(true);
      });

      socket.addEventListener('close', () => {
        setIsConnected(false);
      });

      socket.addEventListener('message', (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'presence') {
            const pres = { viewer_count: payload.viewers || 1, active_sessions: payload.sessions || 1 };
            setPresence(pres);
            onPresenceUpdate?.(pres);
          } else if (payload.type === 'pulse') {
            onPulse?.(payload.data);
          } else if (payload.type === 'reservation') {
            onReservationChange?.(payload.data);
          }
        } catch (e) {
          // ignore non-JSON messages
        }
      });
    } catch (err) {
      console.warn('PartyKit connection fallback:', err);
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [onPulse, onReservationChange, onPresenceUpdate]);

  const broadcastReservation = useCallback((blockIds: string[], sessionId: string, status: 'reserved' | 'released') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'reservation',
          data: {
            block_ids: blockIds,
            session_id: sessionId,
            status,
            expires_at: new Date(Date.now() + 120000).toISOString(),
          },
        })
      );
    }
  }, []);

  const broadcastPurchasePulse = useCallback((blockIds: string[], ownerName: string, countryCode: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'pulse',
          data: {
            type: 'purchase',
            block_ids: blockIds,
            owner_name: ownerName,
            country_code: countryCode,
            timestamp: Date.now(),
          },
        })
      );
    }
  }, []);

  return {
    isConnected,
    presence,
    broadcastReservation,
    broadcastPurchasePulse,
  };
}
