import { useRef, useState, useCallback, useEffect } from 'react';
import { TaskCard } from '../task/TaskCard';
import { StickyNoteCard } from './StickyNote';
import { CanvasFrame } from './CanvasFrame';
import { CanvasInbox } from './CanvasInbox';
import { CanvasToolbar } from './CanvasToolbar';
import { Minimap } from './Minimap';
import { useCanvasStore } from '../../stores/canvasStore';
import { useTaskStore } from '../../stores/taskStore';
import { CANVAS_GRID_SIZE, CATEGORY_CONFIG, CATEGORIES } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
import type { Profile, StickyColor, TaskCategory } from '../../lib/types';

interface InfiniteCanvasProps {
  teamId: string;
  userId: string;
  members: Profile[];
  onTaskDoubleClick: (taskId: string) => void;
}

export function InfiniteCanvas({ teamId, userId, members, onTaskDoubleClick }: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    positions, stickyNotes, connections, frames, zoom, panX, panY,
    setZoom, setPan, selectedItemId, setSelectedItem,
    updatePosition, createStickyNote, createTaskPosition, snapToGrid,
    createConnection, createFrame, updateFrame,
  } = useCanvasStore();
  const tasks = useTaskStore((s) => s.tasks);

  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<{
    id: string; startX: number; startY: number; origX: number; origY: number;
  } | null>(null);
  const [showMinimap] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; positionId?: string } | null>(null);
  // Connection drawing state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingMouse, setConnectingMouse] = useState<{ x: number; y: number } | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  // Multi-drag
  const [multiDrag, setMultiDrag] = useState<{ startX: number; startY: number; origins: Map<string, { x: number; y: number }> } | null>(null);

  // Global mouseup listener for connection drawing (events don't bubble from cards)
  useEffect(() => {
    if (!connectingFrom) return;
    const handler = (e: MouseEvent) => {
      const mousePos = screenToCanvasRef.current(e.clientX, e.clientY);
      const targetPos = positions.find((p) => {
        const w = p.width || 280;
        const h = p.height || 120;
        return mousePos.x >= p.x - 10 && mousePos.x <= p.x + w + 10 && mousePos.y >= p.y - 10 && mousePos.y <= p.y + h + 10;
      });
      if (targetPos && targetPos.id !== connectingFrom) {
        createConnection(teamId, connectingFrom, targetPos.id);
      }
      setConnectingFrom(null);
      setConnectingMouse(null);
    };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [connectingFrom, positions, createConnection, teamId]);

  // Keep a ref to screenToCanvas so the effect can use it without re-subscribing
  const screenToCanvasRef = useRef((_x: number, _y: number) => ({ x: 0, y: 0 }));

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (clientX - rect.left - panX) / zoom, y: (clientY - rect.top - panY) / zoom };
  }, [panX, panY, zoom]);
  screenToCanvasRef.current = screenToCanvas;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      setIsPanning(true);
      return;
    }
    if (e.button === 0 && e.target === canvasRef.current) {
      setContextMenu(null);
      // Cancel connect mode if clicking empty space
      if (connectingFrom) {
        setConnectingFrom(null);
        setConnectingMouse(null);
        return;
      }
      // Start selection rectangle
      const pos = screenToCanvas(e.clientX, e.clientY);
      setSelectionRect({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      setIsSelecting(true);
      if (!e.shiftKey) {
        setSelectedIds(new Set());
        setSelectedItem(null);
      }
    }
  }, [setSelectedItem, screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan(panX + e.movementX, panY + e.movementY);
      return;
    }
    // Selection rectangle
    if (isSelecting && selectionRect) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setSelectionRect({ ...selectionRect, endX: pos.x, endY: pos.y });
      return;
    }
    // Multi-drag
    if (multiDrag) {
      const dx = (e.clientX - multiDrag.startX) / zoom;
      const dy = (e.clientY - multiDrag.startY) / zoom;
      for (const [id, orig] of multiDrag.origins) {
        const snapped = e.shiftKey ? { x: orig.x + dx, y: orig.y + dy } : snapToGrid(orig.x + dx, orig.y + dy);
        updatePosition(id, { x: snapped.x, y: snapped.y });
      }
      return;
    }
    // Connection drawing
    if (connectingFrom) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setConnectingMouse(pos);
      return;
    }
    // Single drag (positions or frames)
    if (dragState) {
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;
      const snapped = e.shiftKey
        ? { x: dragState.origX + dx, y: dragState.origY + dy }
        : snapToGrid(dragState.origX + dx, dragState.origY + dy);
      if (dragState.id.startsWith('frame-')) {
        updateFrame(dragState.id.replace('frame-', ''), { x: snapped.x, y: snapped.y });
      } else {
        updatePosition(dragState.id, { x: snapped.x, y: snapped.y });
      }
    }
  }, [isPanning, isSelecting, selectionRect, multiDrag, dragState, panX, panY, zoom, setPan, screenToCanvas, snapToGrid, updatePosition]);

  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    // Finish connection drawing
    if (connectingFrom && e) {
      const mousePos = screenToCanvas(e.clientX, e.clientY);
      // Find which card the mouse is over — generous hit area
      const targetPos = positions.find((p) => {
        const w = p.width || 280;
        const h = p.height || 120;
        return mousePos.x >= p.x - 10 && mousePos.x <= p.x + w + 10 && mousePos.y >= p.y - 10 && mousePos.y <= p.y + h + 10;
      });
      if (targetPos && targetPos.id !== connectingFrom) {
        createConnection(teamId, connectingFrom, targetPos.id);
      }
      setConnectingFrom(null);
      setConnectingMouse(null);
    }
    setIsPanning(false);
    setDragState(null);
    setMultiDrag(null);
    // Finalize selection rectangle
    if (isSelecting && selectionRect) {
      const minX = Math.min(selectionRect.startX, selectionRect.endX);
      const maxX = Math.max(selectionRect.startX, selectionRect.endX);
      const minY = Math.min(selectionRect.startY, selectionRect.endY);
      const maxY = Math.max(selectionRect.startY, selectionRect.endY);
      // Only select if rect is big enough (not just a click)
      if (maxX - minX > 5 || maxY - minY > 5) {
        const ids = new Set<string>();
        for (const pos of positions) {
          const cx = pos.x + (pos.width || 280) / 2;
          const cy = pos.y + 40;
          if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
            ids.add(pos.id);
          }
        }
        setSelectedIds(ids);
      }
      setSelectionRect(null);
      setIsSelecting(false);
    }
  }, [isSelecting, selectionRect, positions]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(4, zoom + delta));
    const scale = newZoom / zoom;
    setPan(mouseX - (mouseX - panX) * scale, mouseY - (mouseY - panY) * scale);
    setZoom(newZoom);
  }, [zoom, panX, panY, setZoom, setPan]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === canvasRef.current) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setContextMenu(pos);
    }
  }, [screenToCanvas]);

  const handleAddSticky = useCallback((color: StickyColor = '#7C3AED') => {
    if (!contextMenu) return;
    createStickyNote(teamId, userId, contextMenu.x, contextMenu.y, color);
    setContextMenu(null);
  }, [contextMenu, teamId, userId, createStickyNote]);

  const handleCardMouseDown = useCallback((posId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Shift+click starts connection drawing
    if (e.shiftKey) {
      setConnectingFrom(posId);
      const pos = screenToCanvas(e.clientX, e.clientY);
      setConnectingMouse(pos);
      return;
    }
    // If clicking a card that's part of multi-select, start multi-drag
    if (selectedIds.has(posId) && selectedIds.size > 1) {
      const origins = new Map<string, { x: number; y: number }>();
      for (const id of selectedIds) {
        const p = positions.find((pos) => pos.id === id);
        if (p) origins.set(id, { x: p.x, y: p.y });
      }
      setMultiDrag({ startX: e.clientX, startY: e.clientY, origins });
      return;
    }
    setSelectedItem(posId);
    setSelectedIds(new Set([posId]));
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;
    setDragState({ id: posId, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y });
  }, [positions, setSelectedItem, selectedIds, screenToCanvas]);

  // Drop from inbox
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId || !canvasRef.current) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    const snapped = snapToGrid(pos.x, pos.y);
    createTaskPosition(teamId, taskId, snapped.x, snapped.y);
  }, [screenToCanvas, snapToGrid, createTaskPosition, teamId]);

  // Place All — find empty space below/right of existing cards
  const handlePlaceAll = useCallback(async (unplacedTasks: typeof tasks) => {
    // Find the bottom edge of all existing positions to place below
    const maxY = positions.length > 0
      ? Math.max(...positions.map((p) => p.y + (p.height || 100))) + 60
      : 40;

    const byCategory: Record<string, typeof tasks> = {};
    for (const t of unplacedTasks) {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t);
    }
    let groupX = 40;
    for (const cat of CATEGORIES) {
      const catTasks = byCategory[cat];
      if (!catTasks || catTasks.length === 0) continue;
      for (let i = 0; i < catTasks.length; i++) {
        await createTaskPosition(teamId, catTasks[i].id, groupX, maxY + i * 120);
      }
      groupX += 340;
    }
  }, [createTaskPosition, teamId, positions]);

  // Stash a single card back to inbox (delete its canvas position)
  const { deletePosition } = useCanvasStore();
  const handleStash = useCallback((positionId: string) => {
    deletePosition(positionId);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(positionId); return next; });
    setSelectedItem(null);
  }, [deletePosition, setSelectedItem]);

  // Stash all cards back to inbox
  const handleStashAll = useCallback(() => {
    const taskPositions = positions.filter((p) => p.item_type === 'task');
    for (const pos of taskPositions) {
      deletePosition(pos.id);
    }
    setSelectedIds(new Set());
    setSelectedItem(null);
  }, [positions, deletePosition, setSelectedItem]);

  const placedTaskIds = new Set(positions.filter((p) => p.item_type === 'task').map((p) => p.item_id));
  const unplacedTasks = tasks.filter((t) => !placedTaskIds.has(t.id));
  const gridStep = CANVAS_GRID_SIZE * zoom;

  // Selection rect in screen coords for rendering
  const selRect = selectionRect ? {
    x: Math.min(selectionRect.startX, selectionRect.endX),
    y: Math.min(selectionRect.startY, selectionRect.endY),
    w: Math.abs(selectionRect.endX - selectionRect.startX),
    h: Math.abs(selectionRect.endY - selectionRect.startY),
  } : null;

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: colors.bg.primary, height: '100%' }}>
      <CanvasInbox tasks={unplacedTasks} members={members} teamId={teamId} onPlaceAll={() => handlePlaceAll(unplacedTasks)} onStashAll={handleStashAll} placedCount={positions.filter((p) => p.item_type === 'task').length} />

      <div
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, left: 260, cursor: connectingFrom ? 'crosshair' : isPanning ? 'grabbing' : isSelecting ? 'crosshair' : 'grab' }}
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
            const pos = screenToCanvas(e.clientX, e.clientY);
            createStickyNote(teamId, userId, pos.x, pos.y);
          }
        }}
      >
        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="dotGrid" width={gridStep} height={gridStep} patternUnits="userSpaceOnUse" x={panX % gridStep} y={panY % gridStep}>
              <circle cx={gridStep / 2} cy={gridStep / 2} r={0.6 * zoom} fill="rgba(255,255,255,0.06)" />
            </pattern>
            <pattern id="crossGrid" width={gridStep * 5} height={gridStep * 5} patternUnits="userSpaceOnUse" x={panX % (gridStep * 5)} y={panY % (gridStep * 5)}>
              <line x1={gridStep * 2.5 - 3 * zoom} y1={gridStep * 2.5} x2={gridStep * 2.5 + 3 * zoom} y2={gridStep * 2.5} stroke="rgba(124,58,237,0.08)" strokeWidth={0.5 * zoom} />
              <line x1={gridStep * 2.5} y1={gridStep * 2.5 - 3 * zoom} x2={gridStep * 2.5} y2={gridStep * 2.5 + 3 * zoom} stroke="rgba(124,58,237,0.08)" strokeWidth={0.5 * zoom} />
              <polygon points={`${gridStep * 2.5},${gridStep * 2.5 - 1.5 * zoom} ${gridStep * 2.5 + 1.5 * zoom},${gridStep * 2.5} ${gridStep * 2.5},${gridStep * 2.5 + 1.5 * zoom} ${gridStep * 2.5 - 1.5 * zoom},${gridStep * 2.5}`} fill="none" stroke="rgba(124,58,237,0.06)" strokeWidth={0.4 * zoom} />
            </pattern>
            <pattern id="sectionGrid" width={gridStep * 10} height={gridStep * 10} patternUnits="userSpaceOnUse" x={panX % (gridStep * 10)} y={panY % (gridStep * 10)}>
              <line x1="0" y1="0" x2={gridStep * 10} y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
              <line x1="0" y1="0" x2="0" y2={gridStep * 10} stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
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
          {/* Connection arrows — only between nearby same-category cards */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="arrowHead" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
                <polygon points="0 0, 6 2.5, 0 5" fill="rgba(124,58,237,0.25)" />
              </marker>
            </defs>
            {(() => {
              const taskPositions = positions.filter((p) => p.item_type === 'task' && p.item_id);
              const byCategory: Record<string, typeof taskPositions> = {};
              for (const pos of taskPositions) {
                const task = tasks.find((t) => t.id === pos.item_id);
                if (!task) continue;
                if (!byCategory[task.category]) byCategory[task.category] = [];
                byCategory[task.category].push(pos);
              }
              const lines: React.ReactNode[] = [];
              for (const cat of Object.keys(byCategory)) {
                const cp = byCategory[cat];
                if (cp.length < 2) continue;
                cp.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
                const catColor = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || colors.accent.purple;
                for (let i = 0; i < cp.length - 1; i++) {
                  const from = cp[i]; const to = cp[i + 1];
                  // Only draw arrow if cards are within 600px of each other
                  const dist = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
                  if (dist > 600) continue;
                  const fromX = from.x + (from.width || 280) / 2;
                  const fromY = from.y + 80;
                  const toX = to.x + (to.width || 280) / 2;
                  const toY = to.y;
                  const midY = (fromY + toY) / 2;
                  lines.push(
                    <path key={`${from.id}-${to.id}`} d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`} stroke={catColor} strokeOpacity={0.2} strokeWidth={1.5} fill="none" markerEnd="url(#arrowHead)" strokeDasharray="6 4" />
                  );
                }
              }
              return lines;
            })()}
          </svg>

          {/* Manual user-drawn connections */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="userArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(124,58,237,0.5)" />
              </marker>
            </defs>
            {connections.map((conn) => {
              const from = positions.find((p) => p.id === conn.from_position_id);
              const to = positions.find((p) => p.id === conn.to_position_id);
              if (!from || !to) return null;
              const fromX = from.x + (from.width || 280) / 2;
              const fromY = from.y + 80;
              const toX = to.x + (to.width || 280) / 2;
              const toY = to.y;
              const midY = (fromY + toY) / 2;
              return (
                <path key={conn.id} d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                  stroke={conn.color || colors.accent.purple} strokeOpacity={0.5} strokeWidth={2} fill="none" markerEnd="url(#userArrow)" />
              );
            })}
            {/* Connection being drawn */}
            {connectingFrom && connectingMouse && (() => {
              const from = positions.find((p) => p.id === connectingFrom);
              if (!from) return null;
              const fromX = from.x + (from.width || 280) / 2;
              const fromY = from.y + 80;
              return (
                <line x1={fromX} y1={fromY} x2={connectingMouse.x} y2={connectingMouse.y}
                  stroke={colors.accent.purple} strokeWidth={2} strokeDasharray="6 4" strokeOpacity={0.6} />
              );
            })()}
          </svg>

          {/* Category group labels */}
          {(() => {
            const taskPositions = positions.filter((p) => p.item_type === 'task' && p.item_id);
            const byCategory: Record<string, typeof taskPositions> = {};
            for (const pos of taskPositions) {
              const task = tasks.find((t) => t.id === pos.item_id);
              if (!task) continue;
              if (!byCategory[task.category]) byCategory[task.category] = [];
              byCategory[task.category].push(pos);
            }
            return Object.entries(byCategory).map(([cat, catPositions]) => {
              if (catPositions.length === 0) return null;
              const minX = Math.min(...catPositions.map((p) => p.x));
              const minY = Math.min(...catPositions.map((p) => p.y));
              const config = CATEGORY_CONFIG[cat as TaskCategory];
              if (!config) return null;
              return (
                <div key={`label-${cat}`} style={{
                  position: 'absolute',
                  left: minX,
                  top: minY - 30,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: config.color,
                  opacity: 0.5,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  fontFamily: font.family,
                }}>
                  {config.label}
                </div>
              );
            });
          })()}

          {/* Frames — render behind everything */}
          {frames.map((frame) => (
            <CanvasFrame
              key={frame.id}
              x={frame.x}
              y={frame.y}
              width={frame.width}
              height={frame.height}
              label={frame.label}
              color={frame.color}
              selected={selectedItemId === `frame-${frame.id}` || selectedIds.has(`frame-${frame.id}`)}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedItem(`frame-${frame.id}`);
                setDragState({ id: `frame-${frame.id}`, startX: e.clientX, startY: e.clientY, origX: frame.x, origY: frame.y });
              }}
              onLabelChange={(label) => updateFrame(frame.id, { label })}
            />
          ))}

          {/* Task cards */}
          {positions.filter((p) => p.item_type === 'task' && p.item_id).map((pos) => {
            const task = tasks.find((t) => t.id === pos.item_id);
            if (!task) return null;
            const isSelected = selectedItemId === pos.id || selectedIds.has(pos.id);
            return (
              <TaskCard
                key={pos.id}
                task={task}
                members={members}
                selected={isSelected}
                connecting={connectingFrom === pos.id}
                connectTarget={!!connectingFrom && connectingFrom !== pos.id}
                style={{ left: pos.x, top: pos.y }}
                onDoubleClick={() => {
                  if (connectingFrom) return;
                  onTaskDoubleClick(task.id);
                }}
                onMouseDown={(e) => {
                  if (connectingFrom) return; // don't drag while connecting
                  handleCardMouseDown(pos.id, e);
                }}
                onClick={() => {
                  // Complete connection if in connect mode
                  if (connectingFrom && connectingFrom !== pos.id) {
                    createConnection(teamId, connectingFrom, pos.id);
                    setConnectingFrom(null);
                    setConnectingMouse(null);
                  }
                }}
                onStartConnect={() => {
                  setConnectingFrom(pos.id);
                  setConnectingMouse({ x: pos.x + 140, y: pos.y + 80 });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const cPos = screenToCanvas(e.clientX, e.clientY);
                  setContextMenu({ ...cPos, positionId: pos.id });
                }}
              />
            );
          })}

          {/* Sticky notes */}
          {positions.filter((p) => p.item_type === 'sticky').map((pos) => {
            const note = stickyNotes.find((n) => n.canvas_position_id === pos.id);
            if (!note) return null;
            return (
              <StickyNoteCard key={pos.id} note={note} position={pos} selected={selectedItemId === pos.id || selectedIds.has(pos.id)} onMouseDown={(e) => handleCardMouseDown(pos.id, e)}
                onContextMenu={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const cPos = screenToCanvas(e.clientX, e.clientY);
                  setContextMenu({ ...cPos, positionId: pos.id });
                }}
              />
            );
          })}

          {/* Selection rectangle */}
          {selRect && selRect.w > 5 && (
            <div style={{
              position: 'absolute',
              left: selRect.x,
              top: selRect.y,
              width: selRect.w,
              height: selRect.h,
              border: `1.5px dashed ${colors.accent.purple}`,
              backgroundColor: 'rgba(124,58,237,0.06)',
              borderRadius: '4px',
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Context menu */}
        {contextMenu && (() => {
          const ctxPos = contextMenu.positionId ? positions.find((p) => p.id === contextMenu.positionId) : null;
          const ctxTask = ctxPos?.item_type === 'task' && ctxPos.item_id ? tasks.find((t) => t.id === ctxPos.item_id) : null;
          const ctxIsSticky = ctxPos?.item_type === 'sticky';
          const updateTask = useTaskStore.getState().updateTask;
          const { deleteStickyNote } = useCanvasStore.getState();

          return (
            <div style={{
              position: 'fixed',
              left: contextMenu.x * zoom + panX + 260,
              top: contextMenu.y * zoom + panY,
              backgroundColor: colors.bg.surface,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              padding: '4px 0',
              zIndex: 50,
              minWidth: '180px',
            }}>
              {/* Card-specific options */}
              {ctxTask && (
                <>
                  <div style={{ padding: '6px 12px', fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</div>
                  {CATEGORIES.map((cat) => (
                    <CtxBtn key={cat} onClick={() => { updateTask(ctxTask.id, { category: cat }); setContextMenu(null); }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_CONFIG[cat].color, display: 'inline-block' }} />
                        {CATEGORY_CONFIG[cat].label}
                        {ctxTask.category === cat ? ' ✓' : ''}
                      </span>
                    </CtxBtn>
                  ))}
                  <div style={{ height: '1px', backgroundColor: colors.border.default, margin: '4px 0' }} />
                  <CtxBtn onClick={() => { handleStash(contextMenu.positionId!); setContextMenu(null); }}>Stash to Inbox</CtxBtn>
                </>
              )}
              {/* Sticky note options */}
              {ctxIsSticky && ctxPos && (
                <>
                  <CtxBtn onClick={() => {
                    const note = stickyNotes.find((n) => n.canvas_position_id === ctxPos.id);
                    if (note) deleteStickyNote(ctxPos.id, note.id);
                    setContextMenu(null);
                  }}>Delete Sticky Note</CtxBtn>
                  <CtxBtn onClick={() => { handleStash(ctxPos.id); setContextMenu(null); }}>Remove from Canvas</CtxBtn>
                </>
              )}
              {/* Canvas-level options (right-click on empty space) */}
              {!ctxPos && (
                <>
                  <CtxBtn onClick={() => { handleAddSticky('#7C3AED'); }}>Add Sticky Note</CtxBtn>
                  <CtxBtn onClick={() => { if (contextMenu) { createFrame(teamId, contextMenu.x, contextMenu.y); setContextMenu(null); } }}>Add Frame</CtxBtn>
                  {selectedIds.size > 0 && (
                    <CtxBtn onClick={() => { for (const id of selectedIds) handleStash(id); setContextMenu(null); }}>Stash Selected</CtxBtn>
                  )}
                  {positions.filter((p) => p.item_type === 'task').length > 0 && (
                    <CtxBtn onClick={() => { handleStashAll(); setContextMenu(null); }}>Stash All to Inbox</CtxBtn>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Connect mode banner */}
      {connectingFrom && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', marginLeft: '130px',
          padding: '8px 20px', backgroundColor: colors.accent.purple, color: '#fff',
          fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '8px',
          boxShadow: `0 4px 16px ${colors.accent.purple}40`, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '10px', fontFamily: font.family,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 11L11 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 3H11V7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Click a target card to connect
          <button onClick={() => { setConnectingFrom(null); setConnectingMouse(null); }} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px',
            color: '#fff', fontSize: font.size.xs, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      )}

      <CanvasToolbar onZoomToFit={() => { setPan(0, 0); setZoom(1); }} onResetView={() => { setPan(0, 0); setZoom(1); }} />

      <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: font.size.xs, color: colors.text.muted, backgroundColor: 'rgba(26,26,26,0.8)', padding: '4px 8px', borderRadius: '4px' }}>
        {Math.round(zoom * 100)}%
        {selectedIds.size > 1 && <span style={{ marginLeft: '8px', color: colors.accent.purple }}>{selectedIds.size} selected</span>}
      </div>

      {showMinimap && <Minimap positions={positions} zoom={zoom} panX={panX} panY={panY} />}
    </div>
  );
}

function CtxBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setH(true)} onMouseOut={() => setH(false)} style={{
      width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: font.size.sm,
      color: h ? colors.text.primary : colors.text.secondary,
      backgroundColor: h ? colors.bg.surfaceHover : 'transparent',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  );
}
