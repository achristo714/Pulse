import { useMemo, useState } from 'react';
import { TaskRow } from '../components/task/TaskRow';
import { TaskDetailPanel } from '../components/task/TaskDetailPanel';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { CATEGORIES, CATEGORY_CONFIG } from '../lib/constants';
import { colors, font } from '../lib/theme';
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
    const grouped: Record<TaskCategory, Task[]> = { education: [], resources: [], support: [], admin: [] };
    for (const task of filteredTasks) grouped[task.category].push(task);
    return grouped;
  }, [filteredTasks]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family }}>
      {filteredTasks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: colors.text.muted }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: '12px', opacity: 0.3 }}>
            <rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M16 20H32M16 26H28M16 32H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: font.size.md }}>No tasks found</p>
          <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Create a task or adjust your filters</p>
        </div>
      ) : (
        CATEGORIES.map((cat) => {
          const catTasks = tasksByCategory[cat];
          if (catTasks.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat);

          return (
            <div key={cat}>
              <CategoryHeader
                category={cat}
                count={catTasks.length}
                collapsed={isCollapsed}
                onToggle={() => toggleCategoryCollapse(cat)}
              />
              {!isCollapsed && catTasks.map((task) => (
                <TaskRow key={task.id} task={task} members={members} onClick={() => setSelectedTask(task.id)} />
              ))}
            </div>
          );
        })
      )}

      {selectedTask && (
        <TaskDetailPanel task={selectedTask} members={members} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

function CategoryHeader({ category, count, collapsed, onToggle }: { category: TaskCategory; count: number; collapsed: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  const config = CATEGORY_CONFIG[category];

  return (
    <button
      onClick={onToggle}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: hovered ? colors.bg.surfaceHover : 'rgba(15,15,15,0.5)',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 150ms',
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        style={{
          color: colors.text.muted,
          transition: 'transform 150ms',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
        }}
      >
        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }} />
      <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em' }}>
        {config.label}
      </span>
      <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{count}</span>
    </button>
  );
}
