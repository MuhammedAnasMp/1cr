'use client';

import React, { useRef, useEffect } from 'react';
import { usePixelStore } from '@/store/usePixelStore';

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 2500;
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 112.5;

export const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { viewport, pixels, jumpToCoords } = usePixelStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw MiniMap Base Surface
    ctx.fillStyle = '#20201f';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw Border
    ctx.strokeStyle = '#444748';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Render Sold Clusters as Mini Dots
    const scaleFactorX = MINIMAP_WIDTH / WORLD_WIDTH;
    const scaleFactorY = MINIMAP_HEIGHT / WORLD_HEIGHT;

    Object.values(pixels).forEach((pixel) => {
      if (pixel.status === 'sold') {
        ctx.fillStyle = pixel.color || '#8FE3FF';
        const miniX = pixel.x * scaleFactorX;
        const miniY = pixel.y * scaleFactorY;
        ctx.fillRect(miniX, miniY, 2, 2);
      }
    });

    // Compute Viewport Bounding Box on MiniMap
    const pixelSize = 16;
    const viewWidth = (window.innerWidth / (pixelSize * viewport.scale)) * scaleFactorX;
    const viewHeight = (window.innerHeight / (pixelSize * viewport.scale)) * scaleFactorY;
    const viewX = (-viewport.x / (pixelSize * viewport.scale)) * scaleFactorX;
    const viewY = (-viewport.y / (pixelSize * viewport.scale)) * scaleFactorY;

    ctx.strokeStyle = '#B6B2FF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(viewX, viewY, viewWidth, viewHeight);

    ctx.fillStyle = 'rgba(182, 178, 255, 0.15)';
    ctx.fillRect(viewX, viewY, viewWidth, viewHeight);
  }, [viewport, pixels]);

  // Click on MiniMap radar to jump viewport directly!
  const handleMiniMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const gridX = Math.floor((clickX / MINIMAP_WIDTH) * WORLD_WIDTH);
    const gridY = Math.floor((clickY / MINIMAP_HEIGHT) * WORLD_HEIGHT);

    jumpToCoords(gridX, gridY);
  };

  return (
    <div className="absolute bottom-12 right-4 z-20 bg-surface-container border border-outline-variant rounded-card p-1.5 shadow-2xl">
      <div className="flex items-center justify-between px-1 pb-1 mb-1 border-b border-outline-variant">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Canvas Radar</span>
        <span className="text-[9px] text-active-cyan">10M Grid</span>
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onClick={handleMiniMapClick}
        className="cursor-crosshair rounded border border-outline-variant block"
      />
    </div>
  );
};
