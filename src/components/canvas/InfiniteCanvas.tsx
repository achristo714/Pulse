import { useRef, useState, useCallback, useEffect } from 'react';
import { TaskCard } from '../task/TaskCard';
import { StickyNoteCard } from './StickyNote';
import { CanvasInbox } from './CanvasInbox';
import { CanvasToolbar } from './CanvasToolbar';
import { Minimap } from './Minimap';
import { useCanvasStore } from '../../stores/canvasStore';
import { useTaskStore } from '../../stores/taskStore';
import { CANVAS_GRID_SIZE } from '../../lib/constants';
import type { Profile, StickyColor } from '../../lib/types';

interface InfiniteCanvasProps {
  teamId: string;
  userId: string;
  members: Profile[];
  onTaskDoubleClick: (taskId: string) => void;
}

export function InfiniteCanvas({ teamId, userId, members, onTaskDoubleClick }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    positions, stickyNotes, zoom, panX, panY,
    setZoom, setPan, selectedItemId, setSelectedItem,
    updatePosition, createStickyNote, snapToGrid,
  } = useCanvasStore();
  const tasks = useTaskStore((s) => s.tasks);

  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Pan with middle mouse or background drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
      setSelectedItem(null);
      setContextMenu(null);
    }
  }, [setSelectedItem]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan(panX + e.movementX, panY + e.movementY);
    }
    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const newX = dragState.origX + dx;
      const newY = dragState.origY + dy;
      const snapped = e.shiftKey ? { x: newX, y: newY } : snapToGrid(newX, newY);
      updatePosition(dragState.id, { x: snapped.x, y: snapped.y });
    }
  }, [isPanning, panX, panY, zoom, dragState, setPan, snapToGrid, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragState(null);
  }, []);

  // Zoom with scroll wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  }, [zoom, setZoom]);

  // Context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panX) / zoom;
      const y = (e.clientY - rect.top - panY) / zoom;
      setContextMenu({ x, y });
    }
  }, [panX, panY, zoom]);

  const handleAddSticky = useCallback((color: StickyColor = '#7C3AED') => {
    if (!contextMenu) return;
    createStickyNote(teamId, userId, contextMenu.x, contextMenu.y, color);
    setContextMenu(null);
  }, [contextMenu, teamId, userId, createStickyNote]);

  // Card drag start
  const handleCardMouseDown = useCallback((posId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(posId);
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    setDragState({
      id: posId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    });
  }, [positions, setSelectedItem]);

  // Unplaced tasks (no canvas position)
  const placedTaskIds = new Set(
    positions.filter((p) => p.item_type === 'task').map((p) => p.item_id)
  );
  const unplacedTasks = tasks.filter((t) => !placedTaskIds.has(t.id));

  return (
    <div className="relative flex-1 overflow-hidden bg-bg-primary">
      {/* Inbox */}
      <CanvasInbox
        tasks={unplacedTasks}
        members={members}
        teamId={teamId}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ left: 260 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
          <defs>
            <pattern
              id="grid"
              width={CANVAS_GRID_SIZE * zoom}
              height={CANVAS_GRID_SIZE * zoom}
              patternUnits="userSpaceOnUse"
              x={panX % (CANVAS_GRID_SIZE * zoom)}
              y={panY % (CANVAS_GRID_SIZE * zoom)}
            >
              <circle cx="1" cy="1" r="0.5" fill="#444" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Task cards */}
          {positions
            .filter((p) => p.item_type === 'task' && p.item_id)
            .map((pos) => {
              const task = tasks.find((t) => t.id === pos.item_id);
              if (!task) return null;
              return (
                <TaskCard
                  key={pos.id}
                  task={task}
                  members={members}
                  selected={selectedItemId === pos.id}
                  style={{ left: pos.x, top: pos.y }}
                  onDoubleClick={() => onTaskDoubleClick(task.id)}
                  onMouseDown={(e) => handleCardMouseDown(pos.id, e)}
                />
              );
            })}

          {/* Sticky notes */}
          {positions
            .filter((p) => p.item_type === 'sticky')
            .map((pos) => {
              const note = stickyNotes.find((n) => n.canvas_position_id === pos.id);
              if (!note) return null;
              return (
                <StickyNoteCard
                  key={pos.id}
                  note={note}
                  position={pos}
                  selected={selectedItemId === pos.id}
                  onMouseDown={(e) => handleCardMouseDown(pos.id, e)}
                />
              );
            })}
        </div>

        {/* Context menu */}
        {contextMenu && (
          <div
            className="fixed bg-bg-surface border border-border-default rounded-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 z-50"
            style={{
              left: contextMenu.x * zoom + panX + 260,
              top: contextMenu.y * zoom + panY,
            }}
          >
            <button
              onClick={() => handleAddSticky('#7C3AED')}
              className="w-full text-left px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              Add Sticky Note
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <CanvasToolbar
        onZoomToFit={() => {
          setPan(0, 0);
          setZoom(1);
        }}
        onResetView={() => {
          setPan(0, 0);
          setZoom(1);
        }}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 text-[11px] text-text-muted bg-bg-surface/80 px-2 py-1 rounded">
        {Math.round(zoom * 100)}%
      </div>

      {/* Minimap */}
      {showMinimap && (
        <Minimap
          positions={positions}
          zoom={zoom}
          panX={panX}
          panY={panY}
        />
      )}
    </div>
  );
}
