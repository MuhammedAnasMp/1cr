export type PixelStatus = 'available' | 'reserved' | 'sold';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  name: string;
  avatar: string;
  created_at: string;
}

export interface LinkItem {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon?: string;
  sort_order: number;
  clicks?: number;
  assigned_pixels?: string[];
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  name?: string;
  bio: string;
  avatar: string;
  verified?: boolean;
  theme_color?: string;
  links: LinkItem[];
  created_at: string;
}

export interface Pixel {
  id: number;
  x: number;
  y: number;
  owner_id?: string;
  owner_name?: string;
  owner_avatar?: string;
  price: number; // default 10 (INR)
  status: PixelStatus;
  color?: string;
  image?: string;
  profile_id?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  amount: number;
  razorpay_order_id: string;
  status: 'created' | 'paid' | 'failed';
  pixels_count: number;
  pixel_coords: { x: number; y: number }[];
  created_at: string;
}

export interface AnalyticsItem {
  id: string;
  profile_id: string;
  visitor_ip: string;
  country: string;
  device: string;
  views: number;
  clicks: number;
  ctr: number;
  created_at: string;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface SelectionArea {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Block {
  id: string;
  grid_x: number;
  grid_y: number;
  country_code: string;
  owner_id?: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_username?: string;
  price: number;
  status: PixelStatus;
  image_url?: string;
  config?: {
    bio?: string;
    theme_color?: string;
    headline?: string;
  };
  links?: any[];
  images?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  bounding_box: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  total_blocks: number;
  sold_blocks: number;
}

export interface PricingTier {
  id: string;
  min_blocks: number;
  max_blocks: number | null;
  discount_percent: number;
  price_per_block: number;
  is_active: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateFromINR: number;
}

export interface CanvasPulseEvent {
  type: string;
  block_ids: string[];
  owner_name: string;
  country_code: string;
  timestamp: number;
}

export interface RealtimePresence {
  viewer_count: number;
  active_sessions: number;
}
