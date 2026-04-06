import { useEffect, useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { FilterBar } from './components/layout/FilterBar';
import { NewTaskInput } from './components/task/NewTaskInput';
import { ListView } from './views/ListView';
import { CanvasView } from './views/CanvasView';
import { VaultView } from './views/VaultView';
import { ReportModal } from './components/report/ReportModal';
import { useTaskStore } from './stores/taskStore';
import { useUIStore } from './stores/uiStore';
import { colors, font } from './lib/theme';
import type { Profile, TaskCategory, TaskStatus } from './lib/types';

const TEAM_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PROFILE: Profile = {
  id: '9546450a-9299-4fd6-b859-7b3f25753c48',
  team_id: TEAM_ID,
  display_name: 'Andy',
  avatar_url: null,
  role: 'admin',
};

const SEED_TASKS: { title: string; category: TaskCategory; status: TaskStatus }[] = [
  { title: 'Prepare ML workshop slides', category: 'education', status: 'wip' },
  { title: 'Schedule guest lecturer for AI ethics', category: 'education', status: 'todo' },
  { title: 'Review intern training curriculum', category: 'education', status: 'done' },
  { title: 'Update Grasshopper tutorial videos', category: 'education', status: 'todo' },
  { title: 'Organize lunch-and-learn series', category: 'education', status: 'wip' },
  { title: 'Set up shared GPU server access', category: 'resources', status: 'todo' },
  { title: 'Evaluate Rhino 8 licenses', category: 'resources', status: 'wip' },
  { title: 'Migrate assets to new NAS', category: 'resources', status: 'done' },
  { title: 'Benchmark rendering pipeline', category: 'resources', status: 'todo' },
  { title: 'Document API keys and credentials', category: 'resources', status: 'wip' },
  { title: 'Fix Revit plugin crash on export', category: 'support', status: 'wip' },
  { title: 'Help BIM team with Dynamo scripts', category: 'support', status: 'todo' },
  { title: 'Debug data dashboard loading issue', category: 'support', status: 'done' },
  { title: 'Respond to IT security audit', category: 'support', status: 'todo' },
  { title: 'Set up VPN for remote team', category: 'support', status: 'wip' },
  { title: 'Plan Q3 roadmap', category: 'admin', status: 'todo' },
  { title: 'Update team wiki and onboarding docs', category: 'admin', status: 'wip' },
  { title: 'Submit conference travel request', category: 'admin', status: 'done' },
  { title: 'Review and approve timesheets', category: 'admin', status: 'todo' },
  { title: 'Coordinate with HR on new hires', category: 'admin', status: 'todo' },
];

export default function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const tasks = useTaskStore((s) => s.tasks);
  const { viewMode, setViewMode, reportModalOpen, setReportModalOpen } = useUIStore();
  const [seeding, setSeeding] = useState(false);
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('admin');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchTasks(TEAM_ID); }, [fetchTasks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        createTask({ team_id: TEAM_ID, created_by: DEMO_PROFILE.id, title: 'New Task', status: 'todo', category: newTaskCategory });
      }
      if (e.key === '1') setViewMode('list');
      if (e.key === '2') setViewMode('canvas');
      if (e.key === '3') setViewMode('vault');
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) setReportModalOpen(true);
      if (e.key === 'Escape') { setReportModalOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createTask, newTaskCategory, setViewMode, setReportModalOpen]);

  const handleSeed = async () => {
    setSeeding(true);
    for (const t of SEED_TASKS) {
      await createTask({ team_id: TEAM_ID, created_by: DEMO_PROFILE.id, title: t.title, status: t.status, category: t.category });
    }
    setSeeding(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.primary, fontFamily: font.family }}>
      <TopBar profile={DEMO_PROFILE} onSignOut={() => {}} />

      {viewMode === 'list' && (
        <>
          <FilterBar members={[DEMO_PROFILE]} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <NewTaskInput teamId={TEAM_ID} createdBy={DEMO_PROFILE.id} category={newTaskCategory} onCategoryChange={setNewTaskCategory} />
        </>
      )}

      {viewMode === 'list' ? (
        <ListView members={[DEMO_PROFILE]} searchQuery={searchQuery} />
      ) : viewMode === 'canvas' ? (
        <CanvasView teamId={TEAM_ID} userId={DEMO_PROFILE.id} members={[DEMO_PROFILE]} />
      ) : (
        <VaultView teamId={TEAM_ID} userId={DEMO_PROFILE.id} />
      )}

      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} members={[DEMO_PROFILE]} />

      {/* Keyboard shortcuts hint */}
      <div style={{
        position: 'fixed', bottom: '16px', right: '16px', fontSize: font.size.xs, color: colors.text.muted,
        backgroundColor: 'rgba(26,26,26,0.9)', padding: '6px 10px', borderRadius: '6px',
        border: `1px solid ${colors.border.default}`, zIndex: 5, lineHeight: 1.6,
      }}>
        <span style={{ color: colors.text.secondary }}>N</span> new task &nbsp;
        <span style={{ color: colors.text.secondary }}>1/2/3</span> views &nbsp;
        <span style={{ color: colors.text.secondary }}>R</span> report
      </div>

      {tasks.length < 10 && (
        <button onClick={handleSeed} disabled={seeding} style={{
          position: 'fixed', bottom: '16px', left: '16px', padding: '8px 16px',
          backgroundColor: seeding ? colors.bg.surfaceActive : colors.bg.surface,
          color: seeding ? colors.text.muted : colors.accent.purple,
          fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '8px',
          border: `1px solid ${colors.border.default}`, cursor: seeding ? 'not-allowed' : 'pointer',
          fontFamily: font.family, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {seeding ? 'Seeding...' : 'Seed 20 Demo Tasks'}
        </button>
      )}
    </div>
  );
}
