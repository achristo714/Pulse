import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, isWithinInterval } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { useCategoryStore } from '../stores/categoryStore';
import { colors, font } from '../lib/theme';

export function AnalyticsView() {
  const tasks = useTaskStore((s) => s.tasks);
  const { categories } = useCategoryStore();

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Core metrics
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const wip = tasks.filter((t) => t.status === 'wip').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter((t) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date(now.toDateString())).length;

  // Completed this week
  const completedThisWeek = tasks.filter((t) => t.status === 'done' && t.updated_at && isWithinInterval(new Date(t.updated_at), { start: thisWeekStart, end: thisWeekEnd })).length;

  // By category
  const byCategory = useMemo(() => {
    const map: Record<string, { total: number; done: number; wip: number; todo: number }> = {};
    for (const cat of categories) {
      const catTasks = tasks.filter((t) => t.category === cat.key);
      map[cat.key] = {
        total: catTasks.length,
        done: catTasks.filter((t) => t.status === 'done').length,
        wip: catTasks.filter((t) => t.status === 'wip').length,
        todo: catTasks.filter((t) => t.status === 'todo').length,
      };
    }
    return map;
  }, [tasks, categories]);

  // Weekly completion trend (last 6 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const we = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const count = tasks.filter((t) => t.status === 'done' && t.updated_at && isWithinInterval(new Date(t.updated_at), { start: ws, end: we })).length;
      weeks.push({ label: format(ws, 'MMM d'), count });
    }
    return weeks;
  }, [tasks, now]);

  const maxWeekly = Math.max(1, ...weeklyTrend.map((w) => w.count));

  // Daily activity this week
  const dailyActivity = useMemo(() => {
    const days = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });
    return days.map((d) => {
      const dayStr = format(d, 'yyyy-MM-dd');
      const created = tasks.filter((t) => t.created_at.startsWith(dayStr)).length;
      const completed = tasks.filter((t) => t.status === 'done' && t.updated_at?.startsWith(dayStr)).length;
      return { label: format(d, 'EEE'), created, completed };
    });
  }, [tasks, thisWeekStart, thisWeekEnd]);

  const maxDaily = Math.max(1, ...dailyActivity.flatMap((d) => [d.created, d.completed]));

  // Time tracking summary
  const totalEstimated = tasks.reduce((acc, t) => acc + (t.time_estimate_hours || 0), 0);
  const totalActual = tasks.reduce((acc, t) => acc + (t.time_actual_hours || 0), 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family, padding: '24px 32px' }}>
      <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 24px' }}>Analytics</h2>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '28px' }}>
        <StatBox label="Total Tasks" value={total} color={colors.text.primary} />
        <StatBox label="To Do" value={todo} color={colors.status.todo} />
        <StatBox label="In Progress" value={wip} color={colors.status.wip} />
        <StatBox label="Done" value={done} color={colors.status.done} />
        <StatBox label="Overdue" value={overdue} color={colors.danger} />
        <StatBox label="Done This Week" value={completedThisWeek} color={colors.accent.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Weekly completion trend */}
        <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '20px' }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 16px' }}>Weekly Completions</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {weeklyTrend.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: colors.text.muted }}>{w.count}</span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  backgroundColor: i === weeklyTrend.length - 1 ? colors.accent.purple : colors.accent.purple + '40',
                  height: `${(w.count / maxWeekly) * 100}px`,
                  minHeight: w.count > 0 ? '4px' : '0',
                  transition: 'height 300ms',
                }} />
                <span style={{ fontSize: '10px', color: colors.text.muted }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily activity */}
        <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '20px' }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 16px' }}>This Week's Activity</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
            {dailyActivity.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100px', width: '100%' }}>
                  <div style={{ flex: 1, borderRadius: '3px 3px 0 0', backgroundColor: '#60A5FA40', height: `${(d.created / maxDaily) * 100}px`, minHeight: d.created > 0 ? '3px' : '0' }} />
                  <div style={{ flex: 1, borderRadius: '3px 3px 0 0', backgroundColor: colors.status.done + '60', height: `${(d.completed / maxDaily) * 100}px`, minHeight: d.completed > 0 ? '3px' : '0' }} />
                </div>
                <span style={{ fontSize: '10px', color: colors.text.muted }}>{d.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: colors.text.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#60A5FA40' }} /> Created</span>
            <span style={{ fontSize: '10px', color: colors.text.muted, display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: colors.status.done + '60' }} /> Completed</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* By category */}
        <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '20px' }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 16px' }}>By Category</h3>
          {categories.map((cat) => {
            const data = byCategory[cat.key];
            if (!data || data.total === 0) return null;
            const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
            return (
              <div key={cat.key} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.label}
                  </span>
                  <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{data.done}/{data.total} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', backgroundColor: colors.bg.primary, borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', backgroundColor: cat.color, width: `${pct}%`, transition: 'width 300ms' }} />
                  <div style={{ height: '100%', backgroundColor: cat.color + '30', width: `${data.total > 0 ? (data.wip / data.total) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Time tracking */}
        <div style={{ backgroundColor: colors.bg.surface, borderRadius: '12px', border: `1px solid ${colors.border.default}`, padding: '20px' }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: '0 0 16px' }}>Time Tracking</h3>
          {totalEstimated > 0 || totalActual > 0 ? (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: font.weight.semibold, color: colors.accent.purple }}>{totalEstimated.toFixed(1)}h</div>
                  <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>Estimated</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: font.weight.semibold, color: totalActual > totalEstimated ? colors.danger : colors.status.done }}>{totalActual.toFixed(1)}h</div>
                  <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>Actual</div>
                </div>
                {totalEstimated > 0 && (
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: font.weight.semibold, color: colors.text.secondary }}>{Math.round((totalActual / totalEstimated) * 100)}%</div>
                    <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>Accuracy</div>
                  </div>
                )}
              </div>
              <div style={{ height: '8px', backgroundColor: colors.bg.primary, borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', backgroundColor: colors.accent.purple, width: `${Math.min(100, totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0)}%`, borderRadius: '4px' }} />
              </div>
            </div>
          ) : (
            <p style={{ color: colors.text.muted, fontSize: font.size.sm }}>Add time estimates and actuals to tasks to see tracking data</p>
          )}

          {/* Status breakdown donut-style */}
          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.secondary, margin: '0 0 12px' }}>Status Breakdown</h4>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { label: 'To Do', value: todo, color: colors.status.todo },
                { label: 'WIP', value: wip, color: colors.status.wip },
                { label: 'Done', value: done, color: colors.status.done },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: font.weight.semibold, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: colors.text.muted }}>{s.label}</div>
                  <div style={{ height: '3px', backgroundColor: s.color, borderRadius: '2px', marginTop: '4px', opacity: 0.6 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      backgroundColor: colors.bg.surface, borderRadius: '10px', border: `1px solid ${colors.border.default}`,
      padding: '14px 16px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '24px', fontWeight: font.weight.semibold, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '10px', color: colors.text.muted, marginTop: '2px' }}>{label}</div>
    </div>
  );
}
