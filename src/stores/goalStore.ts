import { create } from 'zustand';
import type { Goal } from '../lib/types';
import { supabase } from '../lib/supabase';

interface GoalState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: (teamId: string) => Promise<void>;
  createGoal: (goal: Partial<Goal> & { team_id: string; title: string; created_by: string }) => Promise<Goal | null>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  loading: false,

  fetchGoals: async (teamId) => {
    set({ loading: true });
    const { data } = await supabase.from('goals').select('*').eq('team_id', teamId).order('created_at', { ascending: false });
    set({ goals: data || [], loading: false });
  },

  createGoal: async (goal) => {
    const { data, error } = await supabase.from('goals').insert(goal).select().single();
    if (error) { console.error('Goal create failed:', error.message); alert(`Goal save failed: ${error.message}`); return null; }
    if (!data) return null;
    set((s) => ({ goals: [data, ...s.goals] }));
    return data;
  },

  updateGoal: async (id, updates) => {
    await supabase.from('goals').update(updates).eq('id', id);
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) }));
  },

  deleteGoal: async (id) => {
    await supabase.from('goals').delete().eq('id', id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
}));
