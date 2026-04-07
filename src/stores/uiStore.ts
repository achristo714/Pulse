import { create } from 'zustand';
import type { TaskStatus } from '../lib/types';

type ViewMode = 'dashboard' | 'list' | 'canvas' | 'calendar' | 'goals' | 'sync' | 'knowledge' | 'vault' | 'analytics';

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Filters
  categoryFilters: string[];
  statusFilters: TaskStatus[];
  assigneeFilter: string | null;
  toggleCategoryFilter: (cat: string) => void;
  toggleStatusFilter: (status: TaskStatus) => void;
  setAssigneeFilter: (id: string | null) => void;
  clearFilters: () => void;

  // Modals
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;

  // Collapsed categories
  collapsedCategories: Set<string>;
  toggleCategoryCollapse: (cat: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'dashboard',
  setViewMode: (mode) => set({ viewMode: mode }),

  categoryFilters: [],
  statusFilters: [],
  assigneeFilter: null,

  toggleCategoryFilter: (cat) =>
    set((s) => ({
      categoryFilters: s.categoryFilters.includes(cat)
        ? s.categoryFilters.filter((c) => c !== cat)
        : [...s.categoryFilters, cat],
    })),

  toggleStatusFilter: (status) =>
    set((s) => ({
      statusFilters: s.statusFilters.includes(status)
        ? s.statusFilters.filter((st) => st !== status)
        : [...s.statusFilters, status],
    })),

  setAssigneeFilter: (id) => set({ assigneeFilter: id }),

  clearFilters: () =>
    set({ categoryFilters: [], statusFilters: [], assigneeFilter: null }),

  reportModalOpen: false,
  setReportModalOpen: (open) => set({ reportModalOpen: open }),

  collapsedCategories: new Set(),
  toggleCategoryCollapse: (cat) =>
    set((s) => {
      const next = new Set(s.collapsedCategories);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { collapsedCategories: next };
    }),
}));
