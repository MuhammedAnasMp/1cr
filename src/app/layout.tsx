import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PixelVerse — 1 Crore Pixel Marketplace & Linktree Canvas',
  description: 'Buy individual pixels for ₹10/pixel. Transform your pixel land into personal Linktree micro-pages and explore a massive 10 Million pixel interactive canvas.',
  keywords: ['Pixel Marketplace', 'Million Dollar Homepage', 'Linktree Canvas', 'r/place India', '₹10 per pixel'],
  openGraph: {
    title: 'PixelVerse — Own Your Place On The Internet',
    description: 'Buy pixels. Build your identity. Share your links.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background antialiased selection:bg-active-lavender/40 selection:text-white">
        {children}
      </body>
    </html>
  );
}
