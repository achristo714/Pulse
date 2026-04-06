import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { TaskCategory } from '../../lib/types';

interface NewTaskInputProps {
  teamId: string;
  createdBy: string;
  category: TaskCategory;
}

export function NewTaskInput({ teamId, createdBy, category }: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const [focused, setFocused] = useState(false);
  const createTask = useTaskStore((s) => s.createTask);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask({
      team_id: teamId,
      created_by: createdBy,
      title: trimmed,
      status: 'todo',
      category,
    });
    setTitle('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 28px',
        borderBottom: `1px solid ${colors.border.default}`,
        fontFamily: font.family,
        backgroundColor: focused ? 'rgba(124,58,237,0.03)' : 'transparent',
        boxShadow: focused ? `inset 0 -1px 0 ${colors.accent.purple}40, 0 1px 8px rgba(124,58,237,0.08)` : 'none',
        transition: 'all 200ms ease-out',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="7.5" stroke={focused ? colors.accent.purple : colors.text.muted} strokeWidth="1.5" strokeDasharray="3 3" style={{ transition: 'stroke 200ms' }} />
        <path d="M9 6V12M6 9H12" stroke={focused ? colors.accent.purple : colors.text.muted} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 200ms' }} />
      </svg>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="Add a new task..."
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: font.size.base,
          color: colors.text.primary,
          fontFamily: 'inherit',
          padding: '4px 0',
        }}
      />

      {title.trim() && (
        <button
          onClick={handleSubmit}
          style={{
            padding: '5px 14px',
            backgroundColor: colors.accent.purple,
            color: '#FFFFFF',
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 150ms',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purpleHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purple)}
        >
          Add
        </button>
      )}
    </div>
  );
}
