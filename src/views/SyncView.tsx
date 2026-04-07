import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { format, startOfWeek } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useTaskStore } from '../stores/taskStore';
import { colors, font } from '../lib/theme';
import type { Profile } from '../lib/types';

interface SyncNote {
  id: string;
  team_id: string;
  title: string;
  date: string;
  content: string;
  created_by: string;
}

interface SyncViewProps {
  teamId: string;
  userId: string;
  members: Profile[];
  onPresent: (content: string) => void;
}

export function SyncView({ teamId, userId, members, onPresent }: SyncViewProps) {
  const [notes, setNotes] = useState<SyncNote[]>([]);
  const [currentNote, setCurrentNote] = useState<SyncNote | null>(null);

  const thisWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  useEffect(() => {
    supabase.from('meeting_notes').select('*').eq('team_id', teamId).order('date', { ascending: false }).then(({ data }) => {
      setNotes(data || []);
      const current = data?.find((n: any) => n.date === thisWeek);
      if (current) setCurrentNote(current);
    });
  }, [teamId, thisWeek]);

  const createThisWeek = async () => {
    // Build template with member sections
    const memberNames = members.map((m) => m.display_name);
    const template = memberNames.map((name) => `<h2>${name}</h2><ul><li></li></ul>`).join('') + '<hr><p></p>';

    const { data } = await supabase.from('meeting_notes').insert({
      team_id: teamId,
      title: `Sync — Week of ${format(new Date(thisWeek), 'MMM d, yyyy')}`,
      date: thisWeek,
      content: template,
      created_by: userId,
    }).select().single();
    if (data) {
      setCurrentNote(data);
      setNotes((prev) => [data, ...prev]);
    }
  };

  const pastNotes = notes.filter((n) => n.date !== thisWeek);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', fontFamily: font.family }}>
      {/* Sidebar — past syncs */}
      <div style={{
        width: '240px', borderRight: `1px solid ${colors.border.default}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border.default}` }}>
          <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>Syncs</h2>
        </div>

        {/* This week */}
        <button
          onClick={() => currentNote ? setCurrentNote(currentNote) : createThisWeek()}
          style={{
            width: '100%', textAlign: 'left', padding: '12px 20px',
            backgroundColor: currentNote && currentNote.date === thisWeek ? colors.bg.surfaceActive : 'transparent',
            borderBottom: `1px solid ${colors.border.subtle}`, border: 'none',
            borderLeft: `3px solid ${colors.accent.purple}`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: colors.text.primary }}>This Week</div>
          <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>{format(new Date(thisWeek), 'MMM d')}</div>
        </button>

        {/* Past weeks */}
        {pastNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => setCurrentNote(note)}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 20px',
              backgroundColor: currentNote?.id === note.id ? colors.bg.surfaceActive : 'transparent',
              borderBottom: `1px solid ${colors.border.subtle}`, border: 'none',
              borderLeft: '3px solid transparent',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: font.size.sm, color: colors.text.primary }}>{note.title}</div>
            <div style={{ fontSize: font.size.xs, color: colors.text.muted }}>{format(new Date(note.date), 'MMM d')}</div>
          </button>
        ))}
      </div>

      {/* Editor */}
      {currentNote ? (
        <SyncEditor
          key={currentNote.id}
          note={currentNote}
          onUpdate={(content) => {
            supabase.from('meeting_notes').update({ content }).eq('id', currentNote.id);
            setCurrentNote({ ...currentNote, content });
          }}
          onPresent={() => onPresent(currentNote.content)}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text.muted }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: font.size.lg, marginBottom: '8px' }}>No sync for this week yet</p>
            <button onClick={createThisWeek} style={{
              padding: '10px 20px', backgroundColor: colors.accent.purple, color: '#fff',
              fontSize: font.size.sm, fontWeight: 500, borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Start This Week's Sync</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SyncEditor({ note, onUpdate, onPresent }: { note: SyncNote; onUpdate: (content: string) => void; onPresent: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [slashMenu, setSlashMenu] = useState<{ x: number; y: number } | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [taskSearch, setTaskSearch] = useState<{ x: number; y: number } | null>(null);
  const [taskQuery, setTaskQuery] = useState('');
  const tasks = useTaskStore((s) => s.tasks);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Type / for commands...' }),
    ],
    content: note.content || '',
    onBlur: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onUpdate: ({ editor }) => {
      // Detect slash command
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n');
      const slashMatch = textBefore.match(/\/(\w*)$/);
      if (slashMatch) {
        setSlashFilter(slashMatch[1].toLowerCase());
        // Get cursor position for menu
        const coords = editor.view.coordsAtPos(from);
        setSlashMenu({ x: coords.left, y: coords.bottom + 4 });
        setTaskSearch(null);
      } else {
        setSlashMenu(null);
        setSlashFilter('');
      }
    },
  });

  const SLASH_COMMANDS = [
    { key: 'h1', label: 'Heading 1', desc: 'Large section header', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 1 }).run() },
    { key: 'h2', label: 'Heading 2', desc: 'Medium section header', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: 'Heading 3', desc: 'Small section header', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleHeading({ level: 3 }).run() },
    { key: 'bullet', label: 'Bullet List', desc: 'Unordered list', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleBulletList().run() },
    { key: 'numbered', label: 'Numbered List', desc: 'Ordered list', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleOrderedList().run() },
    { key: 'quote', label: 'Quote', desc: 'Block quote', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleBlockquote().run() },
    { key: 'code', label: 'Code Block', desc: 'Code snippet', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).toggleCodeBlock().run() },
    { key: 'divider', label: 'Divider', desc: 'Horizontal line', action: () => editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).setHorizontalRule().run() },
    { key: 'highlight', label: 'Highlight', desc: 'Yellow highlight', action: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).run(); editor?.chain().focus().toggleHighlight({ color: '#FBBF24' }).run(); } },
    { key: 'task', label: 'Insert Task', desc: 'Embed a task link', action: () => {
      const coords = editor?.view.coordsAtPos(editor.state.selection.from);
      editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).run();
      if (coords) setTaskSearch({ x: coords.left, y: coords.bottom + 4 });
      setSlashMenu(null);
    }},
    { key: 'image', label: 'Image', desc: 'Upload an image', action: () => { editor?.chain().focus().deleteRange({ from: editor.state.selection.from - slashFilter.length - 1, to: editor.state.selection.from }).run(); fileRef.current?.click(); } },
  ];

  const filteredCommands = SLASH_COMMANDS.filter((c) =>
    c.key.includes(slashFilter) || c.label.toLowerCase().includes(slashFilter)
  );

  const executeSlashCommand = useCallback((cmd: typeof SLASH_COMMANDS[0]) => {
    cmd.action();
    setSlashMenu(null);
    setSlashFilter('');
  }, []);

  const insertTaskLink = useCallback((_taskId: string, title: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(`<strong>📋 ${title}</strong> `).run();
    setTaskSearch(null);
    setTaskQuery('');
  }, [editor]);

  const uploadImage = async (file: File) => {
    const path = `sync-images/${note.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await supabase.storage.from('task-images').upload(path, file);
    const url = supabase.storage.from('task-images').getPublicUrl(path).data.publicUrl;
    if (editor) editor.chain().focus().setImage({ src: url }).run();
  };

  // Close menus on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSlashMenu(null); setTaskSearch(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredTasks = tasks.filter((t) => t.title.toLowerCase().includes(taskQuery.toLowerCase())).slice(0, 8);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 24px', borderBottom: `1px solid ${colors.border.default}`,
      }}>
        <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0, flex: 1 }}>
          {note.title}
        </h3>

        {editor && (
          <div style={{ display: 'flex', gap: '2px' }}>
            <FmtBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</FmtBtn>
            <FmtBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></FmtBtn>
            <FmtBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></FmtBtn>
            <FmtBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#FBBF24' }).run()}>
              <span style={{ backgroundColor: '#FBBF2440', padding: '0 3px', borderRadius: '2px' }}>H</span>
            </FmtBtn>
            <div style={{ width: '1px', height: '16px', backgroundColor: colors.border.default, margin: '0 2px', alignSelf: 'center' }} />
            <FmtBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</FmtBtn>
            <FmtBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</FmtBtn>
            <FmtBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</FmtBtn>
            <div style={{ width: '1px', height: '16px', backgroundColor: colors.border.default, margin: '0 2px', alignSelf: 'center' }} />
            <FmtBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="2" cy="3" r="1" fill="currentColor"/><circle cx="2" cy="6" r="1" fill="currentColor"/><circle cx="2" cy="9" r="1" fill="currentColor"/><line x1="5" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1"/><line x1="5" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1"/><line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1"/></svg>
            </FmtBtn>
            <FmtBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</FmtBtn>
            <FmtBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</FmtBtn>
            <FmtBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</FmtBtn>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
        <button onClick={() => fileRef.current?.click()} style={{
          padding: '4px 8px', borderRadius: '4px', backgroundColor: 'transparent',
          border: `1px solid ${colors.border.default}`, color: colors.text.muted,
          cursor: 'pointer', fontSize: font.size.xs, fontFamily: 'inherit',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="5.5" r="1" stroke="currentColor" strokeWidth="1"/><path d="M1.5 9.5L4.5 7L7 9L9.5 6.5L12.5 9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button onClick={onPresent} style={{
          padding: '6px 14px', backgroundColor: colors.accent.purple, color: '#fff',
          fontSize: font.size.xs, fontWeight: 500, borderRadius: '6px', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Present</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px', position: 'relative' }}>
        <EditorContent editor={editor} />

        {/* Slash command menu */}
        {slashMenu && filteredCommands.length > 0 && (
          <div style={{
            position: 'fixed', left: slashMenu.x, top: slashMenu.y,
            width: '240px', maxHeight: '300px', overflowY: 'auto',
            backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
            borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: '4px', zIndex: 100, fontFamily: font.family,
          }}>
            <div style={{ padding: '6px 10px', fontSize: '10px', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commands</div>
            {filteredCommands.map((cmd) => (
              <SlashMenuItem key={cmd.key} label={cmd.label} desc={cmd.desc} onClick={() => executeSlashCommand(cmd)} />
            ))}
          </div>
        )}

        {/* Task search popup */}
        {taskSearch && (
          <div style={{
            position: 'fixed', left: taskSearch.x, top: taskSearch.y,
            width: '300px', maxHeight: '320px',
            backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
            borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            padding: '8px', zIndex: 100, fontFamily: font.family,
          }}>
            <input
              autoFocus
              value={taskQuery}
              onChange={(e) => setTaskQuery(e.target.value)}
              placeholder="Search tasks..."
              style={{
                width: '100%', padding: '8px 10px', backgroundColor: colors.bg.primary,
                border: `1px solid ${colors.border.default}`, borderRadius: '6px',
                fontSize: font.size.sm, color: colors.text.primary, outline: 'none',
                fontFamily: 'inherit', marginBottom: '6px',
              }}
            />
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filteredTasks.map((task) => (
                <button key={task.id} onClick={() => insertTaskLink(task.id, task.title)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: 'transparent', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 100ms',
                  fontSize: font.size.sm, color: colors.text.primary,
                }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.bg.surfaceHover)}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: task.status === 'done' ? colors.status.done : task.status === 'wip' ? colors.status.wip : colors.status.todo,
                    flexShrink: 0,
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                </button>
              ))}
              {filteredTasks.length === 0 && (
                <p style={{ fontSize: font.size.xs, color: colors.text.muted, textAlign: 'center', padding: '12px' }}>No tasks found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SlashMenuItem({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setH(true)} onMouseOut={() => setH(false)} style={{
      width: '100%', textAlign: 'left', padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: '1px',
      backgroundColor: h ? colors.bg.surfaceHover : 'transparent', border: 'none', borderRadius: '6px',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 100ms',
    }}>
      <span style={{ fontSize: font.size.sm, fontWeight: font.weight.medium, color: colors.text.primary }}>{label}</span>
      <span style={{ fontSize: '10px', color: colors.text.muted }}>{desc}</span>
    </button>
  );
}

function FmtBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '4px', fontSize: font.size.xs,
      color: active ? colors.accent.purple : colors.text.muted,
      backgroundColor: active ? colors.accent.purpleSubtle : 'transparent',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
    }}>{children}</button>
  );
}
