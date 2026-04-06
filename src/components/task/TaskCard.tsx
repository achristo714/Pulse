import { StatusCircle } from './StatusCircle';
import { CategoryPill } from './CategoryPill';
import { Avatar, EmptyAvatar } from '../ui/Avatar';
import { SubtaskCount } from './SubtaskList';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, Profile } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  members: Profile[];
  selected?: boolean;
  style?: React.CSSProperties;
  onDoubleClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function TaskCard({
  task,
  members,
  selected,
  style,
  onDoubleClick,
  onMouseDown,
}: TaskCardProps) {
  const { cycleStatus } = useTaskStore();
  const assigned = members.find((m) => m.id === task.assigned_to);

  return (
    <div
      className={`absolute bg-bg-surface border rounded-[8px] p-3 select-none transition-shadow duration-150 ${
        selected ? 'border-border-focus shadow-[0_0_0_1px_var(--color-border-focus)]' : 'border-border-default'
      } ${task.status === 'done' ? 'opacity-60' : ''}`}
      style={{ width: 280, ...style }}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
    >
      <div className="flex items-start gap-2">
        <StatusCircle
          status={task.status}
          onClick={() => cycleStatus(task.id)}
          size={16}
        />
        <span
          className={`flex-1 text-[13px] font-medium leading-snug ${
            task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <CategoryPill category={task.category} />
        <SubtaskCount subtasks={task.subtasks || []} />
        <div className="flex-1" />
        {assigned ? (
          <Avatar name={assigned.display_name} url={assigned.avatar_url} size={20} />
        ) : (
          <EmptyAvatar size={20} />
        )}
      </div>
    </div>
  );
}
