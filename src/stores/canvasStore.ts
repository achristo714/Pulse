import { create } from 'zustand';
import type { CanvasPosition, StickyNote, StickyColor } from '../lib/types';
import { supabase } from '../lib/supabase';
import { CANVAS_GRID_SIZE } from '../lib/constants';

interface CanvasConnection {
  id: string;
  team_id: string;
  from_position_id: string;
  to_position_id: string;
  color: string;
  label: string | null;
}

interface CanvasState {
  positions: CanvasPosition[];
  stickyNotes: StickyNote[];
  connections: CanvasConnection[];
  zoom: number;
  panX: number;
  panY: number;
  selectedItemId: string | null;
  loading: boolean;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setSelectedItem: (id: string | null) => void;

  fetchCanvasData: (teamId: string) => Promise<void>;

  // Connections
  createConnection: (teamId: string, fromId: string, toId: string, color?: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;

  // Positions
  updatePosition: (id: string, updates: Partial<CanvasPosition>) => Promise<void>;
  createTaskPosition: (teamId: string, taskId: string, x?: number, y?: number) => Promise<CanvasPosition | null>;
  deletePosition: (id: string) => Promise<void>;

  // Sticky notes
  createStickyNote: (teamId: string, createdBy: string, x: number, y: number, color?: StickyColor) => Promise<void>;
  updateStickyNote: (id: string, updates: Partial<StickyNote>) => Promise<void>;
  deleteStickyNote: (positionId: string, noteId: string) => Promise<void>;

  // Snapping
  snapToGrid: (x: number, y: number) => { x: number; y: number };

  // Realtime
  applyRealtimePosition: (payload: { eventType: string; new: CanvasPosition; old: { id: string } }) => void;
  applyRealtimeStickyNote: (payload: { eventType: string; new: StickyNote; old: { id: string } }) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  positions: [],
  stickyNotes: [],
  connections: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedItemId: null,
  loading: false,

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setSelectedItem: (id) => set({ selectedItemId: id }),

  createConnection: async (teamId, fromId, toId, color = '#7C3AED') => {
    const { data, error } = await supabase.from('canvas_connections').insert({ team_id: teamId, from_position_id: fromId, to_position_id: toId, color }).select().single();
    if (error) { console.error('Connection create failed:', error.message); alert(`Connection failed: ${error.message}`); return; }
    if (data) set((s) => ({ connections: [...s.connections, data] }));
  },

  deleteConnection: async (id) => {
    await supabase.from('canvas_connections').delete().eq('id', id);
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
  },

  fetchCanvasData: async (teamId) => {
    set({ loading: true });
    const [posRes, stickyRes, connRes] = await Promise.all([
      supabase.from('canvas_positions').select('*').eq('team_id', teamId),
      supabase.from('sticky_notes').select('*').eq('team_id', teamId),
      supabase.from('canvas_connections').select('*').eq('team_id', teamId),
    ]);
    set({
      positions: posRes.data || [],
      stickyNotes: stickyRes.data || [],
      connections: connRes.data || [],
      loading: false,
    });
  },

  updatePosition: async (id, updates) => {
    set((s) => ({
      positions: s.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    await supabase.from('canvas_positions').update(updates).eq('id', id);
  },

  createTaskPosition: async (teamId, taskId, x = 40, y = 0) => {
    const inboxPositions = get().positions.filter(
      (p) => p.item_type === 'task' && p.x < 300
    );
    const nextY = inboxPositions.length > 0
      ? Math.max(...inboxPositions.map((p) => p.y)) + 160
      : 40;

    const { data, error } = await supabase
      .from('canvas_positions')
      .insert({
        team_id: teamId,
        item_type: 'task',
        item_id: taskId,
        x,
        y: y || nextY,
        width: 280,
        z_index: 0,
      })
      .select()
      .single();

    if (error || !data) return null;
    set((s) => ({ positions: [...s.positions, data] }));
    return data;
  },

  deletePosition: async (id) => {
    await supabase.from('canvas_positions').delete().eq('id', id);
    set((s) => ({ positions: s.positions.filter((p) => p.id !== id) }));
  },

  createStickyNote: async (teamId, createdBy, x, y, color = '#7C3AED') => {
    const { data: pos } = await supabase
      .from('canvas_positions')
      .insert({
        team_id: teamId,
        item_type: 'sticky',
        x,
        y,
        width: 200,
        height: 200,
        z_index: 1,
      })
      .select()
      .single();

    if (!pos) return;

    const { data: note } = await supabase
      .from('sticky_notes')
      .insert({
        canvas_position_id: pos.id,
        team_id: teamId,
        content: '',
        color,
        created_by: createdBy,
      })
      .select()
      .single();

    if (note) {
      set((s) => ({
        positions: [...s.positions, pos],
        stickyNotes: [...s.stickyNotes, note],
      }));
    }
  },

  updateStickyNote: async (id, updates) => {
    set((s) => ({
      stickyNotes: s.stickyNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
    await supabase.from('sticky_notes').update(updates).eq('id', id);
  },

  deleteStickyNote: async (positionId, noteId) => {
    await supabase.from('sticky_notes').delete().eq('id', noteId);
    await supabase.from('canvas_positions').delete().eq('id', positionId);
    set((s) => ({
      stickyNotes: s.stickyNotes.filter((n) => n.id !== noteId),
      positions: s.positions.filter((p) => p.id !== positionId),
    }));
  },

  snapToGrid: (x, y) => ({
    x: Math.round(x / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE,
    y: Math.round(y / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE,
  }),

  applyRealtimePosition: (payload) => {
    const { eventType } = payload;
    if (eventType === 'INSERT') {
      set((s) => {
        if (s.positions.find((p) => p.id === payload.new.id)) return s;
        return { positions: [...s.positions, payload.new] };
      });
    } else if (eventType === 'UPDATE') {
      set((s) => ({
        positions: s.positions.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)),
      }));
    } else if (eventType === 'DELETE') {
      set((s) => ({ positions: s.positions.filter((p) => p.id !== payload.old.id) }));
    }
  },

  applyRealtimeStickyNote: (payload) => {
    const { eventType } = payload;
    if (eventType === 'INSERT') {
      set((s) => {
        if (s.stickyNotes.find((n) => n.id === payload.new.id)) return s;
        return { stickyNotes: [...s.stickyNotes, payload.new] };
      });
    } else if (eventType === 'UPDATE') {
      set((s) => ({
        stickyNotes: s.stickyNotes.map((n) => (n.id === payload.new.id ? { ...n, ...payload.new } : n)),
      }));
    } else if (eventType === 'DELETE') {
      set((s) => ({ stickyNotes: s.stickyNotes.filter((n) => n.id !== payload.old.id) }));
    }
  },
}));
