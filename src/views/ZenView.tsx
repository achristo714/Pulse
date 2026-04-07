import { useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useCategoryStore } from '../stores/categoryStore';
import { StatusCircle } from '../components/task/StatusCircle';
import { colors, font } from '../lib/theme';
import type { Profile } from '../lib/types';

interface ZenViewProps {
  profile: Profile;
  onExit: () => void;
}

export function ZenView({ profile, onExit }: ZenViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const { cycleStatus } = useTaskStore();
  const { getCategoryConfig } = useCategoryStore();
  const catConfig = getCategoryConfig();

  const myWip = useMemo(() => tasks.filter((t) => t.assigned_to === profile.id && t.status === 'wip'), [tasks, profile.id]);
  const myTodo = useMemo(() => tasks.filter((t) => t.assigned_to === profile.id && t.status === 'todo').slice(0, 3), [tasks, profile.id]);

  return (
    <div
      onKeyDown={(e) => { if (e.key === 'Escape') onExit(); }}
      tabIndex={0}
      autoFocus
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: colors.bg.primary, fontFamily: font.family,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: 'none',
      }}
    >
      <div style={{ maxWidth: '600px', width: '100%', padding: '40px' }}>
        {/* Minimal header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginBottom: '8px' }}>Focus Mode</p>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: colors.text.primary, letterSpacing: '-0.02em', margin: 0 }}>
            {myWip.length === 0 ? "You're clear" : myWip.length === 1 ? "One thing at a time" : `${myWip.length} in progress`}
          </h1>
        </div>

        {/* WIP tasks — the main focus */}
        {myWip.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            {myWip.map((task) => {
              const cat = catConfig[task.category] || { color: '#666' };
              const subtasks = task.subtasks || [];
              const done = subtasks.filter((s) => s.is_done).length;
              return (
                <div key={task.id} style={{
                  padding: '24px', marginBottom: '12px',
                  backgroundColor: colors.bg.surface, borderRadius: '16px',
                  border: `1px solid ${colors.border.default}`,
                  borderLeft: `4px solid ${cat.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: subtasks.length > 0 ? '16px' : 0 }}>
                    <StatusCircle status={task.status} category={task.category} size={24} onClick={() => cycleStatus(task.id)} />
                    <span style={{ fontSize: '18px', fontWeight: 600, color: colors.text.primary }}>{task.title}</span>
                  </div>
                  {subtasks.length > 0 && (
                    <div style={{ marginLeft: '36px' }}>
                      <div style={{ height: '4px', backgroundColor: colors.bg.primary, borderRadius: '2px', marginBottom: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: cat.color, borderRadius: '2px', width: `${subtasks.length > 0 ? (done / subtasks.length) * 100 : 0}%`, transition: 'width 300ms' }} />
                      </div>
                      {subtasks.map((st) => (
                        <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', fontSize: font.size.sm }}>
                          <StatusCircle status={st.is_done ? 'done' : 'todo'} category={task.category} size={14} />
                          <span style={{ color: st.is_done ? colors.text.muted : colors.text.primary, textDecoration: st.is_done ? 'line-through' : 'none' }}>{st.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Up next — subtle */}
        {myTodo.length > 0 && (
          <div>
            <p style={{ fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Up Next</p>
            {myTodo.map((task) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', opacity: 0.5 }}>
                <StatusCircle status={task.status} category={task.category} size={16} onClick={() => cycleStatus(task.id)} />
                <span style={{ fontSize: font.size.sm, color: colors.text.secondary }}>{task.title}</span>
              </div>
            ))}
          </div>
        )}

        {myWip.length === 0 && myTodo.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.text.muted }}>
            <p style={{ fontSize: font.size.lg }}>No tasks assigned to you</p>
            <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Pick up some tasks and come back</p>
          </div>
        )}

        {/* Exit hint */}
        <div style={{ textAlign: 'center', marginTop: '48px', fontSize: font.size.xs, color: colors.text.muted }}>
          Press <span style={{ color: colors.text.secondary }}>Esc</span> to exit focus mode
        </div>
      </div>

      <button onClick={onExit} style={{
        position: 'fixed', top: '16px', right: '16px',
        padding: '6px 14px', borderRadius: '6px', fontSize: font.size.xs,
        color: colors.text.secondary, backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit',
      }}>Exit Focus</button>
    </div>
  );
}
