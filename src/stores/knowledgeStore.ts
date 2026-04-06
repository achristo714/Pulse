import { create } from 'zustand';
import type { KnowledgeArticle } from '../lib/types';
import { supabase } from '../lib/supabase';

interface KnowledgeState {
  articles: KnowledgeArticle[];
  loading: boolean;
  fetchArticles: (teamId: string) => Promise<void>;
  createArticle: (article: Partial<KnowledgeArticle> & { team_id: string; title: string; created_by: string }) => Promise<KnowledgeArticle | null>;
  updateArticle: (id: string, updates: Partial<KnowledgeArticle>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  articles: [],
  loading: false,

  fetchArticles: async (teamId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('knowledge_articles')
      .select('*')
      .eq('team_id', teamId)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    set({ articles: data || [], loading: false });
  },

  createArticle: async (article) => {
    const { data, error } = await supabase.from('knowledge_articles').insert(article).select().single();
    if (error || !data) return null;
    set((s) => ({ articles: [data, ...s.articles] }));
    return data;
  },

  updateArticle: async (id, updates) => {
    await supabase.from('knowledge_articles').update(updates).eq('id', id);
    set((s) => ({ articles: s.articles.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
  },

  deleteArticle: async (id) => {
    await supabase.from('knowledge_articles').delete().eq('id', id);
    set((s) => ({ articles: s.articles.filter((a) => a.id !== id) }));
  },
}));
