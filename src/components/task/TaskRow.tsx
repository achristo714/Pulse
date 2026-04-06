import { StatusCircle } from './StatusCircle';
import { CategoryPill } from './CategoryPill';
import { QuickAssign } from './QuickAssign';
import { SubtaskCount } from './SubtaskList';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, Profile } from '../../lib/types';
import { format } from 'date-fns';

interface TaskRowProps {
  task: Task;
  members: Profile[];
  onClick: () => void;
}

export function TaskRow({ task, members, onClick }: TaskRowProps) {
  const { cycleStatus, updateTask } = useTaskStore();
  const hasNotes = !!task.notes;
  const hasImages = (task.images?.length || 0) > 0;

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer border-b border-border-default group"
    >
      <StatusCircle
        status={task.status}
        onClick={() => cycleStatus(task.id)}
      />

      <span
        className={`flex-1 text-[13px] font-medium truncate ${
          task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary'
        }`}
      >
        {task.title}
      </span>

      <div className="flex items-center gap-3 shrink-0">
        <SubtaskCount subtasks={task.subtasks || []} />

        <CategoryPill category={task.category} />

        <QuickAssign
          assignedTo={task.assigned_to}
          members={members}
          onAssign={(id) => updateTask(task.id, { assigned_to: id })}
        />

        <span className="text-[11px] text-text-muted w-16 text-right">
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
        </span>

        {hasImages && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted">
            <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1" />
            <path d="M1.5 9.5L4.5 7L7 9L9.5 6.5L12.5 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {hasNotes && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted">
            <path d="M3 4H11M3 7H9M3 10H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
}
