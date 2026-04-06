import { create } from 'zustand';
import type { Task, Subtask, TaskImage, TaskStatus, TaskCategory } from '../lib/types';
import { supabase } from '../lib/supabase';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTaskId: string | null;

  fetchTasks: (teamId: string) => Promise<void>;
  createTask: (task: Partial<Task> & { team_id: string; created_by: string; title: string }) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  cycleStatus: (id: string) => Promise<void>;
  setSelectedTask: (id: string | null) => void;

  // Subtasks
  fetchSubtasks: (taskId: string) => Promise<Subtask[]>;
  createSubtask: (taskId: string, title: string) => Promise<Subtask | null>;
  updateSubtask: (id: string, updates: Partial<Subtask>) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => Promise<void>;

  // Images
  uploadImage: (taskId: string, file: File) => Promise<TaskImage | null>;
  deleteImage: (id: string, storagePath: string) => Promise<void>;

  // Realtime
  applyRealtimeTask: (payload: { eventType: string; new: Task; old: { id: string } }) => void;
  applyRealtimeSubtask: (payload: { eventType: string; new: Subtask; old: { id: string } }) => void;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'wip',
  wip: 'done',
  done: 'todo',
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  selectedTaskId: null,

  fetchTasks: async (teamId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*),
        task_images (*),
        assigned_profile:profiles!tasks_assigned_to_fkey (*),
        created_profile:profiles!tasks_created_by_fkey (*)
      `)
      .eq('team_id', teamId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ tasks: data || [], loading: false });
  },

  createTask: async (task) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select(`
        *,
        subtasks (*),
        task_images (*),
        assigned_profile:profiles!tasks_assigned_to_fkey (*),
        created_profile:profiles!tasks_created_by_fkey (*)
      `)
      .single();

    if (error || !data) return null;
    set((s) => ({ tasks: [data, ...s.tasks] }));
    return data;
  },

  updateTask: async (id, updates) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) return;
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return;
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));
  },

  cycleStatus: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = STATUS_CYCLE[task.status];
    await get().updateTask(id, { status: newStatus });
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  // Subtasks
  fetchSubtasks: async (taskId) => {
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order');
    return data || [];
  },

  createSubtask: async (taskId, title) => {
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title })
      .select()
      .single();

    if (error || !data) return null;

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), data] } : t
      ),
    }));
    return data;
  },

  updateSubtask: async (id, updates) => {
    const { error } = await supabase.from('subtasks').update(updates).eq('id', id);
    if (error) return;
    set((s) => ({
      tasks: s.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks?.map((st) => (st.id === id ? { ...st, ...updates } : st)),
      })),
    }));
  },

  deleteSubtask: async (id) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', id);
    if (error) return;
    set((s) => ({
      tasks: s.tasks.map((t) => ({
        ...t,
        subtasks: t.subtasks?.filter((st) => st.id !== id),
      })),
    }));
  },

  reorderSubtasks: async (taskId, subtaskIds) => {
    const updates = subtaskIds.map((id, i) => ({ id, sort_order: i }));
    for (const u of updates) {
      await supabase.from('subtasks').update({ sort_order: u.sort_order }).eq('id', u.id);
    }
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const sorted = [...(t.subtasks || [])].sort(
          (a, b) => subtaskIds.indexOf(a.id) - subtaskIds.indexOf(b.id)
        );
        return { ...t, subtasks: sorted };
      }),
    }));
  },

  // Images
  uploadImage: async (taskId, file) => {
    const path = `task-images/${taskId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('task-images').upload(path, file);
    if (uploadError) return null;

    const { data, error } = await supabase
      .from('task_images')
      .insert({ task_id: taskId, storage_path: path })
      .select()
      .single();

    if (error || !data) return null;
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, images: [...(t.images || []), data] } : t
      ),
    }));
    return data;
  },

  deleteImage: async (id, storagePath) => {
    await supabase.storage.from('task-images').remove([storagePath]);
    await supabase.from('task_images').delete().eq('id', id);
    set((s) => ({
      tasks: s.tasks.map((t) => ({
        ...t,
        images: t.images?.filter((img) => img.id !== id),
      })),
    }));
  },

  // Realtime
  applyRealtimeTask: (payload) => {
    const { eventType } = payload;
    if (eventType === 'INSERT') {
      set((s) => {
        if (s.tasks.find((t) => t.id === payload.new.id)) return s;
        return { tasks: [payload.new, ...s.tasks] };
      });
    } else if (eventType === 'UPDATE') {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t)),
      }));
    } else if (eventType === 'DELETE') {
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== payload.old.id),
      }));
    }
  },

  applyRealtimeSubtask: (payload) => {
    const { eventType } = payload;
    if (eventType === 'INSERT') {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === payload.new.task_id
            ? { ...t, subtasks: [...(t.subtasks || []), payload.new] }
            : t
        ),
      }));
    } else if (eventType === 'UPDATE') {
      set((s) => ({
        tasks: s.tasks.map((t) => ({
          ...t,
          subtasks: t.subtasks?.map((st) => (st.id === payload.new.id ? { ...st, ...payload.new } : st)),
        })),
      }));
    } else if (eventType === 'DELETE') {
      set((s) => ({
        tasks: s.tasks.map((t) => ({
          ...t,
          subtasks: t.subtasks?.filter((st) => st.id !== payload.old.id),
        })),
      }));
    }
  },
}));
