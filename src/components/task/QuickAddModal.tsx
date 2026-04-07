import { useState, useEffect, useRef } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { colors, font } from '../../lib/theme';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  createdBy: string;
}

export function QuickAddModal({ open, onClose, teamId, createdBy }: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('admin');
  const [dueDate, setDueDate] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useTaskStore((s) => s.createTask);
  const { categories } = useCategoryStore();

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setVisible(false);
    }
  }, [open]);

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
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: visible ? 'rgba(0,0,0,0.5)' : 'transparent',
        transition: 'background-color 200ms ease-out',
        fontFamily: font.family,
      }}
    >
      <div style={{
        width: '480px',
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: '16px',
        boxShadow: `0 16px 64px rgba(0,0,0,0.5), 0 0 0 1px ${colors.border.default}`,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
        opacity: visible ? 1 : 0,
        transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary }}>
            Quick Add Task
          </span>
          <button onClick={handleClose} style={{
            width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'transparent', border: 'none', color: colors.text.muted, cursor: 'pointer', fontSize: '16px',
          }}>✕</button>
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px' }}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSubmit(); if (e.key === 'Escape') handleClose(); }}
            placeholder="What needs to be done?"
            style={{
              width: '100%', padding: '14px 16px',
              backgroundColor: colors.bg.primary,
              border: `1.5px solid ${title.trim() ? colors.accent.purple + '60' : colors.border.default}`,
              borderRadius: '10px', fontSize: font.size.md, color: colors.text.primary,
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 200ms',
            }}
          />
        </div>

        {/* Options row */}
        <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Category */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {categories.map((cat) => {
              const active = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  title={cat.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '16px',
                    fontSize: font.size.xs, fontWeight: font.weight.medium,
                    color: active ? cat.color : colors.text.muted,
                    backgroundColor: active ? `${cat.color}15` : 'transparent',
                    border: active ? `1px solid ${cat.color}40` : '1px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cat.color }} />
                  {active && cat.label}
                </button>
              );
            })}
          </div>

          {/* Due date */}
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              padding: '5px 10px', backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`, borderRadius: '8px',
              fontSize: font.size.xs, color: dueDate ? colors.text.primary : colors.text.muted,
              outline: 'none', fontFamily: 'inherit', colorScheme: 'dark',
            }}
          />

          <div style={{ flex: 1 }} />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            style={{
              padding: '8px 20px',
              backgroundColor: title.trim() ? colors.accent.purple : colors.bg.surfaceActive,
              color: title.trim() ? '#fff' : colors.text.muted,
              fontSize: font.size.sm, fontWeight: font.weight.semibold,
              borderRadius: '10px', border: 'none', cursor: title.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'all 150ms',
              boxShadow: title.trim() ? `0 2px 8px ${colors.accent.purple}40` : 'none',
            }}
          >
            Add Task
          </button>
        </div>

        {/* Hint */}
        <div style={{
          padding: '10px 24px', borderTop: `1px solid ${colors.border.default}`,
          fontSize: font.size.xs, color: colors.text.muted, textAlign: 'center',
        }}>
          <span style={{ color: colors.text.secondary }}>Enter</span> to add · <span style={{ color: colors.text.secondary }}>Esc</span> to cancel
        </div>
      </div>
    </div>
  );
}
