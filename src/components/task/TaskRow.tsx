import { useState, useRef, useEffect } from 'react';
import { StatusCircle } from './StatusCircle';
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
  const { cycleStatus, updateTask, updateSubtask, createSubtask } = useTaskStore();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasNotes = !!task.notes;
  const hasImages = (task.images?.length || 0) > 0;
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;

  useEffect(() => { setEditTitle(task.title); }, [task.title]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const commitTitle = () => {
    setEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateTask(task.id, { title: trimmed });
    } else {
      setEditTitle(task.title);
    }
  };

  const handleAddSubtask = async () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    await createSubtask(task.id, trimmed);
    setNewSubtask('');
  };

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {/* Main row */}
      <div
        onClick={onClick}
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr auto 32px auto',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 28px 12px 48px',
          backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
          cursor: 'pointer',
          borderBottom: expanded ? 'none' : `1px solid ${colors.border.subtle}`,
          transition: 'background-color 150ms ease-out',
          fontFamily: font.family,
        }}
      >
        {/* Col 1: Status */}
        <StatusCircle status={task.status} category={task.category} size={20} onClick={() => cycleStatus(task.id)} />

        {/* Col 2: Title + subtask count + expand toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                minWidth: '120px',
                maxWidth: '400px',
                fontSize: font.size.base,
                fontWeight: font.weight.medium,
                color: colors.text.primary,
                backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.focus}`,
                borderRadius: '4px',
                padding: '4px 10px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <span
              onClick={handleTitleClick}
              style={{
                fontSize: font.size.base,
                fontWeight: font.weight.medium,
                color: task.status === 'done' ? colors.text.muted : colors.text.primary,
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'text',
                borderRadius: '4px',
                padding: '4px 8px',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = colors.bg.surfaceActive; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {task.title}
            </span>
          )}

          {/* Subtask expand toggle */}
          {hasSubtasks && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: font.size.xs,
                color: expanded ? colors.accent.purple : colors.text.muted,
                backgroundColor: expanded ? colors.accent.purpleSubtle : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 150ms',
                flexShrink: 0,
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
              >
                <path d="M3 1.5L6.5 5L3 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <SubtaskCount subtasks={subtasks} />
            </button>
          )}
        </div>

        {/* Col 3: Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {hasImages && (
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke={colors.text.muted} strokeWidth="1.2" />
              <circle cx="4.5" cy="5.5" r="1" stroke={colors.text.muted} strokeWidth="1" />
            </svg>
          )}
          {hasNotes && (
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <path d="M3 4H11M3 7H9M3 10H7" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Col 4: Assignee */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {task.assigned_to ? (
            <QuickAssign
              assignedTo={task.assigned_to}
              members={members}
              onAssign={(id) => updateTask(task.id, { assigned_to: id })}
            />
          ) : (
            <div style={{ width: '24px' }} />
          )}
        </div>

        {/* Col 5: Due date with overdue indicator */}
        {task.due_date ? (() => {
          const isOverdue = task.status !== 'done' && new Date(task.due_date) < new Date(new Date().toDateString());
          return (
            <span style={{
              fontSize: font.size.xs, textAlign: 'right', minWidth: '50px',
              color: isOverdue ? colors.danger : colors.text.muted,
              fontWeight: isOverdue ? font.weight.medium : font.weight.normal,
            }}>
              {isOverdue && '⚠ '}{format(new Date(task.due_date), 'MMM d')}
            </span>
          );
        })() : <span style={{ minWidth: '50px' }} />}
      </div>

      {/* Expanded subtasks */}
      {expanded && (
        <div
          style={{
            padding: '4px 28px 12px 80px',
            borderBottom: `1px solid ${colors.border.subtle}`,
            backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
            transition: 'background-color 150ms',
          }}
        >
          {subtasks.map((st) => (
            <div
              key={st.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 0',
              }}
            >
              <StatusCircle
                status={st.is_done ? 'done' : 'todo'}
                category={task.category}
                size={16}
                onClick={() => updateSubtask(st.id, { is_done: !st.is_done })}
              />
              <span
                style={{
                  fontSize: font.size.sm,
                  color: st.is_done ? colors.text.muted : colors.text.primary,
                  textDecoration: st.is_done ? 'line-through' : 'none',
                }}
              >
                {st.title}
              </span>
            </div>
          ))}

          {/* Inline add subtask */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
              onClick={(e) => e.stopPropagation()}
              placeholder="+ Add subtask..."
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: font.size.sm,
                color: colors.text.primary,
                fontFamily: 'inherit',
                padding: '4px 0',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
