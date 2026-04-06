import { create } from 'zustand';
import type { TaskCategory, TaskStatus } from '../lib/types';

type ViewMode = 'list' | 'canvas' | 'calendar' | 'goals' | 'knowledge' | 'vault';

interface UIState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Filters
  categoryFilters: TaskCategory[];
  statusFilters: TaskStatus[];
  assigneeFilter: string | null; // profile id or 'unassigned'
  toggleCategoryFilter: (cat: TaskCategory) => void;
  toggleStatusFilter: (status: TaskStatus) => void;
  setAssigneeFilter: (id: string | null) => void;
  clearFilters: () => void;

  // Modals
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;

  // Collapsed categories
  collapsedCategories: Set<TaskCategory>;
  toggleCategoryCollapse: (cat: TaskCategory) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'list',
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
