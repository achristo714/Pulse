import { useEffect } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { OnboardingPage } from './components/auth/OnboardingPage';
import { TopBar } from './components/layout/TopBar';
import { FilterBar } from './components/layout/FilterBar';
import { ListView } from './views/ListView';
import { CanvasView } from './views/CanvasView';
import { ReportModal } from './components/report/ReportModal';
import { useAuth } from './hooks/useAuth';
import { useTeam } from './hooks/useTeam';
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useTaskStore } from './stores/taskStore';
import { useUIStore } from './stores/uiStore';
import { colors, font } from './lib/theme';

export default function App() {
  const { user, profile, loading, signInWithMagicLink, signOut, createTeamAndProfile, joinTeamWithInvite } = useAuth();
  const { members } = useTeam(profile?.team_id);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const { viewMode, reportModalOpen, setReportModalOpen } = useUIStore();

  useEffect(() => {
    if (profile?.team_id) fetchTasks(profile.team_id);
  }, [profile?.team_id, fetchTasks]);

  useRealtimeSync(profile?.team_id);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.family }}>
        <div style={{ color: colors.text.muted, fontSize: font.size.md }}>Loading...</div>
      </div>
    );
  }

  if (!user) return <AuthPage onSignIn={signInWithMagicLink} />;
  if (!profile) return <OnboardingPage onCreateTeam={createTeamAndProfile} onJoinTeam={joinTeamWithInvite} />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: colors.bg.primary, fontFamily: font.family }}>
      <TopBar profile={profile} onSignOut={signOut} />
      {viewMode === 'list' && <FilterBar members={members} />}
      {viewMode === 'list' ? (
        <ListView members={members} />
      ) : (
        <CanvasView teamId={profile.team_id} userId={profile.id} members={members} />
      )}
      <ReportModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} members={members} />
    </div>
  );
}
