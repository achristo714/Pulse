import { useState } from 'react';
import type { Subtask } from '../../lib/types';
import { useTaskStore } from '../../stores/taskStore';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const { createSubtask, updateSubtask, deleteSubtask } = useTaskStore();

  const doneCount = subtasks.filter((s) => s.is_done).length;
  const total = subtasks.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  const handleAdd = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await createSubtask(taskId, trimmed);
    setNewTitle('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
          Subtasks
        </span>
        {total > 0 && (
          <span className="text-[11px] text-text-muted">
            {doneCount}/{total}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1 bg-bg-primary rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-accent-purple rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 group py-1 px-1 rounded hover:bg-bg-surface-hover transition-colors duration-150"
          >
            <input
              type="checkbox"
              checked={subtask.is_done}
              onChange={() => updateSubtask(subtask.id, { is_done: !subtask.is_done })}
              className="w-3.5 h-3.5 rounded border-border-default accent-accent-purple cursor-pointer"
            />
            <span
              className={`flex-1 text-[13px] ${
                subtask.is_done ? 'text-text-muted line-through' : 'text-text-primary'
              }`}
            >
              {subtask.title}
            </span>
            <button
              onClick={() => deleteSubtask(subtask.id)}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all duration-150 cursor-pointer text-[12px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="+ Add subtask"
          className="w-full bg-transparent text-[13px] text-text-primary placeholder:text-text-muted py-1 px-1 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function SubtaskCount({ subtasks }: { subtasks: Subtask[] }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.is_done).length;
  return (
    <span className="text-[11px] text-text-muted">
      {done}/{subtasks.length}
    </span>
  );
}
