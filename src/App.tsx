import { useEffect, useState } from 'react';
import { _bindThemeStore } from './lib/theme';
import { useThemeStore } from './stores/themeStore';

// Bind the theme store to the theme bridge immediately
_bindThemeStore(() => useThemeStore.getState().theme);

import { TopBar } from './components/layout/TopBar';
import { FilterBar } from './components/layout/FilterBar';
import { NewTaskInput } from './components/task/NewTaskInput';
import { ListView } from './views/ListView';
import { CanvasView } from './views/CanvasView';
import { VaultView } from './views/VaultView';
import { KnowledgeView } from './views/KnowledgeView';
import { GoalsView } from './views/GoalsView';
import { CalendarView } from './views/CalendarView';
import { DashboardView } from './views/DashboardView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportModal } from './components/report/ReportModal';
import { QuickAddModal } from './components/task/QuickAddModal';
import { TextToTasks } from './components/task/TextToTasks';
import { CategoryEditor } from './components/ui/CategoryEditor';
import { ThemeSelector } from './components/ui/ThemeSelector';
import { InstallBanner } from './components/ui/InstallBanner';
import { PresentView } from './views/PresentView';
import { ZenView } from './views/ZenView';
import { SyncView } from './views/SyncView';
import { useTaskStore } from './stores/taskStore';
import { useSubscriptionStore } from './stores/subscriptionStore';
import { useKnowledgeStore } from './stores/knowledgeStore';
import { useGoalStore } from './stores/goalStore';
import { useCategoryStore } from './stores/categoryStore';
import { useUIStore } from './stores/uiStore';
import { useRealtimeSync } from './hooks/useRealtimeSync';
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

const SEED_VAULT = [
  { name: 'Adobe Creative Cloud', url: 'https://adobe.com', username: 'team@kpf.com', password: 'AdobeTeam2024!', category: 'design' as const, cost: 54.99, billing_cycle: 'monthly' as const },
  { name: 'Figma', url: 'https://figma.com', username: 'design@kpf.com', password: 'FigmaKPF#2024', category: 'design' as const, cost: 15, billing_cycle: 'monthly' as const },
  { name: 'GitHub Organization', url: 'https://github.com', username: 'kpf-apptech', password: 'gh_pat_xxxxx', category: 'engineering' as const, cost: 21, billing_cycle: 'monthly' as const },
  { name: 'AWS Console', url: 'https://aws.amazon.com', username: 'admin@kpf.com', password: 'AwS!Kpf2024#Secure', category: 'cloud' as const, cost: 150, billing_cycle: 'monthly' as const },
  { name: 'OpenAI API', url: 'https://platform.openai.com', username: 'api@kpf.com', password: 'sk-xxxxx', category: 'ai' as const, cost: 120, billing_cycle: 'monthly' as const },
  { name: 'Slack Workspace', url: 'https://kpf.slack.com', username: 'admin@kpf.com', password: 'SlackAdmin!2024', category: 'communication' as const, cost: 8.75, billing_cycle: 'monthly' as const },
  { name: 'Notion', url: 'https://notion.so', username: 'team@kpf.com', password: 'NotionKPF#24', category: 'productivity' as const, cost: 10, billing_cycle: 'monthly' as const },
];

const SEED_KNOWLEDGE = [
  { title: 'Rhino to Revit Export Workflow', category: 'workflow' as const, content: '<h2>Steps</h2><ol><li>Export from Rhino as .3dm</li><li>Use Rhino.Inside.Revit plugin</li><li>Map layers to Revit categories</li><li>Run clash detection</li></ol>' },
  { title: 'Setting Up a New GPU Render Node', category: 'guide' as const, content: '<h2>Prerequisites</h2><ul><li>NVIDIA RTX 4090 or better</li><li>Ubuntu 22.04 LTS</li><li>CUDA 12.x</li></ul><p>Follow the IT setup guide in SharePoint and register the node in our render farm dashboard.</p>' },
  { title: 'Useful Links', category: 'link' as const, content: '<ul><li><strong>SharePoint</strong> - Internal docs</li><li><strong>Jira Board</strong> - Legacy tickets</li><li><strong>Render Farm</strong> - GPU cluster dashboard</li><li><strong>Design Library</strong> - Material samples</li></ul>' },
  { title: 'Python Environment Setup', category: 'guide' as const, content: '<h2>Setup</h2><pre><code>conda create -n kpf python=3.11\nconda activate kpf\npip install -r requirements.txt</code></pre><p>Always use the shared conda environment for consistency.</p>' },
  { title: 'Weekly Standup Format (Draft)', category: 'draft' as const, content: '<p>Each person covers:</p><ol><li>What I shipped this week</li><li>What I\'m working on next</li><li>Any blockers</li></ol><p><em>Keep it under 2 minutes each.</em></p>' },
];

const SEED_GOALS = [
  { title: 'Launch Pulse v1 for the team', category: 'admin' as const, description: 'Get Pulse deployed, tested, and adopted by the full Applied Tech team.', progress: 65 },
  { title: 'Build ML pipeline for facade optimization', category: 'resources' as const, description: 'End-to-end ML pipeline that takes facade parameters and outputs energy performance predictions.', progress: 30 },
  { title: 'Complete intern training program', category: 'education' as const, description: 'Design and deliver a 6-week onboarding curriculum for summer interns.', progress: 45 },
  { title: 'Migrate all tools to cloud infrastructure', category: 'resources' as const, description: 'Move from on-prem render farm to AWS/Azure cloud compute.', progress: 15 },
];

export default function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const createTask = useTaskStore((s) => s.createTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const tasks = useTaskStore((s) => s.tasks);
  const createSubscription = useSubscriptionStore((s) => s.createSubscription);
  const fetchSubscriptions = useSubscriptionStore((s) => s.fetchSubscriptions);
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const deleteSubscription = useSubscriptionStore((s) => s.deleteSubscription);
  const createArticle = useKnowledgeStore((s) => s.createArticle);
  const fetchArticles = useKnowledgeStore((s) => s.fetchArticles);
  const articles = useKnowledgeStore((s) => s.articles);
  const deleteArticle = useKnowledgeStore((s) => s.deleteArticle);
  const createGoal = useGoalStore((s) => s.createGoal);
  const fetchGoals = useGoalStore((s) => s.fetchGoals);
  const goals = useGoalStore((s) => s.goals);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const { viewMode, setViewMode, reportModalOpen, setReportModalOpen } = useUIStore();
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const [seeding, setSeeding] = useState(false);
  const [newTaskCategory, setNewTaskCategory] = useState<string>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [textToTasksOpen, setTextToTasksOpen] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [syncContentForPresent, setSyncContentForPresent] = useState<string>('');
  const [zenMode, setZenMode] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const fetchDependencies = useTaskStore((s) => s.fetchDependencies);

  useEffect(() => {
    fetchTasks(TEAM_ID);
    fetchDependencies(TEAM_ID);
    fetchGoals(TEAM_ID);
    fetchArticles(TEAM_ID);
    fetchSubscriptions(TEAM_ID);
    fetchCategories(TEAM_ID);
  }, [fetchTasks, fetchDependencies, fetchGoals, fetchArticles, fetchSubscriptions, fetchCategories]);

  // Real-time sync across devices
  useRealtimeSync(TEAM_ID);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setQuickAddOpen(true); }
      if (e.key === '1') setViewMode('list');
      if (e.key === '2') setViewMode('canvas');
      if (e.key === '3') setViewMode('calendar');
      if (e.key === '4') setViewMode('goals');
      if (e.key === '5') setViewMode('knowledge');
      if (e.key === '6') setViewMode('vault');
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) setReportModalOpen(true);
      if (e.key === 'Escape') { setReportModalOpen(false); setPresentMode(false); setZenMode(false); }
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setPresentMode(true); }
      if (e.key === 'z' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setZenMode(true); }
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setTextToTasksOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createTask, newTaskCategory, setViewMode, setReportModalOpen]);

  const handleSeedTasks = async () => {
    setSeeding(true);
    for (const t of SEED_TASKS) await createTask({ team_id: TEAM_ID, created_by: DEMO_PROFILE.id, ...t });
    setSeeding(false);
  };

  const handleSeedVault = async () => {
    for (const s of SEED_VAULT) await createSubscription({ ...s, team_id: TEAM_ID, created_by: DEMO_PROFILE.id });
    fetchSubscriptions(TEAM_ID);
  };

  const handleSeedKnowledge = async () => {
    for (const a of SEED_KNOWLEDGE) await createArticle({ ...a, team_id: TEAM_ID, created_by: DEMO_PROFILE.id });
    fetchArticles(TEAM_ID);
  };

  const handleSeedGoals = async () => {
    for (const g of SEED_GOALS) await createGoal({ ...g, team_id: TEAM_ID, created_by: DEMO_PROFILE.id });
    fetchGoals(TEAM_ID);
  };

  const handleClearAll = async () => {
    if (!confirm('Delete everything? This cannot be undone.')) return;
    for (const t of [...tasks]) await deleteTask(t.id);
    for (const s of [...subscriptions]) await deleteSubscription(s.id);
    for (const a of [...articles]) await deleteArticle(a.id);
    for (const g of [...goals]) await deleteGoal(g.id);
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.primary, fontFamily: font.family, overflow: 'hidden' }}>
      <TopBar profile={DEMO_PROFILE} onSignOut={() => {}} onNewTask={() => setQuickAddOpen(true)} onPresent={() => setPresentMode(true)} onZen={() => setZenMode(true)} onTextToTasks={() => setTextToTasksOpen(true)} onTheme={() => setThemeOpen(true)} />

      {viewMode === 'list' && (
        <>
          <FilterBar members={[DEMO_PROFILE]} searchQuery={searchQuery} onSearchChange={setSearchQuery} onEditCategories={() => setCategoryEditorOpen(true)} />
          <NewTaskInput teamId={TEAM_ID} createdBy={DEMO_PROFILE.id} category={newTaskCategory} onCategoryChange={setNewTaskCategory} members={[DEMO_PROFILE]} />
        </>
      )}

      {viewMode === 'dashboard' && <DashboardView profile={DEMO_PROFILE} members={[DEMO_PROFILE]} />}
      {viewMode === 'list' && <ListView members={[DEMO_PROFILE]} searchQuery={searchQuery} />}
      {viewMode === 'canvas' && <CanvasView teamId={TEAM_ID} userId={DEMO_PROFILE.id} members={[DEMO_PROFILE]} />}
      {viewMode === 'calendar' && <CalendarView />}
      {viewMode === 'goals' && <GoalsView teamId={TEAM_ID} userId={DEMO_PROFILE.id} />}
      {viewMode === 'sync' && <SyncView teamId={TEAM_ID} userId={DEMO_PROFILE.id} members={[DEMO_PROFILE]} onPresent={(content) => { setSyncContentForPresent(content); setPresentMode(true); }} />}
      {viewMode === 'analytics' && <AnalyticsView />}
      {viewMode === 'knowledge' && <KnowledgeView teamId={TEAM_ID} userId={DEMO_PROFILE.id} />}
      {viewMode === 'vault' && <VaultView teamId={TEAM_ID} userId={DEMO_PROFILE.id} />}

      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} members={[DEMO_PROFILE]} />
      <CategoryEditor open={categoryEditorOpen} onClose={() => setCategoryEditorOpen(false)} teamId={TEAM_ID} />
      <ThemeSelector open={themeOpen} onClose={() => setThemeOpen(false)} />
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} teamId={TEAM_ID} createdBy={DEMO_PROFILE.id} />
      <TextToTasks open={textToTasksOpen} onClose={() => setTextToTasksOpen(false)} teamId={TEAM_ID} createdBy={DEMO_PROFILE.id} />
      {presentMode && <PresentView profile={DEMO_PROFILE} members={[DEMO_PROFILE]} onExit={() => { setPresentMode(false); setSyncContentForPresent(''); }} syncContent={syncContentForPresent} />}
      {zenMode && <ZenView profile={DEMO_PROFILE} onExit={() => setZenMode(false)} />}

      {/* Keyboard hints */}
      <div style={{
        position: 'fixed', bottom: '16px', right: '16px', fontSize: font.size.xs, color: colors.text.muted,
        backgroundColor: 'rgba(26,26,26,0.9)', padding: '6px 10px', borderRadius: '6px',
        border: `1px solid ${colors.border.default}`, zIndex: 5, lineHeight: 1.6,
      }}>
        <span style={{ color: colors.text.secondary }}>N</span> task &nbsp;
        <span style={{ color: colors.text.secondary }}>P</span> present &nbsp;
        <span style={{ color: colors.text.secondary }}>Z</span> zen &nbsp;
        <span style={{ color: colors.text.secondary }}>T</span> paste &nbsp;
        <span style={{ color: colors.text.secondary }}>R</span> report
      </div>

      {/* Debug buttons */}
      <div style={{ position: 'fixed', bottom: '16px', left: '16px', display: 'flex', gap: '6px', zIndex: 100, flexWrap: 'wrap', maxWidth: '400px' }}>
        <DbgBtn onClick={handleSeedTasks} disabled={seeding} color={colors.accent.purple}>{seeding ? '...' : '+ Tasks'}</DbgBtn>
        <DbgBtn onClick={handleSeedVault} color={colors.category.resources}>+ Vault</DbgBtn>
        <DbgBtn onClick={handleSeedKnowledge} color={colors.category.education}>+ Knowledge</DbgBtn>
        <DbgBtn onClick={handleSeedGoals} color={colors.category.support}>+ Goals</DbgBtn>
        <DbgBtn onClick={handleClearAll} color={colors.danger}>Clear All</DbgBtn>
      </div>

      <InstallBanner />
    </div>
  );
}

function DbgBtn({ onClick, disabled, color, children }: { onClick: () => void; disabled?: boolean; color: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 10px', backgroundColor: colors.bg.surface, color,
      fontSize: '11px', fontWeight: 500, borderRadius: '6px',
      border: `1px solid ${colors.border.default}`, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: font.family, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}
