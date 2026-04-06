import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';

interface NewTaskInputProps {
  teamId: string;
  createdBy: string;
}

export function NewTaskInput({ teamId, createdBy }: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const createTask = useTaskStore((s) => s.createTask);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask({
      team_id: teamId,
      created_by: createdBy,
      title: trimmed,
      status: 'todo',
      category: 'admin',
    });
    setTitle('');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 24px',
        borderBottom: `1px solid ${colors.border.default}`,
        fontFamily: font.family,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="7.5" stroke={colors.accent.purple} strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M9 6V12M6 9H12" stroke={colors.accent.purple} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
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
            padding: '4px 12px',
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
