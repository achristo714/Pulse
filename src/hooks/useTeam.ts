import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

export function useTeam(teamId: string | undefined) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('team_id', teamId)
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, [teamId]);

  return { members, loading };
}
