import { useEffect, useState } from 'react';
import { useGoalStore } from '../stores/goalStore';
import { CATEGORY_CONFIG, CATEGORIES } from '../lib/constants';
import { colors, font } from '../lib/theme';
import type { Goal, TaskCategory } from '../lib/types';

interface GoalsViewProps {
  teamId: string;
  userId: string;
}

export function GoalsView({ teamId, userId }: GoalsViewProps) {
  const { goals, loading, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoalStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchGoals(teamId); }, [teamId, fetchGoals]);

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');
  const paused = goals.filter((g) => g.status === 'paused');

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family, padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>Goals</h2>
          <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '4px' }}>Long-term team objectives</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#fff',
          fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '8px',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>+ New Goal</button>
      </div>

      {showAdd && (
        <GoalForm onSave={async (data) => { await createGoal({ ...data, team_id: teamId, created_by: userId, title: data.title || '' }); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
      )}

      {loading && <p style={{ color: colors.text.muted }}>Loading...</p>}

      {active.length > 0 && (
        <GoalSection title="Active" goals={active} onUpdate={updateGoal} onDelete={deleteGoal} />
      )}
      {paused.length > 0 && (
        <GoalSection title="Paused" goals={paused} onUpdate={updateGoal} onDelete={deleteGoal} />
      )}
      {completed.length > 0 && (
        <GoalSection title="Completed" goals={completed} onUpdate={updateGoal} onDelete={deleteGoal} />
      )}

      {!loading && goals.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.text.muted }}>
          <p style={{ fontSize: font.size.lg }}>No goals yet</p>
          <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Set long-term objectives to keep the team aligned</p>
        </div>
      )}
    </div>
  );
}

function GoalSection({ title, goals, onUpdate, onDelete }: { title: string; goals: Goal[]; onUpdate: (id: string, u: Partial<Goal>) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.secondary, marginBottom: '12px' }}>{title} <span style={{ color: colors.text.muted, fontWeight: font.weight.normal }}>{goals.length}</span></h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
        {goals.map((goal) => <GoalCard key={goal.id} goal={goal} onUpdate={onUpdate} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: { goal: Goal; onUpdate: (id: string, u: Partial<Goal>) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const catConfig = CATEGORY_CONFIG[goal.category];

  if (editing) {
    return <GoalForm initial={goal} onSave={async (data) => { await onUpdate(goal.id, data); setEditing(false); }} onCancel={() => setEditing(false)} />;
  }

  return (
    <div
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
        borderRadius: '10px', padding: '20px', transition: 'border-color 150ms',
        borderColor: hovered ? catConfig.color + '40' : colors.border.default,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: catConfig.color }} />
            <span style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary }}>{goal.title}</span>
          </div>
          {goal.description && <p style={{ fontSize: font.size.sm, color: colors.text.secondary, marginTop: '4px', lineHeight: 1.5 }}>{goal.description}</p>}
        </div>
        <span style={{
          fontSize: font.size.xs, fontWeight: font.weight.medium, padding: '2px 8px', borderRadius: '10px',
          color: goal.status === 'active' ? colors.status.wip : goal.status === 'completed' ? colors.status.done : colors.text.muted,
          backgroundColor: goal.status === 'active' ? colors.status.wip + '15' : goal.status === 'completed' ? colors.status.done + '15' : colors.bg.surfaceActive,
        }}>{goal.status}</span>
      </div>

      {/* Progress bar — click to reveal slider */}
      <div
        onClick={() => setShowSlider(!showSlider)}
        style={{ cursor: 'pointer', marginBottom: showSlider ? '4px' : '0' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>Progress</span>
          <span style={{ fontSize: font.size.xs, color: catConfig.color, fontWeight: font.weight.medium }}>{goal.progress}%</span>
        </div>
        <div style={{ height: '6px', backgroundColor: colors.bg.primary, borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: catConfig.color, borderRadius: '3px', width: `${goal.progress}%`, transition: 'width 300ms ease-out' }} />
        </div>
      </div>

      {/* Slider — only visible when clicked */}
      {showSlider && (
        <input type="range" min={0} max={100} value={goal.progress}
          onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value), status: parseInt(e.target.value) === 100 ? 'completed' : 'active' })}
          onMouseUp={() => setShowSlider(false)}
          style={{ width: '100%', accentColor: catConfig.color, cursor: 'pointer', height: '4px', marginTop: '4px' }}
        />
      )}

      {goal.target_date && (
        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '8px' }}>
          Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
        <button onClick={() => setEditing(true)} style={{ fontSize: font.size.xs, color: colors.text.secondary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
        {goal.status !== 'paused' && <button onClick={() => onUpdate(goal.id, { status: 'paused' })} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Pause</button>}
        {goal.status === 'paused' && <button onClick={() => onUpdate(goal.id, { status: 'active' })} style={{ fontSize: font.size.xs, color: colors.accent.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Resume</button>}
        <button onClick={() => onDelete(goal.id)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel }: { initial?: Partial<Goal>; onSave: (data: Partial<Goal>) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState<TaskCategory>(initial?.category || 'admin');
  const [targetDate, setTargetDate] = useState(initial?.target_date || '');
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`, borderRadius: '6px',
    fontSize: font.size.sm, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave({ title, description: description || null, category, target_date: targetDate || null }); setSaving(false); }}
      style={{ backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`, borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Goal Title *</Label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ship v2 of the dashboard" style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Description</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div>
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} style={{ ...inputStyle, appearance: 'auto' as any }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>)}
          </select>
        </div>
        <div>
          <Label>Target Date</Label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border.default}`, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm, fontWeight: font.weight.medium }}>{saving ? 'Saving...' : initial ? 'Update' : 'Create Goal'}</button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</div>;
}
