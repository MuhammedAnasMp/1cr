'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBlockStore } from '@/store/useBlockStore';
import { usePartyKitRealtime } from '@/lib/partykit';
import { Block } from '@/types';

const BLOCK_SIZE = 20; // 20px on screen at 1x zoom (represents 100 pixels)
const GRID_COLUMNS = 1000;
const GRID_ROWS = 1000;

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
      pulse.block_ids.forEach((id) => {
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
      data.block_ids.forEach((id) => {
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

    // Background Canvas color
    ctx.fillStyle = '#0e0e11';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    // Calculate visible block bounds for 60 FPS Viewport Frustum Culling
    const minGridX = Math.max(0, Math.floor(-viewport.x / (BLOCK_SIZE * viewport.scale)) - 2);
    const maxGridX = Math.min(GRID_COLUMNS, Math.ceil((width - viewport.x) / (BLOCK_SIZE * viewport.scale)) + 2);
    const minGridY = Math.max(0, Math.floor(-viewport.y / (BLOCK_SIZE * viewport.scale)) - 2);
    const maxGridY = Math.min(GRID_ROWS, Math.ceil((height - viewport.y) / (BLOCK_SIZE * viewport.scale)) + 2);

    // 1. Draw Grid Lines if zoomed in sufficiently
    if (viewport.scale >= 0.8) {
      ctx.strokeStyle = '#18181f';
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

        const screenLeft = x * BLOCK_SIZE;
        const screenTop = y * BLOCK_SIZE;

        if (block && block.status === 'sold') {
          // Sold Block: Render Image or Accent Theme
          if (block.image_url) {
            let img = imageCache.current.get(block.image_url);
            if (!img) {
              img = new Image();
              img.src = block.image_url;
              img.crossOrigin = 'anonymous';
              img.onload = () => renderCanvas();
              imageCache.current.set(block.image_url, img);
            }

            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
            } else {
              ctx.fillStyle = block.config?.theme_color || '#00e5ff';
              ctx.fillRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
            }
          } else {
            ctx.fillStyle = block.config?.theme_color || '#00e5ff';
            ctx.fillRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
          }

          // Subtle border around sold blocks
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
          ctx.lineWidth = 1 / viewport.scale;
          ctx.strokeRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
        } else if (block && block.status === 'reserved') {
          // Active Reservation Lock (Amber)
          ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.fillRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5 / viewport.scale;
          ctx.strokeRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
        }

        // Selection Highlight
        if (isSelected) {
          ctx.fillStyle = 'rgba(182, 178, 255, 0.35)'; // Active Lavender
          ctx.fillRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#B6B2FF';
          ctx.lineWidth = 2 / viewport.scale;
          ctx.strokeRect(screenLeft, screenTop, BLOCK_SIZE, BLOCK_SIZE);
        }
      }
    }

    // 3. Draw In-Progress Drag Selection Box
    if (isSelecting && selectStart && selectEnd) {
      const startX = Math.min(selectStart.x, selectEnd.x) * BLOCK_SIZE;
      const startY = Math.min(selectStart.y, selectEnd.y) * BLOCK_SIZE;
      const boxW = (Math.abs(selectEnd.x - selectStart.x) + 1) * BLOCK_SIZE;
      const boxH = (Math.abs(selectEnd.y - selectStart.y) + 1) * BLOCK_SIZE;

      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.fillRect(startX, startY, boxW, boxH);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2 / viewport.scale;
      ctx.strokeRect(startX, startY, boxW, boxH);
    }

    ctx.restore();
  }, [viewport, blocks, selectedBlockIds, isSelecting, selectStart, selectEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Coordinate Conversion Helper
  const screenToGrid = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;

    const worldX = (clientX - viewport.x) / viewport.scale;
    const worldY = (clientY - viewport.y) / viewport.scale;

    return {
      x: Math.floor(worldX / BLOCK_SIZE),
      y: Math.floor(worldY / BLOCK_SIZE),
    };
  };

  // Mouse Interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || (!isSelectionMode && e.button === 0)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    } else if (e.button === 0) {
      const grid = screenToGrid(e.clientX, e.clientY);
      setIsSelecting(true);
      setSelectStart(grid);
      setSelectEnd(grid);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const grid = screenToGrid(e.clientX, e.clientY);

    // Hover Tooltip Check
    const key = `${grid.x},${grid.y}`;
    const block = blocks[key];
    if (block) {
      setHoveredBlock({ block, screenX: e.clientX, screenY: e.clientY });
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
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0e0e11]">
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
          className="fixed pointer-events-none z-50 bg-[#16161a]/95 border border-[#333] backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs max-w-xs animate-in fade-in zoom-in-95 duration-100"
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
                className="w-8 h-8 rounded-full object-cover border border-[#444]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-active-cyan/20 text-active-cyan font-bold flex items-center justify-center">
                {(hoveredBlock.block.owner_name || 'O')[0]}
              </div>
            )}
            <div>
              <h4 className="font-bold text-white leading-tight">
                {hoveredBlock.block.owner_name || 'Block Owner'}
              </h4>
              <p className="text-[10px] text-active-cyan font-mono">
                @{hoveredBlock.block.owner_username || 'creator'} • Block [{hoveredBlock.block.grid_x},{hoveredBlock.block.grid_y}]
              </p>
            </div>
          </div>

          {hoveredBlock.block.config?.bio && (
            <p className="text-[11px] text-neutral-300 mb-2 line-clamp-2">
              {hoveredBlock.block.config.bio}
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] text-neutral-400 border-t border-[#2a2a2a] pt-2">
            <span>{hoveredBlock.block.links?.length || 0} Connected Links</span>
            <span className="text-active-lavender font-semibold">Click to open</span>
          </div>
        </div>
      )}
    </div>
  );
};
