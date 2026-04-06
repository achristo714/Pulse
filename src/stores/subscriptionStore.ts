import { create } from 'zustand';
import type { Subscription } from '../lib/types';
import { supabase } from '../lib/supabase';

interface SubscriptionState {
  subscriptions: Subscription[];
  loading: boolean;
  fetchSubscriptions: (teamId: string) => Promise<void>;
  createSubscription: (sub: Partial<Subscription> & { team_id: string; name: string; created_by: string }) => Promise<Subscription | null>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscriptions: [],
  loading: false,

  fetchSubscriptions: async (teamId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('team_id', teamId)
      .order('name');
    set({ subscriptions: data || [], loading: false });
  },

  createSubscription: async (sub) => {
    const { data, error } = await supabase.from('subscriptions').insert(sub).select().single();
    if (error || !data) return null;
    set((s) => ({ subscriptions: [...s.subscriptions, data] }));
    return data;
  },

  updateSubscription: async (id, updates) => {
    await supabase.from('subscriptions').update(updates).eq('id', id);
    set((s) => ({
      subscriptions: s.subscriptions.map((sub) => (sub.id === id ? { ...sub, ...updates } : sub)),
    }));
  },

  deleteSubscription: async (id) => {
    await supabase.from('subscriptions').delete().eq('id', id);
    set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) }));
  },
}));
