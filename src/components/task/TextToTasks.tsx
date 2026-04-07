import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { Modal } from '../ui/Modal';
import { colors, font } from '../../lib/theme';

interface TextToTasksProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  createdBy: string;
}

export function TextToTasks({ open, onClose, teamId, createdBy }: TextToTasksProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('admin');
  const [parsed, setParsed] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const createTask = useTaskStore((s) => s.createTask);
  const { categories } = useCategoryStore();

  const handleParse = () => {
    const lines = text
      .split('\n')
      .map((line) => line.replace(/^[-•*·▸►→>\d.)\]]+\s*/, '').trim())
      .filter((line) => line.length > 2 && line.length < 200);
    setParsed(lines);
  };

  const handleCreate = async () => {
    setCreating(true);
    for (const title of parsed) {
      await createTask({ team_id: teamId, created_by: createdBy, title, status: 'todo', category });
    }
    setCreating(false);
    setText('');
    setParsed([]);
    onClose();
  };

  const removeLine = (idx: number) => {
    setParsed((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <Modal open={open} onClose={onClose} title="Text → Tasks" width="540px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {parsed.length === 0 ? (
          <>
            <p style={{ fontSize: font.size.sm, color: colors.text.secondary }}>
              Paste meeting notes, a list, or any text — each line becomes a task.
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"- Review the dashboard mockups\n- Set up CI/CD pipeline\n- Schedule user testing\n- Update the design system\n- Fix login page bug"}
              rows={10}
              style={{
                width: '100%', padding: '14px 16px', backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`, borderRadius: '10px',
                fontSize: font.size.sm, color: colors.text.primary, outline: 'none',
                fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7,
              }}
            />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>Category:</span>
              {categories.map((cat) => (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '14px', fontSize: font.size.xs,
                  color: category === cat.key ? cat.color : colors.text.muted,
                  backgroundColor: category === cat.key ? `${cat.color}15` : 'transparent',
                  border: category === cat.key ? `1px solid ${cat.color}40` : '1px solid transparent',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border.default}`, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm }}>Cancel</button>
              <button onClick={handleParse} disabled={!text.trim()} style={{
                padding: '8px 20px', backgroundColor: text.trim() ? colors.accent.purple : colors.bg.surfaceActive,
                color: text.trim() ? '#fff' : colors.text.muted, borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: font.size.sm, fontWeight: 500,
              }}>Parse Lines</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: font.size.sm, color: colors.text.secondary }}>
              {parsed.length} task{parsed.length !== 1 ? 's' : ''} found. Remove any you don't need:
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {parsed.map((line, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 12px', backgroundColor: colors.bg.primary,
                  borderRadius: '8px', border: `1px solid ${colors.border.default}`,
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: categories.find((c) => c.key === category)?.color || '#666' }} />
                  <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary }}>{line}</span>
                  <button onClick={() => removeLine(i)} style={{ color: colors.text.muted, fontSize: font.size.xs, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setParsed([])} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border.default}`, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm }}>Back</button>
              <button onClick={handleCreate} disabled={creating || parsed.length === 0} style={{
                padding: '8px 20px', backgroundColor: colors.accent.purple, color: '#fff',
                borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: font.size.sm, fontWeight: 500,
              }}>{creating ? 'Creating...' : `Create ${parsed.length} Tasks`}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
