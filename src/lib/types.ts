export type TaskStatus = 'todo' | 'wip' | 'done';
export type TaskCategory = 'education' | 'resources' | 'support' | 'admin';
export type UserRole = 'admin' | 'member';
export type CanvasItemType = 'task' | 'sticky';
export type StickyColor = '#7C3AED' | '#F59E0B' | '#10B981' | '#F472B6' | '#6B7280';
export type SubscriptionCategory = 'design' | 'engineering' | 'productivity' | 'cloud' | 'ai' | 'communication' | 'other';

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  team_id: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
}

export interface Task {
  id: string;
  team_id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  category: TaskCategory;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  due_date: string | null;
  sort_order: number;
  subtasks?: Subtask[];
  images?: TaskImage[];
  assigned_profile?: Profile | null;
  created_profile?: Profile | null;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
}

export interface TaskImage {
  id: string;
  task_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface CanvasPosition {
  id: string;
  team_id: string;
  item_type: CanvasItemType;
  item_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number | null;
  z_index: number;
}

export interface StickyNote {
  id: string;
  canvas_position_id: string;
  team_id: string;
  content: string;
  color: StickyColor;
  created_by: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  team_id: string;
  name: string;
  url: string | null;
  username: string | null;
  password: string | null;
  notes: string | null;
  category: SubscriptionCategory;
  cost: number | null;
  billing_cycle: 'monthly' | 'yearly' | 'one-time';
  renewal_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportData {
  start_date: string;
  end_date: string;
  tasks_by_category: Record<TaskCategory, Task[]>;
  total_completed: number;
  by_member: Record<string, number>;
  in_progress_count: number;
  remaining_subtasks: number;
}
