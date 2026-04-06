import { useState } from 'react';
import { StatusCircle } from './StatusCircle';
import { CategoryPill } from './CategoryPill';
import { QuickAssign } from './QuickAssign';
import { SubtaskCount } from './SubtaskList';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';
import { format } from 'date-fns';

interface TaskRowProps {
  task: Task;
  members: Profile[];
  onClick: () => void;
}

export function TaskRow({ task, members, onClick }: TaskRowProps) {
  const { cycleStatus, updateTask } = useTaskStore();
  const [hovered, setHovered] = useState(false);
  const hasNotes = !!task.notes;
  const hasImages = (task.images?.length || 0) > 0;

  return (
    <div
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
        cursor: 'pointer',
        borderBottom: `1px solid ${colors.border.subtle}`,
        transition: 'background-color 150ms ease-out',
        fontFamily: font.family,
      }}
    >
      <StatusCircle status={task.status} onClick={() => cycleStatus(task.id)} />

      <span
        style={{
          flex: 1,
          fontSize: font.size.base,
          fontWeight: font.weight.medium,
          color: task.status === 'done' ? colors.text.muted : colors.text.primary,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {task.title}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <SubtaskCount subtasks={task.subtasks || []} />
        <CategoryPill category={task.category} />
        <QuickAssign
          assignedTo={task.assigned_to}
          members={members}
          onAssign={(id) => updateTask(task.id, { assigned_to: id })}
        />
        <span style={{ fontSize: font.size.xs, color: colors.text.muted, width: '60px', textAlign: 'right' }}>
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
        </span>

        {hasImages && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke={colors.text.muted} strokeWidth="1.2" />
            <circle cx="4.5" cy="5.5" r="1" stroke={colors.text.muted} strokeWidth="1" />
            <path d="M1.5 9.5L4.5 7L7 9L9.5 6.5L12.5 9.5" stroke={colors.text.muted} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {hasNotes && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4H11M3 7H9M3 10H7" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
