import { useMemo, useState, useRef, useCallback } from 'react';
import { TaskRow } from '../components/task/TaskRow';
import { TaskDetailPanel } from '../components/task/TaskDetailPanel';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { useCategoryStore } from '../stores/categoryStore';
import { supabase } from '../lib/supabase';
import { colors, font } from '../lib/theme';
import type { Profile, Task } from '../lib/types';

interface ListViewProps {
  members: Profile[];
  searchQuery?: string;
}

export function ListView({ members, searchQuery = '' }: ListViewProps) {
  const { tasks, selectedTaskId, setSelectedTask, reorderTasks } = useTaskStore();
  const { categoryFilters, statusFilters, assigneeFilter, collapsedCategories, toggleCategoryCollapse } = useUIStore();
  const { categories, getCategoryConfig } = useCategoryStore();
  const catConfig = getCategoryConfig();
  const catKeys = categories.map((c) => c.key);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'due_date' | 'updated'>('default');
  const [layout, setLayout] = useState<'single' | 'multi'>(() => (localStorage.getItem('pulse-layout') as 'single' | 'multi') || 'single');
  const handleSetLayout = (l: 'single' | 'multi') => { setLayout(l); localStorage.setItem('pulse-layout', l); };
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);

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
    const grouped: Record<string, Task[]> = {};
    for (const key of catKeys) grouped[key] = [];
    for (const task of filteredTasks) {
      if (!grouped[task.category]) grouped[task.category] = [];
      grouped[task.category].push(task);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => {
        // WIP first, then todo, then done at bottom
        const statusOrder = { wip: 0, todo: 1, done: 2 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 1;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 1;
        if (aOrder !== bOrder) return aOrder - bOrder;
        if (sortBy === 'due_date') {
          if (!a.due_date && b.due_date) return 1;
          if (a.due_date && !b.due_date) return -1;
          if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
    }
    return grouped;
  }, [filteredTasks, sortBy, catKeys]);

  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkSelectAll = () => {
    if (bulkSelected.size === filteredTasks.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBulkSendToSync = useCallback(async () => {
    if (bulkSelected.size === 0) return;
    setBulkSending(true);
    const { startOfWeek: sow, format: fmt } = await import('date-fns');
    const thisWeek = fmt(sow(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const teamId = tasks[0]?.team_id;
    if (!teamId) return;

    // Get or create sync
    let { data: syncDoc } = await supabase.from('meeting_notes').select('*').eq('team_id', teamId).eq('date', thisWeek).single();
    if (!syncDoc) {
      const template = categories.map((c) => `<h2>${c.label}</h2><ul><li></li></ul>`).join('') + '<hr><p></p>';
      const { data } = await supabase.from('meeting_notes').insert({
        team_id: teamId, title: `Sync — Week of ${fmt(new Date(thisWeek), 'MMM d, yyyy')}`,
        date: thisWeek, content: template, created_by: tasks[0].created_by,
      }).select().single();
      syncDoc = data;
    }
    if (!syncDoc) { setBulkSending(false); return; }

    // Group selected tasks by category
    let content = syncDoc.content;
    const selectedTasks = tasks.filter((t) => bulkSelected.has(t.id));
    const byCategory: Record<string, string[]> = {};
    for (const t of selectedTasks) {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t.title);
    }

    for (const [catKey, titles] of Object.entries(byCategory)) {
      const catLabel = categories.find((c) => c.key === catKey)?.label || catKey;
      const bullets = titles.map((title) => `<li><strong>${title}</strong></li>`).join('');
      const sectionRegex = new RegExp(`(<h2>${catLabel}</h2>\\s*<ul>)([\\s\\S]*?)(<\\/ul>)`);
      if (content.match(sectionRegex)) {
        content = content.replace(sectionRegex, `$1$2${bullets}$3`);
      } else {
        content += `<h2>${catLabel}</h2><ul>${bullets}</ul>`;
      }
    }

    await supabase.from('meeting_notes').update({ content }).eq('id', syncDoc.id);
    setBulkSending(false);
    setBulkMode(false);
    setBulkSelected(new Set());
    alert(`${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''} added to this week's sync`);
  }, [bulkSelected, tasks, categories]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const activeCats = catKeys.filter((k) => (tasksByCategory[k]?.length || 0) > 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family }}>
      {/* Sort + layout + hide completed bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 28px', borderBottom: `1px solid ${colors.border.subtle}`, gap: '8px' }}>
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

        <div style={{ width: '1px', height: '16px', backgroundColor: colors.border.default }} />

        {/* Layout toggle */}
        <button onClick={() => handleSetLayout(layout === 'single' ? 'multi' : 'single')} style={{
          fontSize: font.size.xs, padding: '2px 8px', borderRadius: '4px',
          color: layout === 'multi' ? colors.accent.purple : colors.text.muted,
          backgroundColor: layout === 'multi' ? colors.accent.purpleSubtle : 'transparent',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            {layout === 'multi' ? (
              <><rect x="1" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" /><rect x="8" y="1" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" /></>
            ) : (
              <rect x="1" y="1" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
            )}
          </svg>
          {layout === 'multi' ? 'Columns' : 'Single'}
        </button>

        <button onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }} style={{
          fontSize: font.size.xs, padding: '2px 8px', borderRadius: '4px',
          color: bulkMode ? colors.accent.purple : colors.text.muted,
          backgroundColor: bulkMode ? colors.accent.purpleSubtle : 'transparent',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            {bulkMode && <path d="M9 10L10.5 11.5L13 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
          Select
        </button>

        <div style={{ flex: 1 }} />

        {completedCount > 0 && (
          <button onClick={() => setHideCompleted(!hideCompleted)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: font.size.xs, color: hideCompleted ? colors.accent.purple : colors.text.muted,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: '4px',
          }}>
            {hideCompleted ? `Show completed (${completedCount})` : `Hide completed (${completedCount})`}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {bulkMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 28px',
          backgroundColor: colors.accent.purpleSubtle, borderBottom: `1px solid ${colors.accent.purple}30`,
        }}>
          <button onClick={bulkSelectAll} style={{
            padding: '3px 10px', fontSize: font.size.xs, fontWeight: font.weight.medium,
            color: colors.accent.purple, backgroundColor: 'transparent',
            border: `1px solid ${colors.accent.purple}40`, borderRadius: '4px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{bulkSelected.size === filteredTasks.length ? 'Deselect All' : 'Select All'}</button>
          <span style={{ fontSize: font.size.xs, color: colors.text.secondary }}>
            {bulkSelected.size} selected
          </span>
          <div style={{ flex: 1 }} />
          {bulkSelected.size > 0 && (
            <button onClick={handleBulkSendToSync} disabled={bulkSending} style={{
              padding: '5px 14px', fontSize: font.size.xs, fontWeight: font.weight.semibold,
              color: '#fff', backgroundColor: colors.accent.purple,
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
            }}>{bulkSending ? 'Sending...' : `Send ${bulkSelected.size} to Sync`}</button>
          )}
          <button onClick={() => { setBulkMode(false); setBulkSelected(new Set()); }} style={{
            padding: '3px 8px', fontSize: font.size.xs, color: colors.text.muted,
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: colors.text.muted }}>
          <p style={{ fontSize: font.size.md }}>No tasks found</p>
          <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Create a task or adjust your filters</p>
        </div>
      ) : layout === 'multi' ? (
        /* Multi-column layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(activeCats.length, 3)}, 1fr)`,
          gap: '0',
          minHeight: 0,
        }}>
          {activeCats.map((cat) => {
            const catTasks = tasksByCategory[cat] || [];
            const config = catConfig[cat] || { label: cat, color: '#666' };
            const isCollapsed = collapsedCategories.has(cat as any);
            return (
              <div key={cat} style={{ borderRight: `1px solid ${colors.border.default}`, minWidth: 0 }}>
                <CategoryHeader
                  label={config.label}
                  color={config.color}
                  count={catTasks.length}
                  collapsed={isCollapsed}
                  onToggle={() => toggleCategoryCollapse(cat as any)}
                />
                {!isCollapsed && (
                  <ReorderableList tasks={catTasks} members={members} onReorder={(ids) => reorderTasks(cat, ids)} onSelect={(id) => bulkMode ? toggleBulkSelect(id) : setSelectedTask(id)} bulkMode={bulkMode} bulkSelected={bulkSelected} onToggleBulk={toggleBulkSelect} />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Single column layout */
        catKeys.map((cat) => {
          const catTasks = tasksByCategory[cat] || [];
          if (catTasks.length === 0) return null;
          const config = catConfig[cat] || { label: cat, color: '#666' };
          const isCollapsed = collapsedCategories.has(cat as any);
          return (
            <div key={cat}>
              <CategoryHeader
                label={config.label}
                color={config.color}
                count={catTasks.length}
                collapsed={isCollapsed}
                onToggle={() => toggleCategoryCollapse(cat as any)}
              />
              {!isCollapsed && (
                <ReorderableList tasks={catTasks} members={members} onReorder={(ids) => reorderTasks(cat, ids)} onSelect={(id) => bulkMode ? toggleBulkSelect(id) : setSelectedTask(id)} bulkMode={bulkMode} bulkSelected={bulkSelected} onToggleBulk={toggleBulkSelect} />
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

function CategoryHeader({ label, color, count, collapsed, onToggle }: { label: string; color: string; count: number; collapsed: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '14px 28px',
        backgroundColor: hovered ? colors.bg.surfaceHover : colors.bg.surfaceActive,
        border: 'none', borderBottom: `1px solid ${colors.border.default}`,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 12 12" style={{ color: colors.text.muted, transition: 'transform 150ms', transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
      <span style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em' }}>{label}</span>
      <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>{count}</span>
    </button>
  );
}

function ReorderableList({ tasks, members, onReorder, onSelect, bulkMode, bulkSelected, onToggleBulk }: { tasks: Task[]; members: Profile[]; onReorder: (ids: string[]) => void; onSelect: (id: string) => void; bulkMode?: boolean; bulkSelected?: Set<string>; onToggleBulk?: (id: string) => void }) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOverItem.current = idx; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const ids = tasks.map((t) => t.id);
    const [removed] = ids.splice(dragItem.current, 1);
    ids.splice(dragOverItem.current, 0, removed);
    onReorder(ids);
    dragItem.current = null; dragOverItem.current = null; setDragIdx(null);
  };

  return (
    <div>
      {tasks.map((task, idx) => (
        <div key={task.id} draggable={!bulkMode} onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={handleDrop} onDragEnd={() => setDragIdx(null)} style={{ opacity: dragIdx === idx ? 0.4 : 1, transition: 'opacity 150ms', display: 'flex', alignItems: 'stretch' }}>
          {bulkMode && (
            <div
              onClick={(e) => { e.stopPropagation(); onToggleBulk?.(task.id); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', flexShrink: 0, cursor: 'pointer',
                backgroundColor: bulkSelected?.has(task.id) ? colors.accent.purpleSubtle : 'transparent',
                borderBottom: `1px solid ${colors.border.subtle}`,
                transition: 'background-color 150ms',
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '4px',
                border: `2px solid ${bulkSelected?.has(task.id) ? colors.accent.purple : colors.text.muted}`,
                backgroundColor: bulkSelected?.has(task.id) ? colors.accent.purple : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms',
              }}>
                {bulkSelected?.has(task.id) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <TaskRow task={task} members={members} onClick={() => onSelect(task.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
