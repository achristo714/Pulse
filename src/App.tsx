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

export default function App() {
  const {
    user,
    profile,
    loading,
    signInWithMagicLink,
    signOut,
    createTeamAndProfile,
    joinTeamWithInvite,
  } = useAuth();

  const { members } = useTeam(profile?.team_id);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const { viewMode, reportModalOpen, setReportModalOpen } = useUIStore();

  // Fetch tasks when profile is available
  useEffect(() => {
    if (profile?.team_id) {
      fetchTasks(profile.team_id);
    }
  }, [profile?.team_id, fetchTasks]);

  // Realtime sync
  useRealtimeSync(profile?.team_id);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted text-[14px]">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthPage onSignIn={signInWithMagicLink} />;
  }

  // Authenticated but no profile (needs onboarding)
  if (!profile) {
    return (
      <OnboardingPage
        onCreateTeam={createTeamAndProfile}
        onJoinTeam={joinTeamWithInvite}
      />
    );
  }

  // Main app
  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <TopBar profile={profile} onSignOut={signOut} />
      {viewMode === 'list' && <FilterBar members={members} />}

      {viewMode === 'list' ? (
        <ListView members={members} />
      ) : (
        <CanvasView
          teamId={profile.team_id}
          userId={profile.id}
          members={members}
        />
      )}

      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        members={members}
      />
    </div>
  );
}
