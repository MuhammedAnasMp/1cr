'use client';

import { create } from 'zustand';
import {
  Block,
  Country,
  PricingTier,
  User,
  Order,
  ViewportTransform,
  SelectionArea,
  CanvasPulseEvent,
  RealtimePresence,
} from '@/types';
import { calculateBlockPrice, PriceCalculationResult, SUPPORTED_CURRENCIES } from '@/lib/pricing';

export interface BlockStore {
  // View Renderer Switcher (Map ⇄ Grid)
  viewMode: 'map' | 'grid';
  setViewMode: (mode: 'map' | 'grid') => void;

  // Country Sharding / Zoom Context
  selectedCountry: string; // 'GLOBAL' or country code
  setSelectedCountry: (code: string) => void;
  countries: Record<string, Country>;
  fetchCountries: () => Promise<void>;

  // Canvas Viewport & Navigation
  viewport: ViewportTransform;
  setViewport: (transform: Partial<ViewportTransform> | ((prev: ViewportTransform) => ViewportTransform)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  jumpToCoords: (x: number, y: number) => void;

  // Block State & Data Map
  blocks: Record<string, Block>; // Key: "x,y"
  fetchBlocks: (params?: { minX?: number; maxX?: number; minY?: number; maxY?: number; country?: string }) => Promise<void>;
  patchBlock: (data: Partial<Block> & { grid_x: number; grid_y: number }) => void;
  getBlock: (x: number, y: number) => Block | undefined;

  // Selection & Pricing Engine
  selectedBlockIds: Set<string>; // Set of "x,y"
  isSelectionMode: boolean;
  setSelectionMode: (enabled: boolean) => void;
  toggleBlockSelection: (x: number, y: number, isMulti?: boolean) => void;
  setBoxSelection: (area: SelectionArea, isMulti?: boolean) => void;
  clearSelection: () => void;
  selectAllInCountry: (countryCode: string) => void;

  // Dynamic Pricing State (Stored in Postgres)
  baseBlockPriceINR: number;
  pricingTiers: PricingTier[];
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  fetchPricingConfig: () => Promise<void>;
  getPriceCalculation: () => PriceCalculationResult;

  // Checkout & Modals
  isCheckoutOpen: boolean;
  openCheckoutModal: () => void;
  closeCheckoutModal: () => void;
  activeBlockDetail: Block | null;
  setActiveBlockDetail: (block: Block | null) => void;

  // User & Auth Session
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  userOrders: Order[];

  // Realtime PartyKit Metrics & Pulses
  presence: RealtimePresence;
  setPresence: (presence: RealtimePresence) => void;
  recentPulses: CanvasPulseEvent[];
  addPulse: (pulse: CanvasPulseEvent) => void;

  // Session ID for reservation locks
  sessionId: string;
  initializeClientStore: () => void;
}

export const useBlockStore = create<BlockStore>((set, get) => ({
  // Default View Mode: Load from localStorage if present
  viewMode: 'grid',
  setViewMode: (mode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vist_bio_view_mode', mode);
      } catch (e) {}
    }
    set({ viewMode: mode });
  },

  // Country Context
  selectedCountry: 'GLOBAL',
  setSelectedCountry: (code) => set({ selectedCountry: code }),
  countries: {},
  fetchCountries: async () => {
    try {
      const res = await fetch('/api/countries');
      if (res.ok) {
        const data = await res.json();
        set({ countries: data.countries || {} });
      }
    } catch (e) {
      console.warn('Error fetching countries:', e);
    }
  },

  // Viewport
  viewport: { x: 0, y: 0, scale: 1 },
  setViewport: (transform) =>
    set((state) => ({
      viewport: typeof transform === 'function' ? transform(state.viewport) : { ...state.viewport, ...transform },
    })),
  zoomIn: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.min(state.viewport.scale * 1.3, 10) },
    })),
  zoomOut: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.max(state.viewport.scale / 1.3, 0.2) },
    })),
  resetView: () => set({ viewport: { x: 0, y: 0, scale: 1 } }),
  jumpToCoords: (x, y) =>
    set(() => ({
      viewport: { x: -x * 24 + 400, y: -y * 24 + 300, scale: 2 },
    })),

  // Blocks
  blocks: {},
  fetchBlocks: async (params) => {
    try {
      const query = new URLSearchParams();
      if (params?.minX !== undefined) query.set('minX', String(params.minX));
      if (params?.maxX !== undefined) query.set('maxX', String(params.maxX));
      if (params?.minY !== undefined) query.set('minY', String(params.minY));
      if (params?.maxY !== undefined) query.set('maxY', String(params.maxY));
      if (params?.country) query.set('country', params.country);

      const res = await fetch(`/api/blocks?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          blocks: { ...state.blocks, ...(data.blocks || {}) },
        }));
      }
    } catch (e) {
      console.warn('Error fetching blocks:', e);
    }
  },
  patchBlock: (data) => {
    const key = `${data.grid_x},${data.grid_y}`;
    set((state) => {
      const existing = state.blocks[key];
      if (data.status === 'available' && existing && existing.status === 'reserved') {
        const next = { ...state.blocks };
        delete next[key];
        return { blocks: next };
      }
      return {
        blocks: {
          ...state.blocks,
          [key]: {
            ...existing,
            ...data,
            id: data.id || existing?.id || `block_${key}`,
            grid_x: data.grid_x,
            grid_y: data.grid_y,
            country_code: data.country_code || existing?.country_code || 'GLOBAL',
            price: data.price || existing?.price || state.baseBlockPriceINR,
            status: data.status || existing?.status || 'available',
          },
        },
      };
    });
  },
  getBlock: (x, y) => get().blocks[`${x},${y}`],

  // Selection
  selectedBlockIds: new Set(),
  isSelectionMode: true,
  setSelectionMode: (enabled) => set({ isSelectionMode: enabled }),
  toggleBlockSelection: (x, y, isMulti = false) => {
    const key = `${x},${y}`;
    set((state) => {
      const block = state.blocks[key];
      if (block && block.status === 'sold') return state; // Cannot select sold blocks

      const next = new Set(isMulti ? state.selectedBlockIds : []);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { selectedBlockIds: next };
    });
  },
  setBoxSelection: (area, isMulti = false) => {
    set((state) => {
      const minX = Math.min(area.startX, area.endX);
      const maxX = Math.max(area.startX, area.endX);
      const minY = Math.min(area.startY, area.endY);
      const maxY = Math.max(area.startY, area.endY);

      const next = new Set(isMulti ? state.selectedBlockIds : []);
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          const b = state.blocks[key];
          if (!b || b.status !== 'sold') {
            next.add(key);
          }
        }
      }
      return { selectedBlockIds: next };
    });
  },
  clearSelection: () => set({ selectedBlockIds: new Set() }),
  selectAllInCountry: (countryCode) => {
    const country = get().countries[countryCode];
    if (!country) return;
    const { minX, maxX, minY, maxY } = country.bounding_box;
    get().setBoxSelection({ startX: minX, startY: minY, endX: maxX, endY: maxY }, false);
  },

  // Pricing
  baseBlockPriceINR: 25,
  pricingTiers: [
    { id: 'tier_1', min_blocks: 1, max_blocks: 4, discount_percent: 0, price_per_block: 25, is_active: true },
    { id: 'tier_2', min_blocks: 5, max_blocks: 9, discount_percent: 5, price_per_block: 23, is_active: true },
    { id: 'tier_3', min_blocks: 10, max_blocks: 24, discount_percent: 10, price_per_block: 22, is_active: true },
    { id: 'tier_4', min_blocks: 25, max_blocks: 49, discount_percent: 15, price_per_block: 21, is_active: true },
    { id: 'tier_5', min_blocks: 50, max_blocks: 99, discount_percent: 20, price_per_block: 20, is_active: true },
    { id: 'tier_6', min_blocks: 100, max_blocks: null, discount_percent: 30, price_per_block: 17, is_active: true },
  ],
  selectedCurrency: 'INR',
  setSelectedCurrency: (code) => set({ selectedCurrency: code }),
  fetchPricingConfig: async () => {
    try {
      const res = await fetch('/api/admin/pricing');
      if (res.ok) {
        const data = await res.json();
        set({
          baseBlockPriceINR: data.basePriceINR || 25,
          pricingTiers: data.tiers || get().pricingTiers,
        });
      }
    } catch (e) {
      console.warn('Error fetching pricing config:', e);
    }
  },
  getPriceCalculation: () => {
    const state = get();
    return calculateBlockPrice(
      state.selectedBlockIds.size,
      state.selectedCurrency,
      state.baseBlockPriceINR,
      state.pricingTiers
    );
  },

  // Checkout
  isCheckoutOpen: false,
  openCheckoutModal: () => {
    const state = get();
    if (state.selectedBlockIds.size === 0) return;

    // Optimistically mark as reserved
    const optimistic = { ...state.blocks };
    state.selectedBlockIds.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      optimistic[key] = {
        id: `block_${key}`,
        grid_x: x,
        grid_y: y,
        country_code: state.selectedCountry,
        price: state.baseBlockPriceINR,
        status: 'reserved',
      };
    });

    set({ isCheckoutOpen: true, blocks: optimistic });

    // Broadcast lock to PartyKit and backend
    fetch('/api/blocks/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        block_keys: Array.from(state.selectedBlockIds),
        session_id: state.sessionId,
      }),
    }).catch(() => {});
  },
  closeCheckoutModal: () => {
    const state = get();
    const coords = Array.from(state.selectedBlockIds);

    const reverted = { ...state.blocks };
    coords.forEach((key) => {
      if (reverted[key] && reverted[key].status === 'reserved') {
        delete reverted[key];
      }
    });

    set({ isCheckoutOpen: false, blocks: reverted });

    fetch('/api/blocks/reserve', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: state.sessionId }),
    }).catch(() => {});
  },

  activeBlockDetail: null,
  setActiveBlockDetail: (block) => set({ activeBlockDetail: block }),

  // User
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  userOrders: [],

  // Realtime Presence & Pulses
  presence: { viewer_count: 1, active_sessions: 1 },
  setPresence: (presence) => set({ presence }),
  recentPulses: [],
  addPulse: (pulse) =>
    set((state) => ({
      recentPulses: [pulse, ...state.recentPulses.slice(0, 9)],
    })),

  // Session ID
  sessionId: (() => {
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('vist_session_id');
      if (!id) {
        id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('vist_session_id', id);
      }
      return id;
    }
    return `sess_${Date.now()}`;
  })(),

  initializeClientStore: () => {
    if (typeof window !== 'undefined') {
      try {
        const savedView = localStorage.getItem('vist_bio_view_mode');
        if (savedView === 'map' || savedView === 'grid') {
          set({ viewMode: savedView });
        }
      } catch (e) {}
    }
    get().fetchPricingConfig();
    get().fetchCountries();
    get().fetchBlocks();
  },
}));
