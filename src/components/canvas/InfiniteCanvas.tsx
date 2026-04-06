import { useRef, useState, useCallback } from 'react';
import { TaskCard } from '../task/TaskCard';
import { StickyNoteCard } from './StickyNote';
import { CanvasInbox } from './CanvasInbox';
import { CanvasToolbar } from './CanvasToolbar';
import { Minimap } from './Minimap';
import { useCanvasStore } from '../../stores/canvasStore';
import { useTaskStore } from '../../stores/taskStore';
import { CANVAS_GRID_SIZE } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
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
    updatePosition, createStickyNote, createTaskPosition, snapToGrid,
  } = useCanvasStore();
  const tasks = useTaskStore((s) => s.tasks);

  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<{
    id: string; startX: number; startY: number; origX: number; origY: number;
  } | null>(null);
  const [showMinimap] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
      setIsPanning(true);
      setSelectedItem(null);
      setContextMenu(null);
    }
  }, [setSelectedItem]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan(panX + e.movementX, panY + e.movementY);
    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const snapped = e.shiftKey
        ? { x: dragState.origX + dx, y: dragState.origY + dy }
        : snapToGrid(dragState.origX + dx, dragState.origY + dy);
      updatePosition(dragState.id, { x: snapped.x, y: snapped.y });
    }
  }, [isPanning, panX, panY, zoom, dragState, setPan, snapToGrid, updatePosition]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); setDragState(null); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1));
  }, [zoom, setZoom]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setContextMenu({ x: (e.clientX - rect.left - panX) / zoom, y: (e.clientY - rect.top - panY) / zoom });
    }
  }, [panX, panY, zoom]);

  const handleAddSticky = useCallback((color: StickyColor = '#7C3AED') => {
    if (!contextMenu) return;
    createStickyNote(teamId, userId, contextMenu.x, contextMenu.y, color);
    setContextMenu(null);
  }, [contextMenu, teamId, userId, createStickyNote]);

  const handleCardMouseDown = useCallback((posId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(posId);
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    setDragState({ id: posId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y });
  }, [positions, setSelectedItem]);

  // Drop handler for dragging tasks from inbox to canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    const snapped = snapToGrid(x, y);
    createTaskPosition(teamId, taskId, snapped.x, snapped.y);
  }, [panX, panY, zoom, snapToGrid, createTaskPosition, teamId]);

  const placedTaskIds = new Set(positions.filter((p) => p.item_type === 'task').map((p) => p.item_id));
  const unplacedTasks = tasks.filter((t) => !placedTaskIds.has(t.id));

  const gridStep = CANVAS_GRID_SIZE * zoom;

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: colors.bg.primary, height: '100%' }}>
      {/* Inbox */}
      <CanvasInbox tasks={unplacedTasks} members={members} teamId={teamId} />

      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          left: 260,
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDoubleClick={(e) => {
          if (e.target === canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - panX) / zoom;
            const y = (e.clientY - rect.top - panY) / zoom;
            createStickyNote(teamId, userId, x, y);
          }
        }}
      >
        {/* Dot grid — low opacity, Destiny-style geometric */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            {/* Small dot grid */}
            <pattern
              id="dotGrid"
              width={gridStep}
              height={gridStep}
              patternUnits="userSpaceOnUse"
              x={panX % gridStep}
              y={panY % gridStep}
            >
              <circle cx={gridStep / 2} cy={gridStep / 2} r={0.6 * zoom} fill="rgba(255,255,255,0.06)" />
            </pattern>
            {/* Larger geometric crosshair grid */}
            <pattern
              id="crossGrid"
              width={gridStep * 5}
              height={gridStep * 5}
              patternUnits="userSpaceOnUse"
              x={panX % (gridStep * 5)}
              y={panY % (gridStep * 5)}
            >
              {/* Intersection cross */}
              <line x1={gridStep * 2.5 - 3 * zoom} y1={gridStep * 2.5} x2={gridStep * 2.5 + 3 * zoom} y2={gridStep * 2.5} stroke="rgba(124,58,237,0.08)" strokeWidth={0.5 * zoom} />
              <line x1={gridStep * 2.5} y1={gridStep * 2.5 - 3 * zoom} x2={gridStep * 2.5} y2={gridStep * 2.5 + 3 * zoom} stroke="rgba(124,58,237,0.08)" strokeWidth={0.5 * zoom} />
              {/* Corner diamond */}
              <polygon
                points={`${gridStep * 2.5},${gridStep * 2.5 - 1.5 * zoom} ${gridStep * 2.5 + 1.5 * zoom},${gridStep * 2.5} ${gridStep * 2.5},${gridStep * 2.5 + 1.5 * zoom} ${gridStep * 2.5 - 1.5 * zoom},${gridStep * 2.5}`}
                fill="none"
                stroke="rgba(124,58,237,0.06)"
                strokeWidth={0.4 * zoom}
              />
            </pattern>
            {/* Large section lines */}
            <pattern
              id="sectionGrid"
              width={gridStep * 10}
              height={gridStep * 10}
              patternUnits="userSpaceOnUse"
              x={panX % (gridStep * 10)}
              y={panY % (gridStep * 10)}
            >
              {/* Thin section border lines */}
              <line x1="0" y1="0" x2={gridStep * 10} y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
              <line x1="0" y1="0" x2="0" y2={gridStep * 10} stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
              {/* Corner tick marks — geometric accent */}
              <line x1="0" y1="0" x2={4 * zoom} y2="0" stroke="rgba(124,58,237,0.1)" strokeWidth={1} />
              <line x1="0" y1="0" x2="0" y2={4 * zoom} stroke="rgba(124,58,237,0.1)" strokeWidth={1} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
          <rect width="100%" height="100%" fill="url(#crossGrid)" />
          <rect width="100%" height="100%" fill="url(#sectionGrid)" />
        </svg>

        {/* Transform layer */}
        <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {/* Task cards */}
          {positions.filter((p) => p.item_type === 'task' && p.item_id).map((pos) => {
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
          {positions.filter((p) => p.item_type === 'sticky').map((pos) => {
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
            style={{
              position: 'fixed',
              left: contextMenu.x * zoom + panX + 260,
              top: contextMenu.y * zoom + panY,
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              padding: '4px 0',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => handleAddSticky('#7C3AED')}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: font.size.sm,
                color: colors.text.secondary,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = colors.bg.surfaceHover; e.currentTarget.style.color = colors.text.primary; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.text.secondary; }}
            >
              Add Sticky Note
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <CanvasToolbar
        onZoomToFit={() => { setPan(0, 0); setZoom(1); }}
        onResetView={() => { setPan(0, 0); setZoom(1); }}
      />

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        fontSize: font.size.xs,
        color: colors.text.muted,
        backgroundColor: 'rgba(26,26,26,0.8)',
        padding: '4px 8px',
        borderRadius: '4px',
      }}>
        {Math.round(zoom * 100)}%
      </div>

      {/* Minimap */}
      {showMinimap && <Minimap positions={positions} zoom={zoom} panX={panX} panY={panY} />}
    </div>
  );
}
