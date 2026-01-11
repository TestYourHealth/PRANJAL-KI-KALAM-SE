import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'writer' | 'reader';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data.map(r => r.role as AppRole));
    } else {
      setRoles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    fetchRoles(user.id);
  }, [user, authLoading, fetchRoles]);

  const isWriter = roles.includes('writer') || roles.includes('admin');
  const isAdmin = roles.includes('admin');

  return { roles, isWriter, isAdmin, loading: loading || authLoading, refetch: () => user && fetchRoles(user.id) };
}
