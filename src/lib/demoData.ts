import { Pixel, Profile, User } from '@/types';

export const DEMO_USERS: User[] = [];

export const DEMO_PROFILES: Record<string, Profile> = {};

// Clean production pixel map initialization (reads strictly from PostgreSQL database)
export function generateInitialPixels(): Record<string, Pixel> {
  return {};
}
