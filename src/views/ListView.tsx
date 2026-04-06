import { useMemo } from 'react';
import { TaskRow } from '../components/task/TaskRow';
import { TaskDetailPanel } from '../components/task/TaskDetailPanel';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { CATEGORIES, CATEGORY_CONFIG } from '../lib/constants';
import type { Profile, Task, TaskCategory } from '../lib/types';

interface ListViewProps {
  members: Profile[];
}

export function ListView({ members }: ListViewProps) {
  const { tasks, selectedTaskId, setSelectedTask } = useTaskStore();
  const { categoryFilters, statusFilters, assigneeFilter, collapsedCategories, toggleCategoryCollapse } = useUIStore();

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilters.length > 0 && !categoryFilters.includes(t.category)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(t.status)) return false;
      if (assigneeFilter === 'unassigned' && t.assigned_to !== null) return false;
      if (assigneeFilter && assigneeFilter !== 'unassigned' && t.assigned_to !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, categoryFilters, statusFilters, assigneeFilter]);

  const tasksByCategory = useMemo(() => {
    const grouped: Record<TaskCategory, Task[]> = {
      education: [],
      resources: [],
      support: [],
      admin: [],
    };
    for (const task of filteredTasks) {
      grouped[task.category].push(task);
    }
    return grouped;
  }, [filteredTasks]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div className="flex-1 overflow-y-auto">
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-text-muted">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-3 opacity-30">
            <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 20H32M16 26H28M16 32H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-[14px]">No tasks found</p>
          <p className="text-[12px] mt-1">Create a task or adjust your filters</p>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const catTasks = tasksByCategory[cat];
          if (catTasks.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategoryCollapse(cat)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-bg-primary/50 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  className={`text-text-muted transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                >
                  <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                />
                <span className="text-[13px] font-semibold text-text-primary tracking-[-0.01em]">
                  {CATEGORY_CONFIG[cat].label}
                </span>
                <span className="text-[11px] text-text-muted">{catTasks.length}</span>
              </button>

              {!isCollapsed && (
                <div>
                  {catTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      members={members}
                      onClick={() => setSelectedTask(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
