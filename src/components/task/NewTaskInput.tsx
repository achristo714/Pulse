import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { CategoryPicker } from './CategoryPicker';
import { colors, font } from '../../lib/theme';
import type { TaskCategory } from '../../lib/types';

interface NewTaskInputProps {
  teamId: string;
  createdBy: string;
  category: TaskCategory;
  onCategoryChange: (cat: TaskCategory) => void;
}

export function NewTaskInput({ teamId, createdBy, category, onCategoryChange }: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDate, setShowDate] = useState(false);
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
      due_date: dueDate || null,
    });
    setTitle('');
    setDueDate('');
    setShowDate(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 28px',
        borderBottom: `1px solid ${focused ? colors.accent.purple + '60' : colors.border.default}`,
        fontFamily: font.family,
        backgroundColor: focused ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.015)',
        boxShadow: focused
          ? `inset 0 -2px 0 ${colors.accent.purple}50, 0 2px 16px rgba(124,58,237,0.12), 0 0 40px rgba(124,58,237,0.04)`
          : `inset 0 0 0 transparent, 0 0 8px rgba(124,58,237,0.03)`,
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

      {/* Category dots */}
      <CategoryPicker value={category} onChange={onCategoryChange} />

      {/* Date picker toggle */}
      {showDate ? (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: font.size.xs,
            color: colors.text.primary,
            colorScheme: 'dark',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <button
          onClick={() => setShowDate(true)}
          title="Add due date"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            color: colors.text.muted,
            cursor: 'pointer',
            transition: 'all 150ms',
            padding: 0,
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = colors.bg.surfaceHover; e.currentTarget.style.color = colors.text.secondary; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = colors.text.muted; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 1.5V3.5M11 1.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      )}

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
