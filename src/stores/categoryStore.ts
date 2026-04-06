import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface TeamCategory {
  id: string;
  team_id: string;
  key: string;
  label: string;
  color: string;
  sort_order: number;
}

// Default categories that get seeded if none exist
const DEFAULTS: Omit<TeamCategory, 'id' | 'team_id'>[] = [
  { key: 'education', label: 'Education', color: '#818CF8', sort_order: 0 },
  { key: 'resources', label: 'Resources', color: '#34D399', sort_order: 1 },
  { key: 'support', label: 'Support', color: '#F472B6', sort_order: 2 },
  { key: 'admin', label: 'Admin', color: '#FB923C', sort_order: 3 },
];

interface CategoryState {
  categories: TeamCategory[];
  loading: boolean;
  fetchCategories: (teamId: string) => Promise<void>;
  addCategory: (teamId: string, label: string, color: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<TeamCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (ids: string[]) => void;
  getCategoryConfig: () => Record<string, { label: string; color: string }>;
  getCategoryKeys: () => string[];
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async (teamId) => {
    set({ loading: true });
    const { data } = await supabase.from('team_categories').select('*').eq('team_id', teamId).order('sort_order');

    if (!data || data.length === 0) {
      // Seed defaults
      const toInsert = DEFAULTS.map((d) => ({ ...d, team_id: teamId }));
      const { data: seeded } = await supabase.from('team_categories').insert(toInsert).select();
      set({ categories: seeded || [], loading: false });
    } else {
      set({ categories: data, loading: false });
    }
  },

  addCategory: async (teamId, label, color) => {
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const maxOrder = Math.max(0, ...get().categories.map((c) => c.sort_order));
    const { data } = await supabase.from('team_categories').insert({ team_id: teamId, key, label, color, sort_order: maxOrder + 1 }).select().single();
    if (data) set((s) => ({ categories: [...s.categories, data] }));
  },

  updateCategory: async (id, updates) => {
    await supabase.from('team_categories').update(updates).eq('id', id);
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
  },

  deleteCategory: async (id) => {
    await supabase.from('team_categories').delete().eq('id', id);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
  },

  reorderCategories: (ids) => {
    set((s) => {
      const reordered = ids.map((id, i) => {
        const cat = s.categories.find((c) => c.id === id);
        return cat ? { ...cat, sort_order: i } : null;
      }).filter(Boolean) as TeamCategory[];
      return { categories: reordered };
    });
    ids.forEach((id, i) => {
      supabase.from('team_categories').update({ sort_order: i }).eq('id', id).then(() => {});
    });
  },

  getCategoryConfig: () => {
    const config: Record<string, { label: string; color: string }> = {};
    for (const cat of get().categories) {
      config[cat.key] = { label: cat.label, color: cat.color };
    }
    return config;
  },

  getCategoryKeys: () => get().categories.map((c) => c.key),
}));
