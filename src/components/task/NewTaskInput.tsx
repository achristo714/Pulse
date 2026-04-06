import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { CATEGORIES, CATEGORY_CONFIG } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
import type { TaskCategory } from '../../lib/types';

interface NewTaskInputProps {
  teamId: string;
  createdBy: string;
}

export function NewTaskInput({ teamId, createdBy }: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('admin');
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
      {/* Plus icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="7.5" stroke={focused ? colors.accent.purple : colors.text.muted} strokeWidth="1.5" strokeDasharray="3 3" style={{ transition: 'stroke 200ms' }} />
        <path d="M9 6V12M6 9H12" stroke={focused ? colors.accent.purple : colors.text.muted} strokeWidth="1.5" strokeLinecap="round" style={{ transition: 'stroke 200ms' }} />
      </svg>

      {/* Title input */}
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

      {/* Category selector — always visible */}
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const config = CATEGORY_CONFIG[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              title={config.label}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? `${config.color}20` : 'transparent',
                border: active ? `1.5px solid ${config.color}` : `1px solid ${colors.border.default}`,
                cursor: 'pointer',
                transition: 'all 150ms',
                padding: 0,
              }}
              onMouseOver={(e) => {
                if (!active) e.currentTarget.style.borderColor = config.color + '60';
              }}
              onMouseOut={(e) => {
                if (!active) e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }} />
            </button>
          );
        })}
      </div>

      {/* Add button */}
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
