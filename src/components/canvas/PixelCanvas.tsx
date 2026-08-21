'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePixelStore } from '@/store/usePixelStore';

const PIXEL_SIZE = 16; // Each grid unit is 16px x 16px
const WORLD_WIDTH = 10000; // 10,000 x 1,000 = 10,000,000 pixels
const WORLD_HEIGHT = 1000;

export const PixelCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    viewport,
    setViewport,
    pixels,
    selectedCoords,
    togglePixelSelection,
    setBoxSelection,
    hoveredPixel,
    setHoveredPixel,
    setCanvasMetrics,
    isSelectionMode,
  } = usePixelStore();

  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection Box State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [selectEnd, setSelectEnd] = useState<{ x: number; y: number } | null>(null);

  // Convert Mouse Screen Coords to Grid Coordinates (X, Y)
  const screenToGrid = useCallback(
    (screenX: number, screenY: number) => {
      const gridX = Math.floor((screenX - viewport.x) / (PIXEL_SIZE * viewport.scale));
      const gridY = Math.floor((screenY - viewport.y) / (PIXEL_SIZE * viewport.scale));
      return {
        x: Math.max(0, Math.min(WORLD_WIDTH - 1, gridX)),
        y: Math.max(0, Math.min(WORLD_HEIGHT - 1, gridY)),
      };
    },
    [viewport]
  );

  // Core High FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const render = () => {
      const now = performance.now();
      frameCount++;

      let renderedCount = 0;

      if (now - lastTime >= 1000) {
        setCanvasMetrics(frameCount, renderedCount);
        frameCount = 0;
        lastTime = now;
      }

      // Handle High DPI displays
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Clear Canvas Surface (#131313)
      ctx.fillStyle = '#131313';
      ctx.fillRect(0, 0, width, height);

      ctx.save();

      // Apply Matrix Transform (Pan & Zoom)
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      // Compute Viewport Bounding Box in Grid Coordinates (Tile Culling for 10M Grid)
      const minGridX = Math.max(0, Math.floor(-viewport.x / (PIXEL_SIZE * viewport.scale)));
      const minGridY = Math.max(0, Math.floor(-viewport.y / (PIXEL_SIZE * viewport.scale)));
      const maxGridX = Math.min(WORLD_WIDTH - 1, Math.ceil((width - viewport.x) / (PIXEL_SIZE * viewport.scale)));
      const maxGridY = Math.min(WORLD_HEIGHT - 1, Math.ceil((height - viewport.y) / (PIXEL_SIZE * viewport.scale)));

      // Draw Base Background Grid Cells (#0e0e0e)
      ctx.fillStyle = '#0e0e0e';
      ctx.fillRect(
        minGridX * PIXEL_SIZE,
        minGridY * PIXEL_SIZE,
        (maxGridX - minGridX + 1) * PIXEL_SIZE,
        (maxGridY - minGridY + 1) * PIXEL_SIZE
      );

      // Draw Grid Lines if zoomed in enough
      if (viewport.scale > 0.4) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1 / viewport.scale;

        ctx.beginPath();
        for (let x = minGridX; x <= maxGridX + 1; x++) {
          ctx.moveTo(x * PIXEL_SIZE, minGridY * PIXEL_SIZE);
          ctx.lineTo(x * PIXEL_SIZE, (maxGridY + 1) * PIXEL_SIZE);
        }
        for (let y = minGridY; y <= maxGridY + 1; y++) {
          ctx.moveTo(minGridX * PIXEL_SIZE, y * PIXEL_SIZE);
          ctx.lineTo((maxGridX + 1) * PIXEL_SIZE, y * PIXEL_SIZE);
        }
        ctx.stroke();
      }

      // Render Purchased / Custom Pixels with Custom highlights
      for (let x = minGridX; x <= maxGridX; x++) {
        for (let y = minGridY; y <= maxGridY; y++) {
          const key = `${x},${y}`;
          const pixel = pixels[key];
          renderedCount++;

          if (pixel && pixel.status === 'sold') {
            ctx.fillStyle = pixel.color || '#8FE3FF';
            ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1 / viewport.scale;
            ctx.strokeRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }

      // Render Selected Pixels (#B6B2FF active-lavender Highlight)
      selectedCoords.forEach((key) => {
        const [x, y] = key.split(',').map(Number);
        if (x >= minGridX && x <= maxGridX && y >= minGridY && y <= maxGridY) {
          ctx.fillStyle = '#B6B2FF';
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5 / viewport.scale;
          ctx.strokeRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      });

      // Render Hovered Pixel Outline Cursor Box
      if (hoveredPixel && hoveredPixel.pixel) {
        const hX = hoveredPixel.pixel.x;
        const hY = hoveredPixel.pixel.y;
        if (hX >= minGridX && hX <= maxGridX && hY >= minGridY && hY <= maxGridY) {
          ctx.strokeStyle = '#8FE3FF';
          ctx.lineWidth = 2 / viewport.scale;
          ctx.strokeRect(hX * PIXEL_SIZE, hY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
      }

      // Render Drag Selection Box overlay
      if (isSelecting && selectStart && selectEnd) {
        const minX = Math.min(selectStart.x, selectEnd.x);
        const maxX = Math.max(selectStart.x, selectEnd.x);
        const minY = Math.min(selectStart.y, selectEnd.y);
        const maxY = Math.max(selectStart.y, selectEnd.y);

        ctx.fillStyle = 'rgba(143, 227, 255, 0.25)';
        ctx.fillRect(
          minX * PIXEL_SIZE,
          minY * PIXEL_SIZE,
          (maxX - minX + 1) * PIXEL_SIZE,
          (maxY - minY + 1) * PIXEL_SIZE
        );

        ctx.strokeStyle = '#8FE3FF';
        ctx.lineWidth = 2 / viewport.scale;
        ctx.setLineDash([4 / viewport.scale, 4 / viewport.scale]);
        ctx.strokeRect(
          minX * PIXEL_SIZE,
          minY * PIXEL_SIZE,
          (maxX - minX + 1) * PIXEL_SIZE,
          (maxY - minY + 1) * PIXEL_SIZE
        );
        ctx.setLineDash([]);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewport, pixels, selectedCoords, hoveredPixel, isSelecting, selectStart, selectEnd, setCanvasMetrics]);

  // Event Handlers for Panning & Drag Selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isSelectionMode || e.shiftKey || e.ctrlKey || e.metaKey || e.button === 2) {
      setIsSelecting(true);
      const gridPos = screenToGrid(clientX, clientY);
      setSelectStart(gridPos);
      setSelectEnd(gridPos);
    } else {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const gridPos = screenToGrid(clientX, clientY);
    const key = `${gridPos.x},${gridPos.y}`;
    const pixel = pixels[key] || {
      id: gridPos.x * 1000 + gridPos.y,
      x: gridPos.x,
      y: gridPos.y,
      price: 10,
      status: 'available',
    };

    setHoveredPixel({ pixel, mouseX: e.clientX, mouseY: e.clientY });

    if (isPanning) {
      setViewport({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isSelecting && selectStart) {
      setSelectEnd(gridPos);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSelecting && selectStart && selectEnd) {
      const isDrag = selectStart.x !== selectEnd.x || selectStart.y !== selectEnd.y;
      if (isDrag) {
        setBoxSelection({
          startX: selectStart.x,
          startY: selectStart.y,
          endX: selectEnd.x,
          endY: selectEnd.y,
        });
      } else {
        togglePixelSelection(selectStart.x, selectStart.y, e.ctrlKey || e.metaKey || e.shiftKey || isSelectionMode);
      }
      setIsSelecting(false);
      setSelectStart(null);
      setSelectEnd(null);
    } else if (!isPanning && selectStart === null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const gridPos = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);
        togglePixelSelection(gridPos.x, gridPos.y, e.ctrlKey || e.metaKey || e.shiftKey || isSelectionMode);
      }
    }
    setIsPanning(false);
  };
  // Zoom on wheel event (registered as non-passive to allow e.preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

      setViewport((prev) => {
        const newScale = Math.max(0.2, Math.min(8.0, prev.scale * zoomFactor));
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [setViewport]);

  return (
    <div className="relative w-full h-[calc(100vh-53px)] overflow-hidden bg-background select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsSelecting(false);
          setHoveredPixel(null);
        }}
        className={`w-full h-full block ${isPanning ? 'canvas-cursor-grabbing' : 'canvas-cursor-grab'}`}
      />

      {/* Hovered Pixel Details Tooltip Card */}
      {hoveredPixel && hoveredPixel.pixel && (
        <div
          style={{
            left: Math.min(window.innerWidth - 240, hoveredPixel.mouseX + 16),
            top: Math.min(window.innerHeight - 150, hoveredPixel.mouseY + 16),
          }}
          className="fixed z-30 bg-surface-container border border-outline-variant rounded-card p-3.5 shadow-2xl pointer-events-none text-xs w-56 transition-opacity duration-150 text-white"
        >
          <div className="flex items-center justify-between border-b border-outline-variant pb-2 mb-2">
            <div>
              <span className="font-bold text-white block text-xs">
                Pixel ({hoveredPixel.pixel.x}, {hoveredPixel.pixel.y})
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant font-medium">ID: #{hoveredPixel.pixel.id}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                hoveredPixel.pixel.status === 'sold'
                  ? 'bg-active-cyan/15 text-active-cyan'
                  : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              {hoveredPixel.pixel.status}
            </span>
          </div>

          {hoveredPixel.pixel.status === 'sold' ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <img
                  src={hoveredPixel.pixel.owner_avatar || 'https://i.pravatar.cc/200?img=12'}
                  alt="Owner"
                  className="w-6 h-6 rounded-full object-cover border border-active-cyan"
                />
                <div>
                  <span className="text-white font-bold block leading-none">{hoveredPixel.pixel.owner_name}</span>
                  <span className="text-[10px] text-active-cyan">Click to view profile</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Status:</span>
                <span className="text-on-secondary-container font-semibold">Available</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Rate:</span>
                <span className="text-active-cyan font-extrabold text-sm">₹10</span>
              </div>
              <p className="text-[9px] text-active-cyan pt-1 border-t border-outline-variant">Click to select & buy land</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
