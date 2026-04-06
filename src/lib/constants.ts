import type { TaskCategory, TaskStatus, StickyColor } from './types';

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; next: TaskStatus }> = {
  todo: { label: 'To Do', color: 'var(--color-status-todo)', next: 'wip' },
  wip: { label: 'In Progress', color: 'var(--color-status-wip)', next: 'done' },
  done: { label: 'Done', color: 'var(--color-status-done)', next: 'todo' },
};

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  education: { label: 'Education', color: 'var(--color-cat-education)' },
  resources: { label: 'Resources', color: 'var(--color-cat-resources)' },
  support: { label: 'Support', color: 'var(--color-cat-support)' },
  admin: { label: 'Admin', color: 'var(--color-cat-admin)' },
};

export const CATEGORIES: TaskCategory[] = ['education', 'resources', 'support', 'admin'];
export const STATUSES: TaskStatus[] = ['todo', 'wip', 'done'];

export const STICKY_COLORS: { label: string; value: StickyColor }[] = [
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Pink', value: '#F472B6' },
  { label: 'Slate', value: '#6B7280' },
];

export const CANVAS_GRID_SIZE = 20;
export const CANVAS_MIN_ZOOM = 0.25;
export const CANVAS_MAX_ZOOM = 4;
export const DEFAULT_CARD_WIDTH = 280;
