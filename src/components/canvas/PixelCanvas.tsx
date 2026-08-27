'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePixelStore } from '@/store/usePixelStore';
import { Crosshair } from 'lucide-react';

const PIXEL_SIZE = 16; // Each grid unit is 16px x 16px
const WORLD_WIDTH = 4000; // 4,000 x 2,500 = 10,000,000 pixels (16:9 widescreen ratio)
const WORLD_HEIGHT = 2500;

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
    openCheckoutModal,
    fitToFrame,
    undoSelection,
    redoSelection,
    initializeClientStore,
  } = usePixelStore();

  const [isPanning, setIsPanning] = useState(false);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selection Box State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [selectEnd, setSelectEnd] = useState<{ x: number; y: number } | null>(null);
  const hadModifierKeysRef = useRef(false);


  // Initialize client store & center canvas in viewport on mount
  useEffect(() => {
    initializeClientStore();
  }, [initializeClientStore]);

  // Keyboard Shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redoSelection();
        } else {
          e.preventDefault();
          undoSelection();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoSelection, redoSelection]);

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

      // 1. Clear Canvas Surface (#050508 Deep Obsidian AI Base)
      ctx.fillStyle = '#050508';
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

      // 2. Draw Dark Cyber Tile Base (#09090d)
      ctx.fillStyle = '#09090d';
      ctx.fillRect(
        minGridX * PIXEL_SIZE,
        minGridY * PIXEL_SIZE,
        (maxGridX - minGridX + 1) * PIXEL_SIZE,
        (maxGridY - minGridY + 1) * PIXEL_SIZE
      );

      // 3. AI Glow Neural Pulse Grid Animation
      const pulseAlpha = Math.sin(now * 0.0015) * 0.04 + 0.12; // Smooth sine wave pulsing AI aura
      const pulseGlowColor = `rgba(0, 229, 255, ${pulseAlpha})`;
      const pulsePurpleColor = `rgba(182, 178, 255, ${pulseAlpha * 0.7})`;

      // 4. Draw 10x10 AI Neural Grid Intersections & Glow Nodes
      const minGridNodeX = Math.floor(minGridX / 10) * 10;
      const maxGridNodeX = Math.min(WORLD_WIDTH, (Math.floor(maxGridX / 10) + 1) * 10);
      const minGridNodeY = Math.floor(minGridY / 10) * 10;
      const maxGridNodeY = Math.min(WORLD_HEIGHT, (Math.floor(maxGridY / 10) + 1) * 10);

      // AI Glow Lines between 10x10 Nodes
      ctx.strokeStyle = pulseGlowColor;
      ctx.lineWidth = 1 / viewport.scale;
      ctx.beginPath();
      for (let x = minGridNodeX; x <= maxGridNodeX; x += 10) {
        ctx.moveTo(x * PIXEL_SIZE, minGridNodeY * PIXEL_SIZE);
        ctx.lineTo(x * PIXEL_SIZE, maxGridNodeY * PIXEL_SIZE);
      }
      for (let y = minGridNodeY; y <= maxGridNodeY; y += 10) {
        ctx.moveTo(minGridNodeX * PIXEL_SIZE, y * PIXEL_SIZE);
        ctx.lineTo(maxGridNodeX * PIXEL_SIZE, y * PIXEL_SIZE);
      }
      ctx.stroke();

      // Glowing AI Intersection Nodes (Batched Single Path rendering)
      if (viewport.scale >= 0.5) {
        ctx.fillStyle = pulseGlowColor;
        const dotRadius = Math.max(1, 1.5 / viewport.scale);
        ctx.beginPath();
        for (let x = minGridNodeX; x <= maxGridNodeX; x += 10) {
          for (let y = minGridNodeY; y <= maxGridNodeY; y += 10) {
            ctx.rect(x * PIXEL_SIZE - dotRadius, y * PIXEL_SIZE - dotRadius, dotRadius * 2, dotRadius * 2);
          }
        }
        ctx.fill();
      }

      // 5. Draw 50x50 AI Sector Boundaries & Watermark Labels
      const minSectorX = Math.floor(minGridX / 50) * 50;
      const maxSectorX = Math.min(WORLD_WIDTH, (Math.floor(maxGridX / 50) + 1) * 50);
      const minSectorY = Math.floor(minGridY / 50) * 50;
      const maxSectorY = Math.min(WORLD_HEIGHT, (Math.floor(maxGridY / 50) + 1) * 50);

      // Draw AI Sector Lines
      ctx.strokeStyle = pulsePurpleColor;
      ctx.lineWidth = 1.5 / viewport.scale;
      ctx.beginPath();
      for (let x = minSectorX; x <= maxSectorX; x += 50) {
        ctx.moveTo(x * PIXEL_SIZE, minSectorY * PIXEL_SIZE);
        ctx.lineTo(x * PIXEL_SIZE, maxSectorY * PIXEL_SIZE);
      }
      for (let y = minSectorY; y <= maxSectorY; y += 50) {
        ctx.moveTo(minSectorX * PIXEL_SIZE, y * PIXEL_SIZE);
        ctx.lineTo(maxSectorX * PIXEL_SIZE, y * PIXEL_SIZE);
      }
      ctx.stroke();

      // Draw Sector Watermark Labels (rendered when zoomed)
      if (viewport.scale >= 0.25) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.font = `bold ${Math.max(10, Math.min(22, 14 / viewport.scale))}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let x = minSectorX; x < maxSectorX; x += 50) {
          for (let y = minSectorY; y < maxSectorY; y += 50) {
            const sectorCode = `AI-ZONE [${x / 50 + 1}-${y / 50 + 1}]`;
            ctx.fillText(sectorCode, x * PIXEL_SIZE + 8, y * PIXEL_SIZE + 8);
          }
        }
      }

      // 6. Draw Minor Grid Lines if zoomed in close
      if (viewport.scale > 0.6) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 0.5 / viewport.scale;

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

      // Render Purchased & Reserved Pixels
      const activePixels = Object.values(pixels);
      activePixels.forEach((pixel) => {
        if (pixel.x >= minGridX && pixel.x <= maxGridX && pixel.y >= minGridY && pixel.y <= maxGridY) {
          if (pixel.status === 'sold') {
            renderedCount++;
            ctx.fillStyle = pixel.color || '#8FE3FF';
            ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1 / viewport.scale;
            ctx.strokeRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          } else if (pixel.status === 'reserved') {
            renderedCount++;
            // Amber color for reserved pixels being purchased
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);

            ctx.strokeStyle = '#FBBF24';
            ctx.lineWidth = 1.5 / viewport.scale;
            ctx.strokeRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      });

      // Render Selected Pixels (#B6B2FF active-lavender Highlight - Batched Single Path Optimization)
      if (selectedCoords.size > 0) {
        ctx.fillStyle = '#B6B2FF';
        ctx.beginPath();
        selectedCoords.forEach((key) => {
          const [x, y] = key.split(',').map(Number);
          if (x >= minGridX && x <= maxGridX && y >= minGridY && y <= maxGridY) {
            ctx.rect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
          }
        });
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5 / viewport.scale;
        ctx.stroke();
      }

      // Render Hovered Pixel Cursor Box (Enhanced Futuristic Reticle when Slot Selection Mode is Active)
      if (hoveredPixel && hoveredPixel.pixel) {
        const hX = hoveredPixel.pixel.x;
        const hY = hoveredPixel.pixel.y;
        if (hX >= minGridX && hX <= maxGridX && hY >= minGridY && hY <= maxGridY) {
          const pxX = hX * PIXEL_SIZE;
          const pxY = hY * PIXEL_SIZE;

          if (isSelectionMode) {
            // Enhanced Slot Selection Glowing Hover Style
            ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
            ctx.fillRect(pxX, pxY, PIXEL_SIZE, PIXEL_SIZE);

            // Glowing Neon Cyan Outer Border
            ctx.save();
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = Math.min(12, 10 / viewport.scale);
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5 / viewport.scale;
            ctx.strokeRect(pxX, pxY, PIXEL_SIZE, PIXEL_SIZE);
            ctx.restore();

            // White Corner Accent Reticles
            const cLen = Math.max(2, PIXEL_SIZE * 0.25);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5 / viewport.scale;

            ctx.beginPath();
            // Top-Left corner
            ctx.moveTo(pxX, pxY + cLen);
            ctx.lineTo(pxX, pxY);
            ctx.lineTo(pxX + cLen, pxY);

            // Top-Right corner
            ctx.moveTo(pxX + PIXEL_SIZE - cLen, pxY);
            ctx.lineTo(pxX + PIXEL_SIZE, pxY);
            ctx.lineTo(pxX + PIXEL_SIZE, pxY + cLen);

            // Bottom-Right corner
            ctx.moveTo(pxX + PIXEL_SIZE, pxY + PIXEL_SIZE - cLen);
            ctx.lineTo(pxX + PIXEL_SIZE, pxY + PIXEL_SIZE);
            ctx.lineTo(pxX + PIXEL_SIZE - cLen, pxY + PIXEL_SIZE);

            // Bottom-Left corner
            ctx.moveTo(pxX + cLen, pxY + PIXEL_SIZE);
            ctx.lineTo(pxX, pxY + PIXEL_SIZE);
            ctx.lineTo(pxX, pxY + PIXEL_SIZE - cLen);
            ctx.stroke();
          } else {
            // Standard Hover Outline
            ctx.strokeStyle = '#8FE3FF';
            ctx.lineWidth = 2 / viewport.scale;
            ctx.strokeRect(pxX, pxY, PIXEL_SIZE, PIXEL_SIZE);
          }
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

    // Holding Control / Command or Middle-click overrides selection mode to PAN / MOVE the canvas
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    const isModifier = e.shiftKey || e.altKey;
    if (isSelectionMode || isModifier || e.button === 2) {
      if (viewport.scale < 0.25) {
        setShowZoomHint(true);
        setTimeout(() => setShowZoomHint(false), 3000);
        setIsPanning(true);
        setIsSelecting(false);
        setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        return;
      }
      setIsSelecting(true);
      setIsPanning(false);
      const gridPos = screenToGrid(clientX, clientY);
      setSelectStart(gridPos);
      setSelectEnd(gridPos);
    } else {
      setIsPanning(true);
      setIsSelecting(false);
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
    const isMulti = e.shiftKey || e.altKey || hadModifierKeysRef.current || isSelectionMode;

    if (isSelecting && selectStart && selectEnd) {
      const isDrag = selectStart.x !== selectEnd.x || selectStart.y !== selectEnd.y;
      if (isDrag) {
        setBoxSelection({
          startX: selectStart.x,
          startY: selectStart.y,
          endX: selectEnd.x,
          endY: selectEnd.y,
        }, isMulti);
      } else {
        togglePixelSelection(selectStart.x, selectStart.y, isMulti);
      }
    }

    setIsSelecting(false);
    setIsPanning(false);
    setSelectStart(null);
    setSelectEnd(null);
    hadModifierKeysRef.current = false;
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
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;

      setViewport((prev) => {
        const newScale = Math.max(0.003, Math.min(8.0, prev.scale * zoomFactor));
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

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If Selection Mode is enabled, do not open the purchase popup on double-click
    if (isSelectionMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const gridPos = screenToGrid(clientX, clientY);

    const key = `${gridPos.x},${gridPos.y}`;
    const pixel = pixels[key];

    // Double clicking an available pixel in standard mode selects it and opens the purchase modal
    if (!pixel || pixel.status !== 'sold') {
      togglePixelSelection(gridPos.x, gridPos.y, false);
      openCheckoutModal();
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-53px)] overflow-hidden bg-background select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onMouseLeave={() => {
          setIsPanning(false);
          setIsSelecting(false);
          setHoveredPixel(null);
        }}
        className={`w-full h-full block ${isPanning ? 'canvas-cursor-grabbing' : 'canvas-cursor-grab'}`}
      />

      {/* Selection Warning Toast Banner */}
      {showZoomHint && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-[#1e1515]/95 border border-amber-500/60 text-amber-200 text-xs font-semibold px-4.5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none">
          <span className="text-amber-400 text-sm">⚠️</span>
          <span>Selection Warning: Please zoom in closer to select land slots!</span>
        </div>
      )}

      {/* Hovered Pixel Details Tooltip Card (Only rendered for purchased pixels) */}
      {hoveredPixel && hoveredPixel.pixel && hoveredPixel.pixel.status === 'sold' && (
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
                Pixel #{(hoveredPixel.pixel.y * 10000 + hoveredPixel.pixel.x + 1).toLocaleString()}
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant font-medium">ID: #{hoveredPixel.pixel.id}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-active-cyan/15 text-active-cyan">
              {hoveredPixel.pixel.status}
            </span>
          </div>

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
        </div>
      )}

      {/* Bottom Left Hover Pixel Floating Badge */}
      {hoveredPixel && hoveredPixel.pixel && (
        <div className="absolute bottom-4 left-4 z-20 bg-surface-container/95 border border-outline-variant rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs text-white pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="p-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-active-cyan">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-xs font-mono">
              Pixel #{(hoveredPixel.pixel.y * 4000 + hoveredPixel.pixel.x + 1).toLocaleString()}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                hoveredPixel.pixel.status === 'sold'
                  ? 'bg-active-cyan/15 text-active-cyan border border-active-cyan/30'
                  : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              {hoveredPixel.pixel.status === 'sold' ? `Owner: ${hoveredPixel.pixel.owner_name}` : 'AVAILABLE'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
