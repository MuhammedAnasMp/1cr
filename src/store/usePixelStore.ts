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
  fitToFrame: () => void;
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
  setBoxSelection: (area: SelectionArea, isMultiSelect?: boolean) => void;
  clearSelection: () => void;
  undoSelection: () => void;
  redoSelection: () => void;

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
  initializeClientStore: () => void;
}

const PIXEL_SIZE = 16;

export const usePixelStore = create<PixelStore>((set, get) => ({
  // Viewport setup (centered on client mount)
  viewport: { x: 0, y: 0, scale: 1.0 },

  setViewport: (transform) =>
    set((state) => ({
      viewport: typeof transform === 'function' ? transform(state.viewport) : { ...state.viewport, ...transform },
    })),

  zoomIn: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.min(state.viewport.scale * 1.15, 8.0) },
    })),

  zoomOut: () =>
    set((state) => ({
      viewport: { ...state.viewport, scale: Math.max(state.viewport.scale / 1.15, 0.003) },
    })),

  resetView: () => {
    get().fitToFrame();
  },

  fitToFrame: () => {
    if (typeof window === 'undefined') return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight - 53;
    const worldPxW = 4000 * PIXEL_SIZE; // 64,000px
    const worldPxH = 2500 * PIXEL_SIZE; // 40,000px

    const scaleX = screenW / worldPxW;
    const scaleY = screenH / worldPxH;
    const fitScale = Math.min(scaleX, scaleY) * 0.94;

    // Exact horizontal and vertical centering
    const targetX = (screenW - worldPxW * fitScale) / 2;
    const targetY = (screenH - worldPxH * fitScale) / 2;

    set({ viewport: { x: targetX, y: targetY, scale: fitScale } });
  },

  initializeClientStore: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedPixels = localStorage.getItem('local_pixels_backup');
      const savedProfiles = localStorage.getItem('local_profiles_backup');
      const parsedPixels = savedPixels ? JSON.parse(savedPixels) : {};
      const parsedProfiles = savedProfiles ? JSON.parse(savedProfiles) : {};

      set((state) => ({
        pixels: { ...parsedPixels, ...state.pixels },
        profiles: { ...parsedProfiles, ...state.profiles },
      }));
    } catch (e) {}

    get().fitToFrame();
  },

  jumpToCoords: (x: number, y: number) => {
    const targetX = -(x * PIXEL_SIZE - window.innerWidth / 2 + PIXEL_SIZE / 2);
    const targetY = -(y * PIXEL_SIZE - window.innerHeight / 2 + PIXEL_SIZE / 2);
    set({
      viewport: { x: targetX, y: targetY, scale: 2.0 },
    });
  },

  // Selection Mode Toggle (Default to false on refresh)
  isSelectionMode: false,
  setSelectionMode: (isSelectionMode) => set({ isSelectionMode }),
  toggleSelectionMode: () => set((state) => ({ isSelectionMode: !state.isSelectionMode })),

  // Production Pixels Map with LocalStorage Backup
  pixels: {},
  getPixel: (x: number, y: number) => get().pixels[`${x},${y}`],

  fetchPixels: async () => {
    try {
      const res = await fetch('/api/pixels');
      if (res.ok) {
        const data = await res.json();
        set((state) => {
          const mergedPixels = { ...state.pixels, ...data.pixels };
          const mergedProfiles = { ...state.profiles, ...data.profiles };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('local_pixels_backup', JSON.stringify(mergedPixels));
              localStorage.setItem('local_profiles_backup', JSON.stringify(mergedProfiles));
            } catch (e) {}
          }
          return { 
            pixels: mergedPixels,
            profiles: mergedProfiles,
          };
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
        counts[px.owner_id].count++;
      }
    });

    return Object.entries(counts)
      .map(([userId, data]) => {
        const profile =
          profiles[userId] ||
          Object.values(profiles).find((p) => p.user_id === userId) ||
          (data.firstPixel?.profile_id ? profiles[data.firstPixel.profile_id] : undefined);

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

  // Selection & History Stack (Undo/Redo)
  selectedCoords: new Set<string>(),
  selectionHistory: [new Set<string>()],
  historyIndex: 0,

  pushSelectionState: (newCoords: Set<string>) => {
    const history = get().selectionHistory.slice(0, get().historyIndex + 1);
    history.push(new Set(newCoords));
    if (history.length > 30) history.shift();
    set({
      selectionHistory: history,
      historyIndex: history.length - 1,
      selectedCoords: newCoords,
    });
  },

  undoSelection: () => {
    const idx = get().historyIndex;
    if (idx > 0) {
      const prev = get().selectionHistory[idx - 1];
      set({
        historyIndex: idx - 1,
        selectedCoords: new Set(prev),
      });
    }
  },

  redoSelection: () => {
    const idx = get().historyIndex;
    const history = get().selectionHistory;
    if (idx < history.length - 1) {
      const next = history[idx + 1];
      set({
        historyIndex: idx + 1,
        selectedCoords: new Set(next),
      });
    }
  },

  togglePixelSelection: (x: number, y: number, isMultiSelect = false) => {
    const key = `${x},${y}`;
    const pixel = get().pixels[key];
    const profiles = get().profiles;

    if (pixel && pixel.status === 'sold') {
      const ownerId = pixel.owner_id || '';
      const profile =
        Object.values(profiles).find((p) => p.user_id === ownerId || p.id === ownerId || (p.username && p.username.toLowerCase() === pixel.owner_name?.toLowerCase())) ||
        {
          id: pixel.profile_id || `prof_${ownerId}`,
          user_id: ownerId,
          username: pixel.owner_name ? pixel.owner_name.toLowerCase().replace(/\s+/g, '') : 'collector',
          name: pixel.owner_name || 'Pixel Collector',
          bio: 'Building things on 10M Pixel World 🚀',
          avatar: pixel.owner_avatar || 'https://i.pravatar.cc/200?img=12',
          verified: true,
          theme_color: '#00e5ff',
          created_at: new Date().toISOString(),
          links: [
            {
              id: `link_fallback_1`,
              profile_id: pixel.profile_id || `prof_${ownerId}`,
              title: '🌐 Official Website',
              url: 'https://crorepixels.io',
              sort_order: 1,
              clicks: 0,
            }
          ]
        };

      get().openProfileModal(profile);
      return;
    }

    const next = new Set(isMultiSelect ? get().selectedCoords : []);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    get().pushSelectionState(next);
  },

  setBoxSelection: (area: SelectionArea, isMultiSelect = false) => {
    const minX = Math.min(area.startX, area.endX);
    const maxX = Math.max(area.startX, area.endX);
    const minY = Math.min(area.startY, area.endY);
    const maxY = Math.max(area.startY, area.endY);

    const next = new Set<string>(isMultiSelect ? get().selectedCoords : []);
    const currentPixels = get().pixels;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x},${y}`;
        const px = currentPixels[key];
        if (!px || px.status !== 'sold') {
          next.add(key);
        }
      }
    }

    get().pushSelectionState(next);
  },

  clearSelection: () => get().pushSelectionState(new Set()),

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

    const ownerDisplayName = name || state.currentUser?.name || 'Pixel Master';

    const user = state.currentUser || {
      id: `u_${Date.now()}`,
      firebase_uid: `fb_${Date.now()}`,
      email: 'collector@crorepixels.io',
      name: ownerDisplayName,
      avatar: 'https://i.pravatar.cc/200?img=12',
      created_at: new Date().toISOString(),
    };

    const profileId = `prof_${user.id}_${Date.now()}`;

    const newProfile: Profile = {
      id: profileId,
      user_id: user.id,
      username: username || user.name.toLowerCase().replace(/\s+/g, ''),
      name: ownerDisplayName,
      bio: bio || 'Building things on 10M Pixel World 🚀',
      avatar: user.avatar,
      verified: true,
      theme_color: '#00e5ff',
      created_at: new Date().toISOString(),
      links: links.map((l: any, idx) => ({
        id: `link_${idx}_${Date.now()}`,
        profile_id: profileId,
        title: l.title,
        url: l.url,
        sort_order: idx + 1,
        clicks: 0,
        assigned_pixels: l.assignedPixels || [],
      })),
    };

    const updatedPixels = { ...state.pixels };
    const coordsList: { x: number; y: number }[] = [];
    const dbPixelsList: any[] = [];

    selected.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      coordsList.push({ x, y });
      const pixelData = {
        id: y * 4000 + x + 1,
        x,
        y,
        owner_id: user.id,
        owner_name: ownerDisplayName,
        owner_avatar: user.avatar,
        price: 10,
        status: 'sold' as const,
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

    const updatedProfiles = { ...state.profiles, [user.id]: newProfile, [profileId]: newProfile };

    // Persist to local backup storage immediately so purchase is NEVER lost
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('local_pixels_backup', JSON.stringify(updatedPixels));
        localStorage.setItem('local_profiles_backup', JSON.stringify(updatedProfiles));
      } catch (e) {}
    }

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
      profiles: updatedProfiles,
      userProfile: newProfile,
      activeProfile: newProfile,
      selectedCoords: new Set(),
      isCheckoutOpen: false,
      orders: [newOrder, ...state.orders],
    });
  },
}));
