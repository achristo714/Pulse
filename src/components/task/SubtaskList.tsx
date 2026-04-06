import { useState } from 'react';
import type { Subtask } from '../../lib/types';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Subtasks
        </span>
        {total > 0 && (
          <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
            {doneCount}/{total}
          </span>
        )}
      </div>

      {total > 0 && (
        <div style={{ height: '3px', backgroundColor: colors.bg.primary, borderRadius: '2px', marginBottom: '12px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: colors.accent.purple,
              borderRadius: '2px',
              transition: 'width 300ms ease-out',
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {subtasks.map((subtask) => (
          <SubtaskItem key={subtask.id} subtask={subtask} onToggle={() => updateSubtask(subtask.id, { is_done: !subtask.is_done })} onDelete={() => deleteSubtask(subtask.id)} />
        ))}
      </div>

      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        placeholder="+ Add subtask"
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: font.size.base,
          color: colors.text.primary,
          padding: '6px 4px',
          marginTop: '4px',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

function SubtaskItem({ subtask, onToggle, onDelete }: { subtask: Subtask; onToggle: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px',
        borderRadius: '4px',
        backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
        transition: 'background-color 150ms',
      }}
    >
      <input
        type="checkbox"
        checked={subtask.is_done}
        onChange={onToggle}
        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: colors.accent.purple }}
      />
      <span
        style={{
          flex: 1,
          fontSize: font.size.base,
          color: subtask.is_done ? colors.text.muted : colors.text.primary,
          textDecoration: subtask.is_done ? 'line-through' : 'none',
        }}
      >
        {subtask.title}
      </span>
      <button
        onClick={onDelete}
        style={{
          opacity: hovered ? 1 : 0,
          color: colors.text.muted,
          fontSize: font.size.sm,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 150ms',
          fontFamily: 'inherit',
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function SubtaskCount({ subtasks }: { subtasks: Subtask[] }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.is_done).length;
  return (
    <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>
      {done}/{subtasks.length}
    </span>
  );
}
