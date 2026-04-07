import { useMemo } from 'react';
import { format, isToday, isTomorrow, isPast, isThisWeek, startOfDay } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '../stores/goalStore';
import { useCategoryStore } from '../stores/categoryStore';
import { StatusCircle } from '../components/task/StatusCircle';
import { colors, font } from '../lib/theme';
import type { Task, Profile } from '../lib/types';

interface DashboardViewProps {
  profile: Profile;
  members: Profile[];
}

export function DashboardView({ profile }: DashboardViewProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const { setSelectedTask } = useTaskStore();
  const { cycleStatus } = useTaskStore();
  const goals = useGoalStore((s) => s.goals);
  const { getCategoryConfig } = useCategoryStore();
  const catConfig = getCategoryConfig();

  const myTasks = useMemo(() => tasks.filter((t) => t.assigned_to === profile.id && t.status !== 'done'), [tasks, profile.id]);
  const overdue = useMemo(() => myTasks.filter((t) => t.due_date && isPast(startOfDay(new Date(t.due_date))) && !isToday(new Date(t.due_date))), [myTasks]);
  const dueToday = useMemo(() => myTasks.filter((t) => t.due_date && isToday(new Date(t.due_date))), [myTasks]);
  const dueTomorrow = useMemo(() => myTasks.filter((t) => t.due_date && isTomorrow(new Date(t.due_date))), [myTasks]);
  const dueThisWeek = useMemo(() => myTasks.filter((t) => t.due_date && isThisWeek(new Date(t.due_date), { weekStartsOn: 1 }) && !isToday(new Date(t.due_date)) && !isTomorrow(new Date(t.due_date)) && !isPast(startOfDay(new Date(t.due_date)))), [myTasks]);
  const noDueDate = useMemo(() => myTasks.filter((t) => !t.due_date), [myTasks]);
  const needsApproval = useMemo(() => tasks.filter((t) => t.needs_approval && !t.approved_by && t.status === 'done'), [tasks]);
  const recentlyCompleted = useMemo(() => tasks.filter((t) => t.assigned_to === profile.id && t.status === 'done').slice(0, 5), [tasks, profile.id]);

  // Stats
  const totalMyTasks = myTasks.length;
  const wipCount = myTasks.filter((t) => t.status === 'wip').length;
  const completedThisWeek = tasks.filter((t) => t.assigned_to === profile.id && t.status === 'done' && t.updated_at && isThisWeek(new Date(t.updated_at), { weekStartsOn: 1 })).length;
  const activeGoals = goals.filter((g) => g.status === 'active');

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family, padding: '24px 32px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0, letterSpacing: '-0.02em' }}>
          Good {getTimeOfDay()}, {profile.display_name}
        </h1>
        <p style={{ fontSize: font.size.md, color: colors.text.muted, marginTop: '4px' }}>
          {totalMyTasks === 0 ? "You're all caught up!" : `You have ${totalMyTasks} task${totalMyTasks !== 1 ? 's' : ''} to work on`}
          {overdue.length > 0 && <span style={{ color: colors.danger }}> · {overdue.length} overdue</span>}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="My Tasks" value={totalMyTasks} accent={colors.accent.purple} />
        <StatCard label="In Progress" value={wipCount} accent={colors.status.wip} />
        <StatCard label="Done This Week" value={completedThisWeek} accent={colors.status.done} />
        <StatCard label="Active Goals" value={activeGoals.length} accent="#60A5FA" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {overdue.length > 0 && (
            <TaskSection title="Overdue" tasks={overdue} accent={colors.danger} catConfig={catConfig} onCycle={cycleStatus} onSelect={setSelectedTask} />
          )}
          {dueToday.length > 0 && (
            <TaskSection title="Due Today" tasks={dueToday} accent={colors.accent.purple} catConfig={catConfig} onCycle={cycleStatus} onSelect={setSelectedTask} />
          )}
          {dueTomorrow.length > 0 && (
            <TaskSection title="Due Tomorrow" tasks={dueTomorrow} accent={colors.status.wip} catConfig={catConfig} onCycle={cycleStatus} onSelect={setSelectedTask} />
          )}
          {dueThisWeek.length > 0 && (
            <TaskSection title="This Week" tasks={dueThisWeek} accent={colors.text.secondary} catConfig={catConfig} onCycle={cycleStatus} onSelect={setSelectedTask} />
          )}
          {noDueDate.length > 0 && (
            <TaskSection title="No Due Date" tasks={noDueDate} accent={colors.text.muted} catConfig={catConfig} onCycle={cycleStatus} onSelect={setSelectedTask} />
          )}
          {myTasks.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: colors.text.muted, backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}` }}>
              <p style={{ fontSize: font.size.lg, marginBottom: '4px' }}>No tasks assigned to you</p>
              <p style={{ fontSize: font.size.sm }}>Pick up tasks from the task list or ask your team lead</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Needs approval */}
          {needsApproval.length > 0 && (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '16px 20px' }}>
              <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.status.wip, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚑</span> Needs Approval
                <span style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.normal }}>{needsApproval.length}</span>
              </h3>
              {needsApproval.map((t) => (
                <MiniTask key={t.id} task={t} catConfig={catConfig} onClick={() => setSelectedTask(t.id)} />
              ))}
            </div>
          )}

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '16px 20px' }}>
              <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 12px' }}>Active Goals</h3>
              {activeGoals.map((g) => {
                const gc = catConfig[g.category] || { color: '#666', label: g.category };
                return (
                  <div key={g.id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>{g.title}</span>
                      <span style={{ fontSize: font.size.xs, color: gc.color, fontWeight: font.weight.medium }}>{g.progress}%</span>
                    </div>
                    <div style={{ height: '4px', backgroundColor: colors.bg.primary, borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: gc.color, borderRadius: '2px', width: `${g.progress}%`, transition: 'width 300ms' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently completed */}
          {recentlyCompleted.length > 0 && (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '16px 20px' }}>
              <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 12px' }}>Recently Completed</h3>
              {recentlyCompleted.map((t) => (
                <MiniTask key={t.id} task={t} catConfig={catConfig} onClick={() => setSelectedTask(t.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={{
      backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`,
      padding: '16px 20px', borderTop: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: '28px', fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function TaskSection({ title, tasks, accent, catConfig, onCycle, onSelect }: { title: string; tasks: Task[]; accent: string; catConfig: Record<string, { label: string; color: string }>; onCycle: (id: string) => Promise<void>; onSelect: (id: string) => void }) {
  return (
    <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${colors.border.default}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accent }} />
        <span style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary }}>{title}</span>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <div key={task.id} onClick={() => onSelect(task.id)} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px',
          cursor: 'pointer', borderBottom: `1px solid ${colors.border.subtle}`,
          transition: 'background-color 150ms',
        }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.bg.surfaceHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <StatusCircle status={task.status} category={task.category} size={18} onClick={() => onCycle(task.id)} />
          <span style={{ flex: 1, fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>{task.title}</span>
          {task.needs_approval && !task.approved_by && <span style={{ fontSize: '12px' }} title="Needs approval">⚑</span>}
          {task.due_date && (
            <span style={{ fontSize: font.size.xs, color: isPast(startOfDay(new Date(task.due_date))) && !isToday(new Date(task.due_date)) ? colors.danger : colors.text.muted }}>
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: catConfig[task.category]?.color || '#666' }} />
        </div>
      ))}
    </div>
  );
}

function MiniTask({ task, catConfig, onClick }: { task: Task; catConfig: Record<string, { label: string; color: string }>; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0',
      cursor: 'pointer', fontSize: font.size.sm,
    }}>
      <StatusCircle status={task.status} category={task.category} size={14} />
      <span style={{ flex: 1, color: task.status === 'done' ? colors.text.muted : colors.text.primary, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>{task.title}</span>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: catConfig[task.category]?.color || '#666' }} />
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
