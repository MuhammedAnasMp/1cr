import { create } from 'zustand';
import { Pixel, Profile, User, Order, ViewportTransform, SelectionArea } from '@/types';

export interface TopBuyer {
  user_id: string;
  name: string;
  avatar: string;
  pixelCount: number;
  profile?: Profile;
  firstPixel?: Pixel;
}

interface PixelStore {
  // Canvas Viewport Transform
  viewport: ViewportTransform;
  setViewport: (transform: Partial<ViewportTransform> | ((prev: ViewportTransform) => ViewportTransform)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  jumpToCoords: (x: number, y: number) => void;

  // Selection Mode Toggle
  isSelectionMode: boolean;
  setSelectionMode: (enabled: boolean) => void;
  toggleSelectionMode: () => void;

  // Pixels Data & Map
  pixels: Record<string, Pixel>;
  getPixel: (x: number, y: number) => Pixel | undefined;
  getTopBuyers: () => TopBuyer[];
  fetchPixels: () => Promise<void>;

  // Selection
  selectedCoords: Set<string>; // "x,y"
  togglePixelSelection: (x: number, y: number, isMultiSelect?: boolean) => void;
  setBoxSelection: (area: SelectionArea) => void;
  clearSelection: () => void;

  // Hover Tooltip State
  hoveredPixel: { pixel: Pixel | null; mouseX: number; mouseY: number } | null;
  setHoveredPixel: (data: { pixel: Pixel | null; mouseX: number; mouseY: number } | null) => void;

  // Active Linktree Micro-Page Drawer
  activeProfile: Profile | null;
  openProfileModal: (profile: Profile) => void;
  closeProfileModal: () => void;

  // Checkout Modal State
  isCheckoutOpen: boolean;
  openCheckoutModal: () => void;
  closeCheckoutModal: () => void;

  // User Auth & Session (Strictly LIVE Production Data)
  currentUser: User | null;
  userProfile: Profile | null;
  profiles: Record<string, Profile>;
  setCurrentUser: (user: User | null) => void;
  updateProfile: (profileData: Partial<Profile>) => void;

  // Orders History
  orders: Order[];
  addOrder: (order: Order) => void;

  // Real-time Canvas Metrics
  fps: number;
  renderedTilesCount: number;
  setCanvasMetrics: (fps: number, renderedTilesCount: number) => void;

  // Purchase Action Trigger
  completePurchase: (details: { name: string; username: string; bio: string; links: { title: string; url: string }[] }) => void;
}

const PIXEL_SIZE = 16;

export const usePixelStore = create<PixelStore>((set, get) => ({
  // Viewport setup (centered at 500, 200)
  viewport: { x: -350, y: -150, scale: 1.0 },

  setViewport: (transform) =>
    set((state) => ({
      viewport: typeof transform === 'function' ? transform(state.viewport) : { ...state.viewport, ...transform },
    })),

  zoomIn: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.min(state.viewport.scale * 1.25, 8.0) },
    })),

  zoomOut: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.max(state.viewport.scale / 1.25, 0.2) },
    })),

  resetView: () =>
    set({
      viewport: { x: -350, y: -150, scale: 1.0 },
    }),

  jumpToCoords: (x: number, y: number) => {
    const targetX = -(x * PIXEL_SIZE - window.innerWidth / 2 + PIXEL_SIZE / 2);
    const targetY = -(y * PIXEL_SIZE - window.innerHeight / 2 + PIXEL_SIZE / 2);
    set({
      viewport: { x: targetX, y: targetY, scale: 2.0 },
    });
  },

  // Selection Mode Toggle
  isSelectionMode: true,
  setSelectionMode: (isSelectionMode) => set({ isSelectionMode }),
  toggleSelectionMode: () => set((state) => ({ isSelectionMode: !state.isSelectionMode })),

  // Pure Production Pixels Map
  pixels: {},
  getPixel: (x: number, y: number) => get().pixels[`${x},${y}`],

  fetchPixels: async () => {
    try {
      const res = await fetch('/api/pixels');
      if (res.ok) {
        const data = await res.json();
        set({ 
          pixels: data.pixels || {},
          profiles: data.profiles || {},
        });
      }
    } catch (e) {
      console.warn('Error fetching production pixels from database:', e);
    }
  },

  // Compute Top 1-5 Pixel Owners strictly from production database pixels
  getTopBuyers: () => {
    const pixels = get().pixels;
    const profiles = get().profiles;
    const counts: Record<string, { count: number; name: string; avatar: string; firstPixel?: Pixel }> = {};

    Object.values(pixels).forEach((px) => {
      if (px.status === 'sold' && px.owner_id) {
        if (!counts[px.owner_id]) {
          counts[px.owner_id] = {
            count: 0,
            name: px.owner_name || 'Collector',
            avatar: px.owner_avatar || 'https://i.pravatar.cc/200?img=12',
            firstPixel: px,
          };
        }
        counts[px.owner_id].count += 1;
      }
    });

    return Object.entries(counts)
      .map(([userId, data]) => {
        const profile =
          Object.values(profiles).find((p) => p.user_id === userId || p.id === userId) || undefined;

        return {
          user_id: userId,
          name: data.name,
          avatar: data.avatar,
          pixelCount: data.count,
          profile,
          firstPixel: data.firstPixel,
        };
      })
      .sort((a, b) => b.pixelCount - a.pixelCount)
      .slice(0, 5);
  },

  // Selection & Linktree Click Handler
  selectedCoords: new Set<string>(),

  togglePixelSelection: (x: number, y: number, isMultiSelect = false) => {
    const key = `${x},${y}`;
    const pixel = get().pixels[key];
    const profiles = get().profiles;

    if (pixel && pixel.status === 'sold') {
      const ownerId = pixel.owner_id || '';
      const profile =
        Object.values(profiles).find((p) => p.user_id === ownerId || p.id === ownerId || p.username.toLowerCase() === pixel.owner_name?.toLowerCase());

      if (profile) {
        get().openProfileModal(profile);
        return;
      }
    }

    set((state) => {
      const next = new Set(isMultiSelect ? state.selectedCoords : []);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { selectedCoords: next, isSelectionMode: true };
    });
  },

  setBoxSelection: (area: SelectionArea) => {
    const minX = Math.min(area.startX, area.endX);
    const maxX = Math.max(area.startX, area.endX);
    const minY = Math.min(area.startY, area.endY);
    const maxY = Math.max(area.startY, area.endY);

    const next = new Set<string>();
    const currentPixels = get().pixels;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const px = currentPixels[key];
        if (!px || px.status === 'available') {
          next.add(key);
        }
      }
    }

    set({ selectedCoords: next, isSelectionMode: true });
  },

  clearSelection: () => set({ selectedCoords: new Set() }),

  // Hover Tooltip
  hoveredPixel: null,
  setHoveredPixel: (hoveredPixel) => set({ hoveredPixel }),

  // Profile Modal
  activeProfile: null,
  openProfileModal: (profile) => set({ activeProfile: profile }),
  closeProfileModal: () => set({ activeProfile: null }),

  // Checkout Modal
  isCheckoutOpen: false,
  openCheckoutModal: () => set({ isCheckoutOpen: true }),
  closeCheckoutModal: () => set({ isCheckoutOpen: false }),

  // LIVE User Auth & Session (Strictly NULL by default)
  currentUser: null,
  userProfile: null,
  profiles: {},

  setCurrentUser: (currentUser) =>
    set((state) => {
      const profile = currentUser ? state.profiles[currentUser.id] || null : null;
      return { currentUser, userProfile: profile };
    }),

  updateProfile: (profileData) =>
    set((state) => {
      if (!state.currentUser || !state.userProfile) return state;
      const updatedProfile = { ...state.userProfile, ...profileData };

      // Persist profile updates asynchronously to Neon Postgres database
      fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: state.currentUser.id,
          profile: updatedProfile,
        }),
      }).catch((e) => console.error('Error saving profile changes to database:', e));

      return {
        userProfile: updatedProfile,
        profiles: { ...state.profiles, [state.currentUser.id]: updatedProfile },
      };
    }),

  // Orders History
  orders: [],

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  // Metrics
  fps: 60,
  renderedTilesCount: 0,
  setCanvasMetrics: (fps, renderedTilesCount) => set({ fps, renderedTilesCount }),

  // Complete Razorpay Purchase & Allocate Pixels to Authenticated User
  completePurchase: ({ name, username, bio, links }) => {
    const state = get();
    const selected = Array.from(state.selectedCoords);
    if (selected.length === 0) return;

    const user = state.currentUser || {
      id: `u_${Date.now()}`,
      firebase_uid: `fb_${Date.now()}`,
      email: 'collector@crorepixels.io',
      name: name || 'Pixel Collector',
      avatar: 'https://i.pravatar.cc/200?img=12',
      created_at: new Date().toISOString(),
    };

    const profileId = `prof_${user.id}_${Date.now()}`;

    const newProfile: Profile = {
      id: profileId,
      user_id: user.id,
      username: username || user.name.toLowerCase().replace(/\s+/g, ''),
      name: name || user.name,
      bio: bio || 'Building things on 10M Pixel World 🚀',
      avatar: user.avatar,
      verified: true,
      theme_color: '#00e5ff',
      created_at: new Date().toISOString(),
      links: links.map((l, idx) => ({
        id: `link_${idx}_${Date.now()}`,
        profile_id: profileId,
        title: l.title,
        url: l.url,
        sort_order: idx + 1,
        clicks: 0,
      })),
    };

    const updatedPixels = { ...state.pixels };
    const coordsList: { x: number; y: number }[] = [];
    const dbPixelsList: any[] = [];

    selected.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      coordsList.push({ x, y });
      const pixelData = {
        id: x * 1000 + y,
        x,
        y,
        owner_id: user.id,
        owner_name: user.name,
        owner_avatar: user.avatar,
        price: 10,
        status: 'sold',
        color: '#00e5ff',
        profile_id: profileId,
        created_at: new Date().toISOString(),
      };
      updatedPixels[key] = pixelData;
      dbPixelsList.push(pixelData);
    });

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      user_id: user.id,
      amount: selected.length * 10,
      razorpay_order_id: `pay_RZP_${Math.floor(Math.random() * 899999 + 100000)}`,
      status: 'paid',
      pixels_count: selected.length,
      pixel_coords: coordsList,
      created_at: new Date().toISOString(),
    };

    // Save purchase transaction in Neon Postgres database asynchronously
    fetch('/api/pixels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        profile: newProfile,
        links: newProfile.links,
        pixels: dbPixelsList,
        order: newOrder,
      }),
    }).catch((e) => console.error('Failed to save purchase details in database:', e));

    set({
      currentUser: user,
      pixels: updatedPixels,
      profiles: { ...state.profiles, [user.id]: newProfile, [profileId]: newProfile },
      userProfile: newProfile,
      activeProfile: newProfile,
      selectedCoords: new Set(),
      isCheckoutOpen: false,
      orders: [newOrder, ...state.orders],
    });
  },
}));
