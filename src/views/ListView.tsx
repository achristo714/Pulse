import { useMemo, useState, useRef } from 'react';
import { TaskRow } from '../components/task/TaskRow';
import { TaskDetailPanel } from '../components/task/TaskDetailPanel';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { CATEGORIES, CATEGORY_CONFIG } from '../lib/constants';
import { colors, font } from '../lib/theme';
import type { Profile, Task, TaskCategory } from '../lib/types';

interface ListViewProps {
  members: Profile[];
  searchQuery?: string;
}

export function ListView({ members, searchQuery = '' }: ListViewProps) {
  const { tasks, selectedTaskId, setSelectedTask, reorderTasks } = useTaskStore();
  const { categoryFilters, statusFilters, assigneeFilter, collapsedCategories, toggleCategoryCollapse } = useUIStore();
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'due_date' | 'updated'>('default');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (hideCompleted && t.status === 'done') return false;
      if (categoryFilters.length > 0 && !categoryFilters.includes(t.category)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(t.status)) return false;
      if (assigneeFilter === 'unassigned' && t.assigned_to !== null) return false;
      if (assigneeFilter && assigneeFilter !== 'unassigned' && t.assigned_to !== assigneeFilter) return false;
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, categoryFilters, statusFilters, assigneeFilter, hideCompleted, searchQuery]);

  const tasksByCategory = useMemo(() => {
    const grouped: Record<TaskCategory, Task[]> = { education: [], resources: [], support: [], admin: [] };
    for (const task of filteredTasks) grouped[task.category].push(task);
    // Sort within categories
    for (const cat of CATEGORIES) {
      grouped[cat].sort((a, b) => {
        // Completed always at bottom
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        // Then by selected sort
        if (sortBy === 'due_date') {
          if (!a.due_date && b.due_date) return 1;
          if (a.due_date && !b.due_date) return -1;
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (sortBy === 'updated') {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }
    return grouped;
  }, [filteredTasks, sortBy]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const completedCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family }}>
      {/* Sort + hide completed bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 28px', borderBottom: `1px solid ${colors.border.subtle}`, gap: '8px' }}>
        {/* Sort options */}
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>Sort:</span>
        {(['default', 'due_date', 'updated'] as const).map((s) => (
          <button key={s} onClick={() => setSortBy(s)} style={{
            fontSize: font.size.xs, padding: '2px 8px', borderRadius: '4px',
            color: sortBy === s ? colors.accent.purple : colors.text.muted,
            backgroundColor: sortBy === s ? colors.accent.purpleSubtle : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {s === 'default' ? 'Manual' : s === 'due_date' ? 'Due Date' : 'Updated'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {completedCount > 0 && (
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: font.size.xs, color: hideCompleted ? colors.accent.purple : colors.text.muted,
              backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', padding: '4px 8px', borderRadius: '4px',
            }}
          >
            {hideCompleted ? `Show completed (${completedCount})` : `Hide completed (${completedCount})`}
          </button>
        )}
      </div>

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
              {!isCollapsed && (
                <ReorderableList
                  tasks={catTasks}
                  members={members}
                  onReorder={(ids) => reorderTasks(cat, ids)}
                  onSelect={(id) => setSelectedTask(id)}
                />
              )}
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
        padding: '14px 28px',
        backgroundColor: hovered ? colors.bg.surfaceHover : 'rgba(15,15,15,0.5)',
        border: 'none',
        borderBottom: `1px solid ${colors.border.default}`,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 150ms',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 12 12"
        style={{
          color: colors.text.muted,
          transition: 'transform 150ms',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
        }}
      >
        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: config.color }} />
      <span style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em' }}>
        {config.label}
      </span>
      <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>{count}</span>
    </button>
  );
}

function ReorderableList({ tasks, members, onReorder, onSelect }: {
  tasks: Task[]; members: Profile[];
  onReorder: (ids: string[]) => void; onSelect: (id: string) => void;
}) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const ids = tasks.map((t) => t.id);
    const [removed] = ids.splice(dragItem.current, 1);
    ids.splice(dragOverItem.current, 0, removed);
    onReorder(ids);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
  };

  return (
    <div>
      {tasks.map((task, idx) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={handleDrop}
          onDragEnd={() => setDragIdx(null)}
          style={{
            opacity: dragIdx === idx ? 0.4 : 1,
            transition: 'opacity 150ms',
          }}
        >
          <TaskRow task={task} members={members} onClick={() => onSelect(task.id)} />
        </div>
      ))}
    </div>
  );
}
