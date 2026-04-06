import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  };

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const createTeamAndProfile = useCallback(async (teamName: string, displayName: string) => {
    if (!user) return null;

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: teamName })
      .select()
      .single();

    if (teamError || !team) return null;

    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        team_id: team.id,
        display_name: displayName,
        role: 'admin',
      })
      .select()
      .single();

    if (profError || !prof) return null;

    // Create invite code
    const code = crypto.randomUUID().slice(0, 8);
    await supabase.from('team_invites').insert({
      team_id: team.id,
      code,
      created_by: user.id,
    });

    setProfile(prof);
    return { team, profile: prof, inviteCode: code };
  }, [user]);

  const joinTeamWithInvite = useCallback(async (inviteCode: string, displayName: string) => {
    if (!user) return null;

    const { data: invite } = await supabase
      .from('team_invites')
      .select('*')
      .eq('code', inviteCode)
      .single();

    if (!invite) return null;

    const { data: prof, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        team_id: invite.team_id,
        display_name: displayName,
        role: 'member',
      })
      .select()
      .single();

    if (error || !prof) return null;
    setProfile(prof);
    return prof;
  }, [user]);

  return {
    user,
    profile,
    loading,
    signInWithMagicLink,
    signOut,
    createTeamAndProfile,
    joinTeamWithInvite,
  };
}
