import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { useTaskStore } from '../stores/taskStore';
import { StatusCircle } from '../components/task/StatusCircle';
import { CATEGORY_CONFIG } from '../lib/constants';
import { colors, font } from '../lib/theme';
import type { Task } from '../lib/types';

export function CalendarView() {
  const tasks = useTaskStore((s) => s.tasks);
  const { setSelectedTask } = useTaskStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!task.due_date) continue;
      const key = task.due_date; // yyyy-mm-dd
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const undated = tasks.filter((t) => !t.due_date && t.status !== 'done');

  return (
    <div style={{ flex: 1, overflow: 'auto', fontFamily: font.family, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <NavBtn onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</NavBtn>
          <NavBtn onClick={() => setCurrentMonth(new Date())}>Today</NavBtn>
          <NavBtn onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</NavBtn>
        </div>
        {undated.length > 0 && (
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginLeft: 'auto' }}>
            {undated.length} tasks without dates
          </span>
        )}
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} style={{
            padding: '8px 12px', fontSize: font.size.xs, fontWeight: font.weight.medium,
            color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em',
            textAlign: 'center',
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: colors.border.subtle }}>
        {weeks.flat().map((date, i) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const inMonth = isSameMonth(date, currentMonth);
          const today = isToday(date);

          return (
            <div key={i} style={{
              minHeight: '100px', padding: '6px 8px',
              backgroundColor: today ? 'rgba(124,58,237,0.05)' : colors.bg.surface,
              opacity: inMonth ? 1 : 0.4,
            }}>
              <div style={{
                fontSize: font.size.xs, fontWeight: today ? font.weight.semibold : font.weight.normal,
                color: today ? colors.accent.purple : colors.text.secondary,
                marginBottom: '4px', textAlign: 'right',
                width: today ? '22px' : 'auto',
                height: today ? '22px' : 'auto',
                borderRadius: '50%',
                backgroundColor: today ? colors.accent.purpleSubtle : 'transparent',
                display: today ? 'flex' : 'block',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 'auto',
              }}>
                {format(date, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '2px 6px', borderRadius: '4px', border: 'none',
                      backgroundColor: `${CATEGORY_CONFIG[task.category].color}15`,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      width: '100%', overflow: 'hidden',
                    }}
                  >
                    <StatusCircle status={task.status} category={task.category} size={12} />
                    <span style={{
                      fontSize: '11px', color: colors.text.primary,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      opacity: task.status === 'done' ? 0.5 : 1,
                    }}>{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span style={{ fontSize: '10px', color: colors.text.muted, paddingLeft: '6px' }}>
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', fontSize: font.size.xs, fontWeight: font.weight.medium,
      color: colors.text.secondary, backgroundColor: colors.bg.surface,
      border: `1px solid ${colors.border.default}`, borderRadius: '6px',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
    }}>{children}</button>
  );
}
