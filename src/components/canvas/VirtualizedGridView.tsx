'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { usePartyKitRealtime } from '@/lib/partykit';
import { Block } from '@/types';

const BLOCK_SIZE = 24; // 24px on screen at 1x zoom (represents 100 pixels)
const GRID_COLUMNS = 1000;
const GRID_ROWS = 100;

export const VirtualizedGridView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    viewport,
    setViewport,
    blocks,
    selectedBlockIds,
    toggleBlockSelection,
    setBoxSelection,
    setActiveBlockDetail,
    patchBlock,
    addPulse,
    setPresence,
    isSelectionMode,
    openCheckoutModal,
  } = useBlockStore();

  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<{ block: Block | null; screenX: number; screenY: number } | null>(null);

  // Box Selection
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState<{ x: number; y: number } | null>(null);
  const [selectEnd, setSelectEnd] = useState<{ x: number; y: number } | null>(null);

  // Image cache
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Realtime PartyKit WebSocket integration
  usePartyKitRealtime({
    onPulse: (pulse) => {
      addPulse(pulse);
      pulse.block_ids?.forEach((id) => {
        const parts = id.replace('b_', '').split('_');
        if (parts.length === 2) {
          patchBlock({
            grid_x: parseInt(parts[0], 10),
            grid_y: parseInt(parts[1], 10),
            status: 'sold',
            owner_name: pulse.owner_name,
          });
        }
      });
    },
    onReservationChange: (data) => {
      data.block_ids?.forEach((id) => {
        const parts = id.replace('b_', '').split('_');
        if (parts.length === 2) {
          patchBlock({
            grid_x: parseInt(parts[0], 10),
            grid_y: parseInt(parts[1], 10),
            status: data.status === 'reserved' ? 'reserved' : 'available',
          });
        }
      });
    },
    onPresenceUpdate: (pres) => {
      setPresence(pres);
    },
  });

  // Render Loop with Viewport Frustum Culling
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Canvas Background
    ctx.fillStyle = '#f8f5fd';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Visible block bounds for 60 FPS Viewport Frustum Culling
    const minGridX = Math.max(0, Math.floor(-viewport.x / (BLOCK_SIZE * viewport.scale)) - 2);
    const maxGridX = Math.min(GRID_COLUMNS, Math.ceil((width - viewport.x) / (BLOCK_SIZE * viewport.scale)) + 2);
    const minGridY = Math.max(0, Math.floor(-viewport.y / (BLOCK_SIZE * viewport.scale)) - 2);
    const maxGridY = Math.min(GRID_ROWS, Math.ceil((height - viewport.y) / (BLOCK_SIZE * viewport.scale)) + 2);

    // 1. Draw Grid Lines if zoomed in sufficiently
    if (viewport.scale >= 0.6) {
      ctx.strokeStyle = '#e6e0f2';
      ctx.lineWidth = 0.5 / viewport.scale;

      ctx.beginPath();
      for (let x = minGridX; x <= maxGridX; x++) {
        ctx.moveTo(x * BLOCK_SIZE, minGridY * BLOCK_SIZE);
        ctx.lineTo(x * BLOCK_SIZE, maxGridY * BLOCK_SIZE);
      }
      for (let y = minGridY; y <= maxGridY; y++) {
        ctx.moveTo(minGridX * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.lineTo(maxGridX * BLOCK_SIZE, y * BLOCK_SIZE);
      }
      ctx.stroke();
    }

    // 2. Draw Visible Blocks
    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        const key = `${x},${y}`;
        const block = blocks[key];
        const isSelected = selectedBlockIds.has(key);
        const bx = x * BLOCK_SIZE;
        const by = y * BLOCK_SIZE;

        if (block && block.status === 'sold') {
          // Render Sold Block (Owner Image or Gradient Tile)
          if (block.image_url) {
            let img = imageCache.current.get(block.image_url);
            if (!img) {
              img = new Image();
              img.crossOrigin = 'anonymous';
              img.src = block.image_url;
              img.onload = () => {
                renderCanvas();
              };
              imageCache.current.set(block.image_url, img);
            }
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, bx, by, BLOCK_SIZE, BLOCK_SIZE);
            } else {
              ctx.fillStyle = '#6366f1';
              ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
            }
          } else {
            // Default sovereign avatar tile
            ctx.fillStyle = '#4f46e5';
            ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
            if (viewport.scale >= 1.5) {
              ctx.fillStyle = '#ffffff';
              ctx.font = `${Math.floor(BLOCK_SIZE * 0.4)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText((block.owner_name || 'B')[0].toUpperCase(), bx + BLOCK_SIZE / 2, by + BLOCK_SIZE / 2);
            }
          }
        } else if (block && block.status === 'reserved') {
          // Reserved by an active checkout lock
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1 / viewport.scale;
          ctx.strokeRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
        } else {
          // Unclaimed Available Block Tile
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx + 0.5, by + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }

        // Selection Overlay Highlight
        if (isSelected) {
          ctx.fillStyle = 'rgba(70, 72, 212, 0.4)';
          ctx.fillRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#4648d4';
          ctx.lineWidth = 2 / viewport.scale;
          ctx.strokeRect(bx, by, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }

    // 3. Draw Active Box Selection Rectangle
    if (isSelecting && selectStart && selectEnd) {
      const minX = Math.min(selectStart.x, selectEnd.x);
      const maxX = Math.max(selectStart.x, selectEnd.x);
      const minY = Math.min(selectStart.y, selectEnd.y);
      const maxY = Math.max(selectStart.y, selectEnd.y);

      const sx = minX * BLOCK_SIZE;
      const sy = minY * BLOCK_SIZE;
      const sw = (maxX - minX + 1) * BLOCK_SIZE;
      const sh = (maxY - minY + 1) * BLOCK_SIZE;

      ctx.fillStyle = 'rgba(70, 72, 212, 0.25)';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#4648d4';
      ctx.lineWidth = 1.5 / viewport.scale;
      ctx.setLineDash([4 / viewport.scale, 2 / viewport.scale]);
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [viewport, blocks, selectedBlockIds, isSelecting, selectStart, selectEnd]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight - 53;
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Coordinate transforms
  const screenToGrid = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;

    const worldX = (localX - viewport.x) / viewport.scale;
    const worldY = (localY - viewport.y) / viewport.scale;

    return {
      x: Math.floor(worldX / BLOCK_SIZE),
      y: Math.floor(worldY / BLOCK_SIZE),
    };
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space/Alt key triggers panning
    if (e.button === 1 || e.altKey || (!isSelectionMode && e.button === 0)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    if (e.button === 0) {
      const grid = screenToGrid(e.clientX, e.clientY);
      if (grid.x >= 0 && grid.x < GRID_COLUMNS && grid.y >= 0 && grid.y < GRID_ROWS) {
        setIsSelecting(true);
        setSelectStart(grid);
        setSelectEnd(grid);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const grid = screenToGrid(e.clientX, e.clientY);

    // Check hover card
    if (grid.x >= 0 && grid.x < GRID_COLUMNS && grid.y >= 0 && grid.y < GRID_ROWS) {
      const key = `${grid.x},${grid.y}`;
      const b = blocks[key];
      if (b && b.status === 'sold') {
        setHoveredBlock({ block: b, screenX: e.clientX, screenY: e.clientY });
      } else {
        setHoveredBlock(null);
      }
    } else {
      setHoveredBlock(null);
    }

    if (isPanning) {
      setViewport({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (isSelecting && selectStart) {
      setSelectEnd(grid);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isSelecting && selectStart && selectEnd) {
      setIsSelecting(false);
      const isClick = selectStart.x === selectEnd.x && selectStart.y === selectEnd.y;

      if (isClick) {
        const key = `${selectStart.x},${selectStart.y}`;
        const clickedBlock = blocks[key];

        if (clickedBlock && clickedBlock.status === 'sold') {
          // Open Linktree Block Detail Modal
          setActiveBlockDetail(clickedBlock);
        } else {
          // Toggle selection
          toggleBlockSelection(selectStart.x, selectStart.y, e.shiftKey || e.ctrlKey);
        }
      } else {
        // Multi-block box selection
        setBoxSelection(
          {
            startX: selectStart.x,
            startY: selectStart.y,
            endX: selectEnd.x,
            endY: selectEnd.y,
          },
          e.shiftKey || e.ctrlKey
        );
      }
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(0.1, Math.min(viewport.scale * zoomFactor, 10));
    const scaleRatio = newScale / viewport.scale;

    setViewport({
      scale: newScale,
      x: mouseX - (mouseX - viewport.x) * scaleRatio,
      y: mouseY - (mouseY - viewport.y) * scaleRatio,
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-background">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Hover Block Preview Card */}
      {hoveredBlock && hoveredBlock.block && (
        <div
          className="fixed pointer-events-none z-50 bg-surface-container/95 border border-outline-variant backdrop-blur-md rounded-modal p-3.5 shadow-2xl text-xs max-w-xs animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${Math.min(window.innerWidth - 260, hoveredBlock.screenX + 16)}px`,
            top: `${Math.min(window.innerHeight - 200, hoveredBlock.screenY + 16)}px`,
          }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            {hoveredBlock.block.owner_avatar ? (
              <img
                src={hoveredBlock.block.owner_avatar}
                alt={hoveredBlock.block.owner_name || 'Owner'}
                className="w-9 h-9 rounded-full object-cover border border-outline-variant shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-black flex items-center justify-center">
                {(hoveredBlock.block.owner_name || 'O')[0]}
              </div>
            )}
            <div>
              <h4 className="font-extrabold text-on-surface leading-tight">
                {hoveredBlock.block.owner_name || 'Block Owner'}
              </h4>
              <p className="text-[10px] text-primary font-mono font-bold">
                @{hoveredBlock.block.owner_username || 'creator'} • Block [{hoveredBlock.block.grid_x},{hoveredBlock.block.grid_y}]
              </p>
            </div>
          </div>

          {hoveredBlock.block.config?.bio && (
            <p className="text-[11px] text-on-surface-variant mb-2 line-clamp-2">
              {hoveredBlock.block.config.bio}
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] text-on-surface-variant border-t border-outline-variant pt-2">
            <span>{hoveredBlock.block.links?.length || 0} Connected Links</span>
            <span className="text-primary font-bold">Click to view</span>
          </div>
        </div>
      )}
    </div>
  );
};
