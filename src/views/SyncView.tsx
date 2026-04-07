import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { colors, font } from '../lib/theme';

interface SyncTopic {
  id: string;
  team_id: string;
  title: string;
  notes: string;
  type: 'update' | 'metric' | 'discussion' | 'decision' | 'blocker';
  image_urls: string[];
  sort_order: number;
  is_archived: boolean;
  created_at: string;
}

const TOPIC_TYPES: { value: SyncTopic['type']; label: string; color: string }[] = [
  { value: 'update', label: 'Update', color: '#7C3AED' },
  { value: 'metric', label: 'Metric', color: '#10B981' },
  { value: 'discussion', label: 'Discussion', color: '#60A5FA' },
  { value: 'decision', label: 'Decision', color: '#F59E0B' },
  { value: 'blocker', label: 'Blocker', color: '#EF4444' },
];

interface SyncViewProps {
  teamId: string;
  userId: string;
  onPresent: (topics: SyncTopic[]) => void;
}

export function SyncView({ teamId, userId, onPresent }: SyncViewProps) {
  const [topics, setTopics] = useState<SyncTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('sync_topics').select('*').eq('team_id', teamId).eq('is_archived', false).order('sort_order').then(({ data }) => {
      setTopics(data || []);
      setLoading(false);
    });
  }, [teamId]);

  const addTopic = async (type: SyncTopic['type'] = 'update') => {
    const { data } = await supabase.from('sync_topics').insert({ team_id: teamId, title: '', type, created_by: userId, sort_order: topics.length }).select().single();
    if (data) setTopics((prev) => [...prev, data]);
  };

  const updateTopic = async (id: string, updates: Partial<SyncTopic>) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    await supabase.from('sync_topics').update(updates).eq('id', id);
  };

  const deleteTopic = async (id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('sync_topics').delete().eq('id', id);
  };

  const archiveAll = async () => {
    for (const t of topics) await supabase.from('sync_topics').update({ is_archived: true }).eq('id', t.id);
    setTopics([]);
  };

  const uploadImage = async (topicId: string, file: File) => {
    const path = `sync-images/${topicId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await supabase.storage.from('task-images').upload(path, file);
    const url = supabase.storage.from('task-images').getPublicUrl(path).data.publicUrl;
    const topic = topics.find((t) => t.id === topicId);
    if (topic) {
      const newUrls = [...(topic.image_urls || []), url];
      updateTopic(topicId, { image_urls: newUrls });
    }
  };

  const activeTopics = topics.filter((t) => !t.is_archived);

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: font.family, padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>Sync Agenda</h2>
          <p style={{ fontSize: font.size.sm, color: colors.text.muted, marginTop: '4px' }}>
            {format(new Date(), 'EEEE, MMMM d')} · {activeTopics.length} topic{activeTopics.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTopics.length > 0 && (
            <button onClick={() => onPresent(activeTopics)} style={{
              padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#fff',
              fontSize: font.size.sm, fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 2px 8px ${colors.accent.purple}40`,
            }}>📺 Present Sync</button>
          )}
          {activeTopics.length > 0 && (
            <button onClick={archiveAll} style={{
              padding: '8px 12px', backgroundColor: 'transparent', color: colors.text.muted,
              fontSize: font.size.xs, borderRadius: '6px', border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit',
            }}>Archive All</button>
          )}
        </div>
      </div>

      {/* Add topic buttons */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TOPIC_TYPES.map((tt) => (
          <button key={tt.value} onClick={() => addTopic(tt.value)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', borderRadius: '8px', fontSize: font.size.xs, fontWeight: 500,
            color: tt.color, backgroundColor: `${tt.color}10`,
            border: `1px solid ${tt.color}30`, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tt.color }} /> + {tt.label}
          </button>
        ))}
      </div>

      {/* Topics */}
      {loading && <p style={{ color: colors.text.muted }}>Loading...</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTopics.map((topic, idx) => (
          <TopicCard key={topic.id} topic={topic} index={idx + 1} onUpdate={updateTopic} onDelete={deleteTopic} onUploadImage={uploadImage} />
        ))}
      </div>

      {activeTopics.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.text.muted }}>
          <p style={{ fontSize: font.size.lg }}>No topics for this sync</p>
          <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Add updates, metrics, or discussion points above</p>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, index, onUpdate, onDelete, onUploadImage }: {
  topic: SyncTopic; index: number;
  onUpdate: (id: string, u: Partial<SyncTopic>) => void;
  onDelete: (id: string) => void;
  onUploadImage: (id: string, file: File) => void;
}) {
  const typeInfo = TOPIC_TYPES.find((t) => t.value === topic.type) || TOPIC_TYPES[0];
  const [hovered, setHovered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: colors.bg.surface, borderRadius: '8px',
        border: `1px solid ${colors.border.default}`,
        borderLeft: `3px solid ${typeInfo.color}`,
        padding: '12px 16px',
      }}
    >
      {/* Row 1: type + title + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '10px', color: colors.text.muted, fontWeight: 600, minWidth: '16px' }}>{index}</span>
        <select value={topic.type} onChange={(e) => onUpdate(topic.id, { type: e.target.value as any })} style={{
          padding: '1px 4px', backgroundColor: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}25`,
          borderRadius: '4px', fontSize: '10px', color: typeInfo.color, outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
        }}>
          {TOPIC_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
        </select>
        <input
          type="text"
          value={topic.title}
          onChange={(e) => onUpdate(topic.id, { title: e.target.value })}
          placeholder="Topic title..."
          style={{
            flex: 1, fontSize: font.size.base, fontWeight: 600, color: colors.text.primary,
            backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: '6px', opacity: hovered ? 1 : 0, transition: 'opacity 150ms' }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) onUploadImage(topic.id, e.target.files[0]); }} />
          <button onClick={() => fileRef.current?.click()} style={{ fontSize: '10px', color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button onClick={() => onDelete(topic.id)} style={{ fontSize: '10px', color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
      </div>

      {/* Row 2: notes (compact) */}
      <div style={{ marginTop: '6px', marginLeft: '24px' }}>
        <textarea
          value={topic.notes}
          onChange={(e) => onUpdate(topic.id, { notes: e.target.value })}
          placeholder="Notes..."
          rows={1}
          style={{
            width: '100%', fontSize: font.size.sm, color: colors.text.secondary,
            backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit',
            resize: 'none', lineHeight: 1.5, padding: 0,
          }}
          onFocus={(e) => { e.currentTarget.rows = 3; e.currentTarget.style.backgroundColor = colors.bg.primary; e.currentTarget.style.padding = '8px'; e.currentTarget.style.borderRadius = '6px'; e.currentTarget.style.resize = 'vertical'; }}
          onBlur={(e) => { e.currentTarget.rows = 1; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.padding = '0'; e.currentTarget.style.resize = 'none'; }}
        />

        {/* Images */}
        {topic.image_urls && topic.image_urls.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {topic.image_urls.map((url, i) => (
              <div key={i} style={{ width: '80px', height: '52px', borderRadius: '6px', overflow: 'hidden', backgroundColor: colors.bg.primary }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
