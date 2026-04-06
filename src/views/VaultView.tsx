import { useEffect, useState } from 'react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { colors, font } from '../lib/theme';
import type { Subscription, SubscriptionCategory } from '../lib/types';

const SUB_CATEGORIES: { value: SubscriptionCategory; label: string; icon: string }[] = [
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'engineering', label: 'Engineering', icon: '⚙️' },
  { value: 'productivity', label: 'Productivity', icon: '📋' },
  { value: 'cloud', label: 'Cloud', icon: '☁️' },
  { value: 'ai', label: 'AI', icon: '🤖' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'other', label: 'Other', icon: '📦' },
];

interface VaultViewProps {
  teamId: string;
  userId: string;
}

export function VaultView({ teamId, userId }: VaultViewProps) {
  const { subscriptions, loading, fetchSubscriptions, createSubscription, updateSubscription, deleteSubscription } = useSubscriptionStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  useEffect(() => { fetchSubscriptions(teamId); }, [teamId, fetchSubscriptions]);

  const filtered = subscriptions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Subscription[]> = {};
  for (const sub of filtered) {
    if (!grouped[sub.category]) grouped[sub.category] = [];
    grouped[sub.category].push(sub);
  }

  const totalMonthlyCost = subscriptions.reduce((acc, s) => {
    if (!s.cost) return acc;
    if (s.billing_cycle === 'yearly') return acc + s.cost / 12;
    if (s.billing_cycle === 'monthly') return acc + s.cost;
    return acc;
  }, 0);

  const toggleReveal = (id: string) => {
    setRevealedPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family, padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>Vault</h2>
          <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '4px' }}>
            Team subscriptions & credentials
            {totalMonthlyCost > 0 && (
              <span style={{ marginLeft: '12px', color: colors.accent.purple, fontWeight: font.weight.medium }}>
                ~${totalMonthlyCost.toFixed(0)}/mo
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              width: '200px', padding: '8px 12px 8px 32px', backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`, borderRadius: '8px',
              fontSize: font.size.sm, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="6" cy="6" r="4.5" stroke={colors.text.muted} strokeWidth="1.2" />
            <path d="M9.5 9.5L12.5 12.5" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#fff',
            fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '8px',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Add Subscription
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <SubscriptionForm
          onSave={async (data) => {
            await createSubscription({ ...data, team_id: teamId, created_by: userId, name: data.name || '' });
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Subscription cards by category */}
      {loading ? (
        <p style={{ color: colors.text.muted, fontSize: font.size.sm }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.text.muted }}>
          <p style={{ fontSize: font.size.lg }}>No subscriptions yet</p>
          <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Add your team's shared accounts and credentials</p>
        </div>
      ) : (
        SUB_CATEGORIES.map((cat) => {
          const items = grouped[cat.value];
          if (!items || items.length === 0) return null;
          return (
            <div key={cat.value} style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.secondary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{cat.icon}</span> {cat.label}
                <span style={{ fontSize: font.size.xs, color: colors.text.muted, fontWeight: font.weight.normal }}>{items.length}</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {items.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    revealed={revealedPasswords.has(sub.id)}
                    onToggleReveal={() => toggleReveal(sub.id)}
                    editing={editingId === sub.id}
                    onEdit={() => setEditingId(sub.id)}
                    onSave={async (updates) => { await updateSubscription(sub.id, updates); setEditingId(null); }}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteSubscription(sub.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SubscriptionCard({ sub, revealed, onToggleReveal, editing, onEdit, onSave, onCancel, onDelete }: {
  sub: Subscription; revealed: boolean; onToggleReveal: () => void;
  editing: boolean; onEdit: () => void; onSave: (u: Partial<Subscription>) => Promise<void>; onCancel: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return <SubscriptionForm initial={sub} onSave={async (data) => { await onSave(data); }} onCancel={onCancel} />;
  }

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
        borderRadius: '10px', padding: '16px', transition: 'border-color 150ms',
        borderColor: hovered ? colors.border.focus + '40' : colors.border.default,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: font.size.base, fontWeight: font.weight.semibold, color: colors.text.primary }}>{sub.name}</div>
          {sub.url && (
            <a href={sub.url} target="_blank" rel="noreferrer" style={{ fontSize: font.size.xs, color: colors.accent.purple, textDecoration: 'none' }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >{sub.url.replace(/https?:\/\//, '').split('/')[0]}</a>
          )}
        </div>
        {sub.cost && (
          <span style={{ fontSize: font.size.sm, color: colors.text.secondary, fontWeight: font.weight.medium }}>
            ${sub.cost}/{sub.billing_cycle === 'yearly' ? 'yr' : sub.billing_cycle === 'monthly' ? 'mo' : ''}
          </span>
        )}
      </div>

      {/* Credentials */}
      {sub.username && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, width: '60px' }}>User</span>
          <CopyField value={sub.username} />
        </div>
      )}
      {sub.password && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: font.size.xs, color: colors.text.muted, width: '60px' }}>Pass</span>
          <CopyField value={revealed ? sub.password : '••••••••••'} />
          <button onClick={onToggleReveal} style={{ fontSize: font.size.xs, color: colors.accent.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {revealed ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {sub.renewal_date && (
        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '8px' }}>
          Renews: {new Date(sub.renewal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {sub.notes && (
        <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '6px', fontStyle: 'italic' }}>{sub.notes}</div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
        <button onClick={onEdit} style={{ fontSize: font.size.xs, color: colors.text.secondary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
        {confirmDelete ? (
          <>
            <button onClick={onDelete} style={{ fontSize: font.size.xs, color: colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm Delete</button>
            <button onClick={() => setConfirmDelete(false)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
        )}
      </div>
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        flex: 1, fontSize: font.size.sm, color: colors.text.primary, backgroundColor: colors.bg.primary,
        border: `1px solid ${colors.border.default}`, borderRadius: '4px', padding: '4px 8px',
        cursor: 'pointer', fontFamily: 'monospace', textAlign: 'left', transition: 'border-color 150ms',
      }}
      title="Click to copy"
    >
      {copied ? '✓ Copied' : value}
    </button>
  );
}

function SubscriptionForm({ initial, onSave, onCancel }: {
  initial?: Partial<Subscription>; onSave: (data: Partial<Subscription>) => Promise<void>; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [username, setUsername] = useState(initial?.username || '');
  const [password, setPassword] = useState(initial?.password || '');
  const [category, setCategory] = useState<SubscriptionCategory>(initial?.category || 'other');
  const [cost, setCost] = useState(initial?.cost?.toString() || '');
  const [billingCycle, setBillingCycle] = useState(initial?.billing_cycle || 'monthly');
  const [renewalDate, setRenewalDate] = useState(initial?.renewal_date || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`, borderRadius: '6px',
    fontSize: font.size.sm, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(), url: url || null, username: username || null, password: password || null,
      category, cost: cost ? parseFloat(cost) : null, billing_cycle: billingCycle,
      renewal_date: renewalDate || null, notes: notes || null,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
      borderRadius: '10px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <Label>Name *</Label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adobe Creative Cloud" required style={inputStyle} />
        </div>
        <div>
          <Label>URL</Label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://adobe.com" style={inputStyle} />
        </div>
        <div>
          <Label>Username / Email</Label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="team@kpf.com" style={inputStyle} />
        </div>
        <div>
          <Label>Password</Label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" style={inputStyle} />
        </div>
        <div>
          <Label>Category</Label>
          <select value={category} onChange={(e) => setCategory(e.target.value as SubscriptionCategory)} style={{ ...inputStyle, appearance: 'auto' as any }}>
            {SUB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Cost</Label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="29.99" type="number" step="0.01" style={inputStyle} />
        </div>
        <div>
          <Label>Billing Cycle</Label>
          <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as any)} style={{ ...inputStyle, appearance: 'auto' as any }}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
        </div>
        <div>
          <Label>Renewal Date</Label>
          <input value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} type="date" style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <Label>Notes</Label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shared team license, 5 seats" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border.default}`, borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm }}>Cancel</button>
        <button type="submit" disabled={saving} style={{ padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: font.size.sm, fontWeight: font.weight.medium }}>{saving ? 'Saving...' : initial ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</div>;
}
