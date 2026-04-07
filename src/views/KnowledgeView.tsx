import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { format } from 'date-fns';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { colors, font } from '../lib/theme';
import type { KnowledgeArticle, KnowledgeCategory } from '../lib/types';

const KB_CATEGORIES: { value: KnowledgeCategory; label: string; icon: string }[] = [
  { value: 'workflow', label: 'Workflow', icon: '⚡' },
  { value: 'guide', label: 'Guide', icon: '📖' },
  { value: 'link', label: 'Links', icon: '🔗' },
  { value: 'reference', label: 'Reference', icon: '📐' },
  { value: 'draft', label: 'Draft', icon: '📝' },
  { value: 'general', label: 'General', icon: '📌' },
];

interface KnowledgeViewProps {
  teamId: string;
  userId: string;
}

export function KnowledgeView({ teamId, userId }: KnowledgeViewProps) {
  const { articles, loading, fetchArticles, createArticle, updateArticle, deleteArticle } = useKnowledgeStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<KnowledgeCategory | null>(null);

  useEffect(() => { fetchArticles(teamId); }, [teamId, fetchArticles]);

  // Auto-select the most recent article if none selected
  useEffect(() => {
    if (!selectedId && articles.length > 0) {
      setSelectedId(articles[0].id);
    }
  }, [articles, selectedId]);

  const filtered = articles.filter((a) => {
    if (filterCategory && a.category !== filterCategory) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = articles.find((a) => a.id === selectedId) || null;

  const handleNew = async () => {
    const article = await createArticle({ team_id: teamId, title: 'Untitled', created_by: userId, category: 'general' });
    if (article) setSelectedId(article.id);
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', fontFamily: font.family }}>
      {/* Sidebar — article list */}
      <div style={{ width: '320px', borderRight: `1px solid ${colors.border.default}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border.default}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: font.size.lg, fontWeight: font.weight.semibold, color: colors.text.primary, margin: 0 }}>Knowledge</h2>
            <button onClick={handleNew} style={{
              padding: '5px 12px', backgroundColor: colors.accent.purple, color: '#fff',
              fontSize: font.size.xs, fontWeight: font.weight.medium, borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>+ New</button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles..." style={{
              width: '100%', padding: '7px 10px 7px 30px', backgroundColor: colors.bg.primary,
              border: `1px solid ${colors.border.default}`, borderRadius: '6px',
              fontSize: font.size.xs, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
            }} />
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="6" cy="6" r="4.5" stroke={colors.text.muted} strokeWidth="1.2" /><path d="M9.5 9.5L12.5 12.5" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '4px', padding: '8px 20px', flexWrap: 'wrap', borderBottom: `1px solid ${colors.border.default}` }}>
          <FilterPill active={filterCategory === null} onClick={() => setFilterCategory(null)}>All</FilterPill>
          {KB_CATEGORIES.map((c) => (
            <FilterPill key={c.value} active={filterCategory === c.value} onClick={() => setFilterCategory(filterCategory === c.value ? null : c.value)}>
              {c.icon} {c.label}
            </FilterPill>
          ))}
        </div>

        {/* Article list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <p style={{ padding: '20px', color: colors.text.muted, fontSize: font.size.sm }}>Loading...</p>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text.muted }}>
              <p style={{ fontSize: font.size.md }}>No articles yet</p>
              <p style={{ fontSize: font.size.xs, marginTop: '4px' }}>Create one to start your knowledge base</p>
            </div>
          )}
          {filtered.map((article) => (
            <ArticleListItem
              key={article.id}
              article={article}
              selected={selectedId === article.id}
              onClick={() => setSelectedId(article.id)}
            />
          ))}
        </div>
      </div>

      {/* Editor — right side */}
      {selected ? (
        <ArticleEditor
          key={selected.id}
          article={selected}
          onUpdate={(updates) => updateArticle(selected.id, updates)}
          onDelete={() => { deleteArticle(selected.id); setSelectedId(null); }}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text.muted }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: font.size.lg }}>Select an article or create a new one</p>
            <p style={{ fontSize: font.size.sm, marginTop: '4px' }}>Your team's shared knowledge lives here</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleListItem({ article, selected, onClick }: { article: KnowledgeArticle; selected: boolean; onClick: () => void }) {
  const catInfo = KB_CATEGORIES.find((c) => c.value === article.category);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 20px',
        backgroundColor: selected ? colors.bg.surfaceActive : (hovered ? colors.bg.surfaceHover : 'transparent'),
        borderBottom: `1px solid ${colors.border.subtle}`, borderLeft: selected ? `3px solid ${colors.accent.purple}` : '3px solid transparent',
        cursor: 'pointer', fontFamily: 'inherit', border: 'none', borderRight: 'none',
        borderBottomStyle: 'solid', borderBottomColor: colors.border.subtle, borderBottomWidth: '1px',
        borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: selected ? colors.accent.purple : 'transparent',
        transition: 'all 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        {article.pinned && <span style={{ fontSize: '10px' }}>📌</span>}
        <span style={{ fontSize: font.size.base, fontWeight: font.weight.medium, color: colors.text.primary }}>{article.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{catInfo?.icon} {catInfo?.label}</span>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>{format(new Date(article.updated_at), 'MMM d')}</span>
      </div>
    </button>
  );
}

function ArticleEditor({ article, onUpdate, onDelete }: { article: KnowledgeArticle; onUpdate: (u: Partial<KnowledgeArticle>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(article.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'Start writing...' })],
    content: article.content || '',
    onBlur: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== article.content) onUpdate({ content: html });
    },
  });

  const handleTitleBlur = () => {
    if (title.trim() && title !== article.title) onUpdate({ title: title.trim() });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderBottom: `1px solid ${colors.border.default}` }}>
        <select value={article.category} onChange={(e) => onUpdate({ category: e.target.value as any })} style={{
          backgroundColor: colors.bg.primary, border: `1px solid ${colors.border.default}`, borderRadius: '6px',
          padding: '4px 8px', fontSize: font.size.xs, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
        }}>
          {KB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>

        <button onClick={() => onUpdate({ pinned: !article.pinned })} style={{
          padding: '4px 8px', fontSize: font.size.xs,
          color: article.pinned ? colors.accent.purple : colors.text.muted,
          backgroundColor: article.pinned ? colors.accent.purpleSubtle : 'transparent',
          border: `1px solid ${article.pinned ? colors.accent.purple + '40' : colors.border.default}`,
          borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
        }}>{article.pinned ? '📌 Pinned' : 'Pin'}</button>

        {/* Formatting buttons */}
        {editor && (
          <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
            <FmtBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</FmtBtn>
            <FmtBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></FmtBtn>
            <FmtBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</FmtBtn>
            <FmtBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</FmtBtn>
            <FmtBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</FmtBtn>
            <FmtBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'{ }'}</FmtBtn>
            <FmtBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</FmtBtn>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {confirmDelete ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={onDelete} style={{ padding: '4px 10px', fontSize: font.size.xs, color: '#fff', backgroundColor: colors.danger, borderRadius: '4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Confirm</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '4px 10px', fontSize: font.size.xs, color: colors.text.muted, backgroundColor: 'transparent', borderRadius: '4px', border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} style={{ padding: '4px 8px', fontSize: font.size.xs, color: colors.text.muted, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
        )}

        <span style={{ fontSize: font.size.xs, color: colors.text.muted }}>Updated {format(new Date(article.updated_at), 'MMM d, h:mm a')}</span>
      </div>

      {/* Title + content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          style={{
            width: '100%', fontSize: '24px', fontWeight: font.weight.semibold, color: colors.text.primary,
            backgroundColor: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit',
            letterSpacing: '-0.01em', marginBottom: '16px',
          }}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 10px', borderRadius: '12px', fontSize: font.size.xs, fontWeight: font.weight.medium,
      color: active ? colors.accent.purple : colors.text.muted,
      backgroundColor: active ? colors.accent.purpleSubtle : 'transparent',
      border: `1px solid ${active ? colors.accent.purple + '40' : 'transparent'}`,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
    }}>{children}</button>
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
