import { StatusCircle } from './StatusCircle';
import { CategoryPill } from './CategoryPill';
import { Avatar, EmptyAvatar } from '../ui/Avatar';
import { SubtaskCount } from './SubtaskList';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  members: Profile[];
  selected?: boolean;
  style?: React.CSSProperties;
  onDoubleClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function TaskCard({ task, members, selected, style: posStyle, onDoubleClick, onMouseDown }: TaskCardProps) {
  const { cycleStatus } = useTaskStore();
  const assigned = members.find((m) => m.id === task.assigned_to);

  return (
    <div
      style={{
        position: 'absolute',
        width: 280,
        backgroundColor: colors.bg.surface,
        border: `1px solid ${selected ? colors.border.focus : colors.border.default}`,
        borderRadius: '8px',
        padding: '12px',
        userSelect: 'none',
        opacity: task.status === 'done' ? 0.6 : 1,
        boxShadow: selected ? `0 0 0 1px ${colors.border.focus}` : 'none',
        transition: 'box-shadow 150ms',
        fontFamily: font.family,
        ...posStyle,
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <StatusCircle status={task.status} category={task.category} onClick={() => cycleStatus(task.id)} size={16} />
        <span
          style={{
            flex: 1,
            fontSize: font.size.base,
            fontWeight: font.weight.medium,
            lineHeight: '1.4',
            color: task.status === 'done' ? colors.text.muted : colors.text.primary,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <CategoryPill category={task.category} />
        <SubtaskCount subtasks={task.subtasks || []} />
        <div style={{ flex: 1 }} />
        {assigned ? (
          <Avatar name={assigned.display_name} url={assigned.avatar_url} size={20} />
        ) : (
          <EmptyAvatar size={20} />
        )}
      </div>
    </div>
  );
}
