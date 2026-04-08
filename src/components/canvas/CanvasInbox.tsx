import { useState } from 'react';
import { StatusCircle } from '../task/StatusCircle';
import { CategoryPill } from '../task/CategoryPill';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { colors, font } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';

interface CanvasInboxProps {
  tasks: Task[];
  members: Profile[];
  teamId: string;
  onPlaceAll: () => void;
  onStashAll: () => void;
  placedCount: number;
}

export function CanvasInbox({ tasks, onPlaceAll, onStashAll, placedCount }: CanvasInboxProps) {
  const cycleStatus = useTaskStore((s) => s.cycleStatus);
  const { categories } = useCategoryStore();
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = tasks.filter((t) => {
    if (filterCat && t.category !== filterCat) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: '260px',
      backgroundColor: colors.bg.surface, borderRight: `1px solid ${colors.border.default}`,
      overflowY: 'auto', zIndex: 10, fontFamily: font.family,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border.default}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inbox</span>
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, backgroundColor: colors.bg.surfaceActive, padding: '1px 8px', borderRadius: '10px' }}>{filtered.length}{filtered.length !== tasks.length ? `/${tasks.length}` : ''}</span>
          <div style={{ flex: 1 }} />
          {tasks.length > 0 && (
            <button onClick={onPlaceAll} style={{
              padding: '3px 8px', fontSize: font.size.xs, fontWeight: font.weight.medium,
              color: colors.accent.purple, backgroundColor: colors.accent.purpleSubtle,
              border: `1px solid ${colors.accent.purple}40`, borderRadius: '6px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Place All</button>
          )}
          {placedCount > 0 && (
            <button onClick={onStashAll} style={{
              padding: '3px 8px', fontSize: font.size.xs, fontWeight: font.weight.medium,
              color: colors.text.muted, backgroundColor: 'transparent',
              border: `1px solid ${colors.border.default}`, borderRadius: '6px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Stash All</button>
          )}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{
            width: '100%', padding: '5px 8px', backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`, borderRadius: '6px',
            fontSize: font.size.xs, color: colors.text.primary, outline: 'none',
            fontFamily: 'inherit', marginBottom: '8px',
          }}
        />

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCat(filterCat === cat.key ? null : cat.key)}
              style={{
                width: '20px', height: '20px', borderRadius: '4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: filterCat === cat.key ? `${cat.color}20` : 'transparent',
                border: filterCat === cat.key ? `1.5px solid ${cat.color}` : `1px solid ${colors.border.default}`,
                cursor: 'pointer', padding: 0, transition: 'all 150ms',
              }}
              title={cat.label}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color }} />
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />
          {['todo', 'wip', 'done'].map((s) => {
            const statusColors: Record<string, string> = { todo: colors.status.todo, wip: colors.status.wip, done: colors.status.done };
            const statusLabels: Record<string, string> = { todo: 'To Do', wip: 'WIP', done: 'Done' };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                style={{
                  padding: '2px 6px', borderRadius: '4px',
                  fontSize: '10px', fontWeight: 500,
                  color: filterStatus === s ? statusColors[s] : colors.text.muted,
                  backgroundColor: filterStatus === s ? `${statusColors[s]}15` : 'transparent',
                  border: filterStatus === s ? `1px solid ${statusColors[s]}40` : `1px solid ${colors.border.default}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                title={statusLabels[s]}
              >
                {statusLabels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.length === 0 && (
            <p style={{ fontSize: font.size.sm, color: colors.text.muted, textAlign: 'center', padding: '20px 0' }}>
              {tasks.length === 0 ? (placedCount > 0 ? 'All tasks on canvas' : 'No tasks yet') : 'No matching tasks'}
            </p>
          )}
          {filtered.map((task) => (
            <InboxCard key={task.id} task={task} onDragStart={handleDragStart} onCycleStatus={cycleStatus} />
          ))}
        </div>
      </div>
    </div>
  );
}

function InboxCard({ task, onDragStart, onCycleStatus }: { task: Task; onDragStart: (e: React.DragEvent, id: string) => void; onCycleStatus: (id: string) => Promise<void> }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable onDragStart={(e) => onDragStart(e, task.id)}
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? colors.bg.surfaceHover : colors.bg.surface,
        border: `1px solid ${colors.border.default}`, borderRadius: '8px', padding: '10px 12px',
        cursor: 'grab', transition: 'background-color 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <StatusCircle status={task.status} category={task.category} size={16} onClick={() => onCycleStatus(task.id)} />
        <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary, fontWeight: font.weight.medium, lineHeight: '1.4' }}>{task.title}</span>
      </div>
      <div style={{ marginTop: '6px', marginLeft: '24px' }}><CategoryPill category={task.category} /></div>
    </div>
  );
}
