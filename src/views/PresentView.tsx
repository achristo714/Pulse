import { useState, useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '../stores/goalStore';
import { useCategoryStore } from '../stores/categoryStore';
import { StatusCircle } from '../components/task/StatusCircle';
import { colors, font } from '../lib/theme';
import type { Task, Profile } from '../lib/types';

interface SyncTopic {
  id: string;
  title: string;
  notes: string;
  type: string;
  image_urls: string[];
}

interface PresentViewProps {
  profile: Profile;
  members: Profile[];
  onExit: () => void;
  syncTopics?: SyncTopic[];
}

const TOPIC_COLORS: Record<string, string> = {
  update: '#7C3AED',
  metric: '#10B981',
  discussion: '#60A5FA',
  decision: '#F59E0B',
  blocker: '#EF4444',
};

export function PresentView({ members, onExit, syncTopics }: PresentViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const goals = useGoalStore((s) => s.goals);
  const { getCategoryConfig } = useCategoryStore();
  const catConfig = getCategoryConfig();
  const { cycleStatus } = useTaskStore();

  const wip = useMemo(() => tasks.filter((t) => t.status === 'wip'), [tasks]);
  const overdue = useMemo(() => tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()), [tasks]);
  const needsApproval = useMemo(() => tasks.filter((t) => t.needs_approval && !t.approved_by), [tasks]);
  const recentDone = useMemo(() => tasks.filter((t) => t.status === 'done').slice(0, 8), [tasks]);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals]);

  // Group sync topics by type
  const syncByType = useMemo(() => {
    const grouped: Record<string, SyncTopic[]> = {};
    for (const t of (syncTopics || [])) {
      if (!grouped[t.type]) grouped[t.type] = [];
      grouped[t.type].push(t);
    }
    return grouped;
  }, [syncTopics]);

  const syncSections = Object.entries(syncByType).map(([type, topics]) => ({
    id: `sync-${type}`,
    label: type.charAt(0).toUpperCase() + type.slice(1) + 's',
    topics,
    type,
  }));

  const sections = [
    { id: 'overview', label: 'Overview', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined },
    ...syncSections,
    { id: 'in-progress', label: 'In Progress', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined },
    ...(overdue.length > 0 ? [{ id: 'overdue', label: 'Overdue', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined }] : []),
    ...(needsApproval.length > 0 ? [{ id: 'approvals', label: 'Needs Review', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined }] : []),
    { id: 'completed', label: 'Recently Completed', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined },
    ...(activeGoals.length > 0 ? [{ id: 'goals', label: 'Goals', topics: undefined as SyncTopic[] | undefined, type: undefined as string | undefined }] : []),
  ];

  const [currentSection, setCurrentSection] = useState(0);
  const section = sections[currentSection];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') setCurrentSection((s) => Math.min(s + 1, sections.length - 1));
    if (e.key === 'ArrowLeft') setCurrentSection((s) => Math.max(s - 1, 0));
    if (e.key === 'Escape') onExit();
  };

  const memberMap = new Map(members.map((m) => [m.id, m.display_name]));
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;

  return (
    <div
      tabIndex={0}
      autoFocus
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: '#0A0A0A', fontFamily: font.family,
        display: 'flex', flexDirection: 'column',
        outline: 'none',
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: `1px solid ${colors.border.default}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 600, color: colors.text.primary }}>Pulse</span>
          <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>Applied Technology · Leadership Sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Section dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {sections.map((s, i) => (
              <button key={s.id} onClick={() => setCurrentSection(i)} style={{
                width: i === currentSection ? '24px' : '8px', height: '8px', borderRadius: '4px',
                backgroundColor: i === currentSection ? colors.accent.purple : colors.border.default,
                border: 'none', cursor: 'pointer', transition: 'all 200ms',
              }} />
            ))}
          </div>
          <button onClick={onExit} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: font.size.xs,
            color: colors.text.secondary, backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>Exit Present Mode</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 80px' }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>
          {/* Section title */}
          <h2 style={{ fontSize: '36px', fontWeight: 600, color: colors.text.primary, marginBottom: '32px', letterSpacing: '-0.02em' }}>
            {section.label}
          </h2>

          {section.id === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <BigStat label="Total Tasks" value={totalTasks} color={colors.text.primary} />
                <BigStat label="In Progress" value={wip.length} color={colors.status.wip} />
                <BigStat label="Completed" value={doneTasks} color={colors.status.done} />
                <BigStat label="To Do" value={todoTasks} color={colors.status.todo} />
              </div>
              {overdue.length > 0 && (
                <div style={{ padding: '16px 20px', backgroundColor: '#EF444410', borderRadius: '12px', border: '1px solid #EF444430', marginBottom: '16px' }}>
                  <span style={{ fontSize: font.size.md, color: '#EF4444', fontWeight: 600 }}>⚠ {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {activeGoals.length > 0 && (
                <div>
                  <h3 style={{ fontSize: font.size.lg, fontWeight: 600, color: colors.text.secondary, marginBottom: '12px' }}>Active Goals</h3>
                  {activeGoals.map((g) => {
                    const gc = catConfig[g.category] || { color: '#666' };
                    return (
                      <div key={g.id} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: font.size.md, color: colors.text.primary }}>{g.title}</span>
                          <span style={{ fontSize: font.size.md, color: gc.color, fontWeight: 600 }}>{g.progress}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: colors.bg.surface, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: gc.color, borderRadius: '4px', width: `${g.progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sync topics grouped by type */}
          {section.topics && section.type && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {section.topics.map((topic) => {
                const tColor = TOPIC_COLORS[topic.type] || '#7C3AED';
                return (
                  <div key={topic.id} style={{
                    padding: '16px 20px', borderRadius: '10px',
                    backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
                    borderLeft: `3px solid ${tColor}`,
                  }}>
                    <div style={{ fontSize: font.size.md, fontWeight: 600, color: colors.text.primary, marginBottom: topic.notes ? '6px' : 0 }}>
                      {topic.title || 'Untitled'}
                    </div>
                    {topic.notes && (
                      <p style={{ fontSize: font.size.sm, color: colors.text.secondary, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                        {topic.notes}
                      </p>
                    )}
                    {topic.image_urls && topic.image_urls.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {topic.image_urls.map((url, i) => (
                          <img key={i} src={url} alt="" style={{ maxHeight: '200px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, objectFit: 'contain' }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {section.id === 'in-progress' && (
            <TaskList tasks={wip} catConfig={catConfig} memberMap={memberMap} onCycle={cycleStatus} />
          )}

          {section.id === 'overdue' && (
            <TaskList tasks={overdue} catConfig={catConfig} memberMap={memberMap} onCycle={cycleStatus} accent="#EF4444" />
          )}

          {section.id === 'approvals' && (
            <TaskList tasks={needsApproval} catConfig={catConfig} memberMap={memberMap} onCycle={cycleStatus} accent={colors.status.wip} />
          )}

          {section.id === 'completed' && (
            <TaskList tasks={recentDone} catConfig={catConfig} memberMap={memberMap} onCycle={cycleStatus} />
          )}

          {section.id === 'goals' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {activeGoals.map((g) => {
                const gc = catConfig[g.category] || { color: '#666', label: g.category };
                return (
                  <div key={g.id} style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '24px', borderTop: `3px solid ${gc.color}` }}>
                    <div style={{ fontSize: font.size.lg, fontWeight: 600, color: colors.text.primary, marginBottom: '6px' }}>{g.title}</div>
                    {g.description && <p style={{ fontSize: font.size.sm, color: colors.text.secondary, marginBottom: '16px', lineHeight: 1.5 }}>{g.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>Progress</span>
                      <span style={{ fontSize: font.size.md, fontWeight: 600, color: gc.color }}>{g.progress}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: colors.bg.primary, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: gc.color, borderRadius: '4px', width: `${g.progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav hint */}
      <div style={{ padding: '12px 40px', borderTop: `1px solid ${colors.border.default}`, textAlign: 'center', fontSize: font.size.xs, color: colors.text.muted }}>
        <span style={{ color: colors.text.secondary }}>←</span> / <span style={{ color: colors.text.secondary }}>→</span> navigate · <span style={{ color: colors.text.secondary }}>Space</span> next · <span style={{ color: colors.text.secondary }}>Esc</span> exit
        <span style={{ marginLeft: '20px' }}>{currentSection + 1} / {sections.length}</span>
      </div>
    </div>
  );
}

function TaskList({ tasks, catConfig, memberMap, onCycle, accent }: { tasks: Task[]; catConfig: Record<string, { label: string; color: string }>; memberMap: Map<string, string>; onCycle: (id: string) => Promise<void>; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tasks.map((task) => {
        const cat = catConfig[task.category] || { color: '#666', label: task.category };
        const assignee = task.assigned_to ? memberMap.get(task.assigned_to) : null;
        return (
          <div key={task.id} style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '14px 20px', borderRadius: '10px',
            backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
          }}>
            <StatusCircle status={task.status} category={task.category} size={22} onClick={() => onCycle(task.id)} />
            <span style={{ flex: 1, fontSize: font.size.md, fontWeight: 500, color: accent || colors.text.primary }}>{task.title}</span>
            {assignee && <span style={{ fontSize: font.size.sm, color: colors.text.muted }}>{assignee}</span>}
            {task.due_date && (
              <span style={{ fontSize: font.size.sm, color: accent || colors.text.muted }}>
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
          </div>
        );
      })}
      {tasks.length === 0 && <p style={{ fontSize: font.size.md, color: colors.text.muted, textAlign: 'center', padding: '20px' }}>None</p>}
    </div>
  );
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '42px', fontWeight: 600, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '4px' }}>{label}</div>
    </div>
  );
}
