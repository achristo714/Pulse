import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { format } from 'date-fns';
import { StatusCircle } from './StatusCircle';
import { SubtaskList } from './SubtaskList';
import { CommentThread } from './CommentThread';
import { Avatar } from '../ui/Avatar';
import { useTaskStore } from '../../stores/taskStore';
import { useGoalStore } from '../../stores/goalStore';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { STATUSES } from '../../lib/constants';
import { useCategoryStore } from '../../stores/categoryStore';
import { colors, font, shadow } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface TaskDetailPanelProps {
  task: Task;
  members: Profile[];
  onClose: () => void;
}

export function TaskDetailPanel({ task, members, onClose }: TaskDetailPanelProps) {
  const { updateTask, deleteTask, uploadImage, deleteImage, addDependency, removeDependency, allDependencies } = useTaskStore();
  const allTasks = useTaskStore((s) => s.tasks);
  const goals = useGoalStore((s) => s.goals);
  const articles = useKnowledgeStore((s) => s.articles);
  const taskDeps = allDependencies.filter((d) => d.task_id === task.id);
  const taskBlocks = allDependencies.filter((d) => d.depends_on === task.id);
  const { categories: teamCategories } = useCategoryStore();
  const [title, setTitle] = useState(task.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [syncSent, setSyncSent] = useState(false);
  const [visible, setVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Slide-in animation
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => { setTitle(task.title); }, [task.title]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) &&
          overlayRef.current && overlayRef.current === e.target) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [handleClose]);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Add notes...' })],
    content: task.notes || '',
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== task.notes) updateTask(task.id, { notes: html });
    },
  });

  useEffect(() => {
    if (editor && task.notes !== undefined) {
      const cur = editor.getHTML();
      if (cur !== task.notes && task.notes !== null) editor.commands.setContent(task.notes || '');
    }
  }, [task.notes, editor]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) updateTask(task.id, { title: title.trim() });
  };

  const handleSendToSync = async () => {
    const { startOfWeek: sow, format: fmt } = await import('date-fns');
    const thisWeek = fmt(sow(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // Find the category label for this task
    const catLabel = teamCategories.find((c) => c.key === task.category)?.label || task.category;

    // Find this week's sync
    const { data: existing } = await supabase.from('meeting_notes').select('*').eq('team_id', task.team_id).eq('date', thisWeek).single();
    if (existing) {
      // Find the category section and append the task
      const sectionRegex = new RegExp(`(<h2>${catLabel}</h2>\\s*<ul>)([\\s\\S]*?)(<\\/ul>)`);
      const match = existing.content.match(sectionRegex);
      if (match) {
        const newContent = existing.content.replace(sectionRegex, `$1$2<li><strong>${task.title}</strong></li>$3`);
        await supabase.from('meeting_notes').update({ content: newContent }).eq('id', existing.id);
      } else {
        // Category section doesn't exist — add it
        const append = `<h2>${catLabel}</h2><ul><li><strong>${task.title}</strong></li></ul>`;
        await supabase.from('meeting_notes').update({ content: existing.content + append }).eq('id', existing.id);
      }
    } else {
      // Create new sync with the task in its category section
      const cats = teamCategories.map((c) =>
        c.key === task.category
          ? `<h2>${c.label}</h2><ul><li><strong>${task.title}</strong></li></ul>`
          : `<h2>${c.label}</h2><ul><li></li></ul>`
      ).join('');
      await supabase.from('meeting_notes').insert({
        team_id: task.team_id, title: `Sync — Week of ${fmt(new Date(thisWeek), 'MMM d, yyyy')}`,
        date: thisWeek, content: cats + '<hr><p></p>',
        created_by: task.created_by,
      });
    }
    setSyncSent(true);
    setTimeout(() => setSyncSent(false), 3000);
  };

  const handleImageUpload = useCallback(async (files: FileList) => {
    const remaining = 10 - (task.images?.length || 0);
    for (const file of Array.from(files).slice(0, remaining)) {
      await uploadImage(task.id, file);
    }
  }, [task.id, task.images?.length, uploadImage]);

  const getImageUrl = (path: string) => supabase.storage.from('task-images').getPublicUrl(path).data.publicUrl;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: font.size.base,
    color: colors.text.primary,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <>
    {/* Overlay for click-outside */}
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        top: '60px',
        zIndex: 29,
        backgroundColor: visible ? 'rgba(0,0,0,0.2)' : 'transparent',
        transition: 'background-color 250ms ease-out',
      }}
    />
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: 0,
        top: '60px',
        bottom: 0,
        width: '400px',
        backgroundColor: colors.bg.surface,
        borderLeft: `1px solid ${colors.border.default}`,
        overflowY: 'auto',
        zIndex: 30,
        boxShadow: shadow.panel,
        fontFamily: font.family,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${colors.border.default}` }}>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Task Detail</span>
        <button onClick={handleClose} style={{ color: colors.text.muted, cursor: 'pointer', background: 'none', border: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          style={{ width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em', fontFamily: 'inherit' }}
        />

        {/* Status */}
        <Section label="Status">
          <div style={{ display: 'flex', gap: '8px' }}>
            {STATUSES.map((s) => (
              <SelectorBtn key={s} active={task.status === s} onClick={() => updateTask(task.id, { status: s })}>
                <StatusCircle status={s} size={14} />
                {s === 'todo' ? 'To Do' : s === 'wip' ? 'In Progress' : 'Done'}
              </SelectorBtn>
            ))}
          </div>
        </Section>

        {/* Category */}
        <Section label="Category">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {teamCategories.map((cat) => (
              <SelectorBtn key={cat.key} active={task.category === cat.key} onClick={() => updateTask(task.id, { category: cat.key as any })} accentColor={task.category === cat.key ? cat.color : undefined}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color, display: 'inline-block' }} />
                {cat.label}
              </SelectorBtn>
            ))}
          </div>
        </Section>

        {/* Assignees (multi-select) */}
        <div>
          <SectionLabel>Assignees</SectionLabel>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {(task.assignees || []).map((id) => {
              const m = members.find((mm) => mm.id === id);
              if (!m) return null;
              return (
                <span key={id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px 3px 4px', borderRadius: '16px',
                  backgroundColor: colors.bg.surfaceActive, fontSize: font.size.xs,
                  color: colors.text.primary,
                }}>
                  <Avatar name={m.display_name} url={m.avatar_url} size={18} />
                  {m.display_name}
                  <button onClick={() => {
                    const next = (task.assignees || []).filter((a) => a !== id);
                    updateTask(task.id, { assignees: next, assigned_to: next[0] || null });
                  }} style={{ background: 'none', border: 'none', color: colors.text.muted, cursor: 'pointer', fontSize: '10px', padding: '0 2px' }}>✕</button>
                </span>
              );
            })}
          </div>
          <select value="" onChange={(e) => {
            if (!e.target.value) return;
            const next = [...(task.assignees || []), e.target.value];
            updateTask(task.id, { assignees: next, assigned_to: next[0] || null });
            e.target.value = '';
          }} style={{ ...inputStyle, appearance: 'auto' as any, fontSize: font.size.xs, color: colors.text.muted }}>
            <option value="">+ Add assignee...</option>
            {members.filter((m) => !(task.assignees || []).includes(m.id)).map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        {/* Due Date + Project Number */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Due Date</SectionLabel>
            <input type="date" value={task.due_date || ''} onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })} style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>Project #</SectionLabel>
            <input type="text" value={task.project_number || ''} onChange={(e) => updateTask(task.id, { project_number: e.target.value || null })} placeholder="e.g. P-2024-031" style={inputStyle} />
          </div>
        </div>

        {/* Goal Link */}
        <Section label="Linked Goal">
          <select value={task.goal_id || ''} onChange={(e) => updateTask(task.id, { goal_id: e.target.value || null })} style={{ ...inputStyle, appearance: 'auto' as any }}>
            <option value="">No goal linked</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title} ({g.progress}%)</option>)}
          </select>
        </Section>

        {/* Knowledge Link */}
        <Section label="Linked Article">
          <select value={task.knowledge_article_id || ''} onChange={(e) => updateTask(task.id, { knowledge_article_id: e.target.value || null })} style={{ ...inputStyle, appearance: 'auto' as any }}>
            <option value="">No article linked</option>
            {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </Section>

        {/* Dependencies (this task depends on) */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
          <SectionLabel>Blocked By</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {taskDeps.map((dep) => {
              const blockerTask = allTasks.find((t) => t.id === dep.depends_on);
              if (!blockerTask) return null;
              return (
                <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', backgroundColor: colors.bg.primary, borderRadius: '6px', border: `1px solid ${colors.border.default}` }}>
                  <StatusCircle status={blockerTask.status} category={blockerTask.category} size={14} />
                  <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary }}>{blockerTask.title}</span>
                  <button onClick={() => removeDependency(dep.id)} style={{ fontSize: font.size.xs, color: colors.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                </div>
              );
            })}
          </div>
          <select
            value=""
            onChange={(e) => { if (e.target.value) { addDependency(task.id, e.target.value, task.team_id); e.target.value = ''; } }}
            style={{ ...inputStyle, appearance: 'auto' as any, fontSize: font.size.xs, color: colors.text.muted }}
          >
            <option value="">+ Add blocker...</option>
            {allTasks.filter((t) => t.id !== task.id && !taskDeps.some((d) => d.depends_on === t.id)).map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Blocks (tasks that depend on this one) */}
        {taskBlocks.length > 0 && (
          <div>
            <SectionLabel>Blocks</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {taskBlocks.map((dep) => {
                const blockedTask = allTasks.find((t) => t.id === dep.task_id);
                if (!blockedTask) return null;
                return (
                  <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', backgroundColor: colors.bg.primary, borderRadius: '6px', border: `1px solid ${colors.border.default}` }}>
                    <StatusCircle status={blockedTask.status} category={blockedTask.category} size={14} />
                    <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary }}>{blockedTask.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Approval + Time Tracking */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <SectionLabel>Approval</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => updateTask(task.id, { needs_approval: !task.needs_approval })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '6px', fontSize: font.size.sm,
                  color: task.needs_approval ? colors.status.wip : colors.text.muted,
                  backgroundColor: task.needs_approval ? `${colors.status.wip}15` : 'transparent',
                  border: `1px solid ${task.needs_approval ? colors.status.wip + '40' : colors.border.default}`,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                }}
              >
                ⚑ {task.needs_approval ? 'Flagged' : 'Flag for review'}
              </button>
              {task.needs_approval && !task.approved_by && (
                <button
                  onClick={() => updateTask(task.id, { approved_by: task.created_by, approved_at: new Date().toISOString() })}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: font.size.sm, fontWeight: font.weight.medium,
                    color: '#fff', backgroundColor: colors.status.done,
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✓ Approve
                </button>
              )}
              {task.approved_by && (
                <span style={{ fontSize: font.size.xs, color: colors.status.done }}>✓ Approved</span>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <SectionLabel>Time (hours)</SectionLabel>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <input type="number" step="0.5" min="0" value={task.time_estimate_hours || ''} onChange={(e) => updateTask(task.id, { time_estimate_hours: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Est" style={{ ...inputStyle, fontSize: font.size.xs, padding: '6px 8px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" step="0.5" min="0" value={task.time_actual_hours || ''} onChange={(e) => updateTask(task.id, { time_actual_hours: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Actual" style={{ ...inputStyle, fontSize: font.size.xs, padding: '6px 8px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
          <SubtaskList taskId={task.id} subtasks={task.subtasks || []} category={task.category} />
        </div>

        {/* Notes */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
          <SectionLabel>Notes</SectionLabel>
          <div style={{ backgroundColor: colors.bg.primary, border: `1px solid ${colors.border.default}`, borderRadius: '8px', overflow: 'hidden' }}>
            {/* Rich text toolbar */}
            {editor && (
              <div style={{
                display: 'flex', gap: '2px', padding: '6px 8px',
                borderBottom: `1px solid ${colors.border.default}`,
                flexWrap: 'wrap',
              }}>
                <EditorBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</EditorBtn>
                <EditorBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</EditorBtn>
                <EditorBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</EditorBtn>
                <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default, margin: '0 4px', alignSelf: 'center' }} />
                <EditorBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)"><strong>B</strong></EditorBtn>
                <EditorBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)"><em>I</em></EditorBtn>
                <EditorBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></EditorBtn>
                <EditorBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">{'<>'}</EditorBtn>
                <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default, margin: '0 4px', alignSelf: 'center' }} />
                <EditorBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="3" cy="10" r="1.2" fill="currentColor"/><line x1="6" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2"/><line x1="6" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2"/><line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2"/></svg>
                </EditorBtn>
                <EditorBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><text x="1" y="5.5" fontSize="5" fill="currentColor" fontFamily="inherit">1</text><text x="1" y="8.5" fontSize="5" fill="currentColor" fontFamily="inherit">2</text><text x="1" y="11.5" fontSize="5" fill="currentColor" fontFamily="inherit">3</text><line x1="6" y1="4" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2"/><line x1="6" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2"/><line x1="6" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="1.2"/></svg>
                </EditorBtn>
                <EditorBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3v8M6 5h5M6 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </EditorBtn>
                <EditorBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
                  {'{ }'}
                </EditorBtn>
                <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default, margin: '0 4px', alignSelf: 'center' }} />
                <EditorBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">—</EditorBtn>
              </div>
            )}
            <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Attachments (images, PDFs, videos) */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
          <SectionLabel>Attachments</SectionLabel>
          {/* Images */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
            {task.images?.map((img) => (
              <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', backgroundColor: colors.bg.primary }}>
                <img src={getImageUrl(img.storage_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => deleteImage(img.id, img.storage_path)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,video/*" multiple style={{ display: 'none' }} onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
          <button onClick={() => fileInputRef.current?.click()} style={{
            width: '100%', padding: '10px', backgroundColor: 'transparent',
            border: `1px dashed ${colors.border.default}`, borderRadius: '8px',
            color: colors.text.secondary, fontSize: font.size.sm, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Upload files (images, PDF, video)
          </button>
        </div>

        {/* Comments */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px' }}>
          <CommentThread taskId={task.id} teamId={task.team_id} authorId={task.created_by} members={members} />
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${colors.border.default}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: font.size.xs, color: colors.text.muted }}>
            {task.created_profile && (
              <>
                <span>Created by</span>
                <Avatar name={task.created_profile.display_name} size={16} />
                <span>{task.created_profile.display_name}</span>
              </>
            )}
            <span>· {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
          </div>

          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: font.size.sm, color: colors.danger }}>Delete this task?</span>
              <button onClick={() => { deleteTask(task.id); handleClose(); }} style={{ padding: '4px 10px', backgroundColor: colors.danger, color: 'white', fontSize: font.size.sm, borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '4px 10px', backgroundColor: 'transparent', color: colors.text.secondary, fontSize: font.size.sm, borderRadius: '4px', border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSendToSync} style={{ padding: '4px 10px', backgroundColor: 'transparent', color: colors.accent.purple, fontSize: font.size.sm, borderRadius: '4px', border: `1px solid ${colors.accent.purple}30`, cursor: 'pointer', fontFamily: 'inherit' }}>
                {syncSent ? '✓ Added to Sync' : 'Send to Sync'}
              </button>
              <button onClick={() => setConfirmDelete(true)} style={{ padding: '4px 10px', backgroundColor: 'transparent', color: colors.danger, fontSize: font.size.sm, borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

function SelectorBtn({ active, onClick, children, accentColor }: { active: boolean; onClick: () => void; children: React.ReactNode; accentColor?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: font.size.sm,
        fontWeight: font.weight.medium,
        color: active ? colors.text.primary : colors.text.secondary,
        backgroundColor: active ? colors.bg.surfaceActive : (hovered ? colors.bg.surfaceHover : 'transparent'),
        border: `1px solid ${active ? (accentColor || colors.border.focus) : colors.border.default}`,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms ease-out',
      }}
    >
      {children}
    </button>
  );
}

function EditorBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        fontSize: font.size.xs,
        color: active ? colors.accent.purple : (hovered ? colors.text.primary : colors.text.muted),
        backgroundColor: active ? colors.accent.purpleSubtle : (hovered ? colors.bg.surfaceHover : 'transparent'),
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 100ms',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}
