import { useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { FilterBar } from './components/layout/FilterBar';
import { NewTaskInput } from './components/task/NewTaskInput';
import { ListView } from './views/ListView';
import { CanvasView } from './views/CanvasView';
import { ReportModal } from './components/report/ReportModal';
import { useTaskStore } from './stores/taskStore';
import { useUIStore } from './stores/uiStore';
import { colors, font } from './lib/theme';
import type { Profile } from './lib/types';

// Hardcoded team/profile for now — auth flow will be re-added later
const TEAM_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PROFILE: Profile = {
  id: '9546450a-9299-4fd6-b859-7b3f25753c48',
  team_id: TEAM_ID,
  display_name: 'Andy',
  avatar_url: null,
  role: 'admin',
};

export default function App() {
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const { viewMode, reportModalOpen, setReportModalOpen } = useUIStore();

  useEffect(() => {
    fetchTasks(TEAM_ID);
  }, [fetchTasks]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.primary, fontFamily: font.family }}>
      <TopBar profile={DEMO_PROFILE} onSignOut={() => {}} />
      {viewMode === 'list' && (
        <>
          <FilterBar members={[DEMO_PROFILE]} />
          <NewTaskInput teamId={TEAM_ID} createdBy={DEMO_PROFILE.id} />
        </>
      )}
      {viewMode === 'list' ? (
        <ListView members={[DEMO_PROFILE]} />
      ) : (
        <CanvasView teamId={TEAM_ID} userId={DEMO_PROFILE.id} members={[DEMO_PROFILE]} />
      )}
      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} members={[DEMO_PROFILE]} />
    </div>
  );
}
