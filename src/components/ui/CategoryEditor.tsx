import { useState } from 'react';
import { useCategoryStore } from '../../stores/categoryStore';
import { Modal } from './Modal';
import { colors, font } from '../../lib/theme';

const PRESET_COLORS = ['#7C3AED', '#818CF8', '#60A5FA', '#34D399', '#10B981', '#F59E0B', '#FB923C', '#F472B6', '#EF4444', '#6B7280', '#A78BFA', '#FCD34D'];

interface CategoryEditorProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

export function CategoryEditor({ open, onClose, teamId }: CategoryEditorProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#7C3AED');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await addCategory(teamId, newLabel.trim(), newColor);
    setNewLabel('');
    setNewColor('#7C3AED');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    await updateCategory(editingId, { label: editLabel.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Categories" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {categories.map((cat) => (
          <div key={cat.id}>
            {editingId === cat.id ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: colors.bg.primary, borderRadius: '8px', border: `1px solid ${colors.border.default}` }}>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={{
                  flex: 1, padding: '6px 10px', backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
                  borderRadius: '6px', fontSize: font.size.sm, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
                }} />
                <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setEditColor(c)} style={{
                      width: '20px', height: '20px', borderRadius: '4px', backgroundColor: c,
                      border: editColor === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                    }} />
                  ))}
                </div>
                <button onClick={handleSaveEdit} style={{ padding: '4px 10px', backgroundColor: colors.accent.purple, color: '#fff', fontSize: font.size.xs, borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', color: colors.text.muted, fontSize: font.size.xs, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}` }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: cat.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>{cat.label}</span>
                <span style={{ fontSize: '10px', color: colors.text.muted, fontFamily: 'monospace' }}>{cat.key}</span>
                <button onClick={() => { setEditingId(cat.id); setEditLabel(cat.label); setEditColor(cat.color); }} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                {confirmDeleteId === cat.id ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { deleteCategory(cat.id); setConfirmDeleteId(null); }} style={{ fontSize: font.size.xs, color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Yes</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(cat.id)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
        <div style={{ fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Add Category</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Category name" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} style={{
            flex: 1, padding: '8px 12px', backgroundColor: colors.bg.primary, border: `1px solid ${colors.border.default}`,
            borderRadius: '6px', fontSize: font.size.sm, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
          }} />
          <button onClick={handleAdd} disabled={!newLabel.trim()} style={{
            padding: '8px 14px', backgroundColor: colors.accent.purple, color: '#fff',
            fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '6px',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: newLabel.trim() ? 1 : 0.5,
          }}>Add</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <button key={c} onClick={() => setNewColor(c)} style={{
              width: '24px', height: '24px', borderRadius: '6px', backgroundColor: c,
              border: newColor === c ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer', padding: 0,
            }} />
          ))}
        </div>
      </div>
    </Modal>
  );
}
