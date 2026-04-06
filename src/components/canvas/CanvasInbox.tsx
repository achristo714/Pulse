import { StatusCircle } from '../task/StatusCircle';
import { CategoryPill } from '../task/CategoryPill';
import { useCanvasStore } from '../../stores/canvasStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Task, Profile } from '../../lib/types';

interface CanvasInboxProps {
  tasks: Task[];
  members: Profile[];
  teamId: string;
}

export function CanvasInbox({ tasks, members, teamId }: CanvasInboxProps) {
  const createTaskPosition = useCanvasStore((s) => s.createTaskPosition);
  const cycleStatus = useTaskStore((s) => s.cycleStatus);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-[260px] bg-bg-surface/50 border-r border-dashed border-border-default overflow-y-auto z-10">
      <div className="px-3 py-3 border-b border-border-default">
        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Inbox
        </span>
        <span className="ml-2 text-[11px] text-text-muted">{tasks.length}</span>
      </div>

      <div className="p-2 space-y-2">
        {tasks.length === 0 && (
          <p className="text-[12px] text-text-muted text-center py-8">
            All tasks placed on canvas
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            className="bg-bg-surface border border-border-default rounded-[8px] p-2.5 cursor-grab active:cursor-grabbing hover:bg-bg-surface-hover transition-colors duration-150"
          >
            <div className="flex items-start gap-2">
              <StatusCircle
                status={task.status}
                size={14}
                onClick={() => cycleStatus(task.id)}
              />
              <span className="flex-1 text-[12px] text-text-primary font-medium leading-snug">
                {task.title}
              </span>
            </div>
            <div className="mt-1.5 ml-5">
              <CategoryPill category={task.category} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
