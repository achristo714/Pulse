import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { supabase } from '../../lib/supabase';
import { colors, font } from '../../lib/theme';
import type { TaskComment, Profile } from '../../lib/types';

interface CommentThreadProps {
  taskId: string;
  teamId: string;
  authorId: string;
  members: Profile[];
}

export function CommentThread({ taskId, teamId, authorId, members }: CommentThreadProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at').then(({ data }) => {
      setComments(data || []);
    });
  }, [taskId]);

  const handleSubmit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setLoading(true);

    // Extract @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      const member = members.find((m) => m.display_name.toLowerCase().includes(match![1].toLowerCase()));
      if (member) mentions.push(member.id);
    }

    const { data } = await supabase.from('task_comments').insert({
      task_id: taskId, team_id: teamId, author_id: authorId,
      content: trimmed, mentions,
    }).select().single();

    if (data) setComments((prev) => [...prev, data]);
    setNewComment('');
    setLoading(false);
  };

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div>
      <div style={{ fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
        Comments
        {comments.length > 0 && <span style={{ color: colors.text.muted, fontWeight: font.weight.normal }}> ({comments.length})</span>}
      </div>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {comments.map((c) => {
          const author = memberMap.get(c.author_id);
          return (
            <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
              <Avatar name={author?.display_name || '?'} url={author?.avatar_url} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>{author?.display_name || 'Unknown'}</span>
                  <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <div style={{ fontSize: font.size.sm, color: colors.text.secondary, lineHeight: 1.5 }}>
                  {renderComment(c.content, members)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New comment input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <Avatar name={memberMap.get(authorId)?.display_name || '?'} size={28} />
        <div style={{ flex: 1 }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Add a comment... (use @name to mention)"
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`, borderRadius: '8px',
              fontSize: font.size.sm, color: colors.text.primary, outline: 'none',
              fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5,
            }}
          />
          {newComment.trim() && (
            <button onClick={handleSubmit} disabled={loading} style={{
              marginTop: '6px', padding: '5px 12px', backgroundColor: colors.accent.purple,
              color: '#fff', fontSize: font.size.xs, fontWeight: font.weight.medium,
              borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {loading ? 'Sending...' : 'Comment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function renderComment(content: string, members: Profile[]) {
  // Highlight @mentions
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const name = part.slice(1);
      const isMember = members.some((m) => m.display_name.toLowerCase().includes(name.toLowerCase()));
      if (isMember) {
        return <span key={i} style={{ color: colors.accent.purple, fontWeight: font.weight.medium }}>{part}</span>;
      }
    }
    return part;
  });
}
