import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PixelVerse — 1 Crore Pixel Marketplace',
    short_name: 'PixelVerse',
    description: '10 Million Pixel Interactive Canvas & Linktree Builder',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0d11',
    theme_color: '#00e5ff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
