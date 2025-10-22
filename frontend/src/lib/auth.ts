import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from './api';
import { mapBackendUser, type User } from './rbac';

export const useSession = () => {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => mapBackendUser(await get('/auth/me/')),
    staleTime: 60_000,
    retry: (count, err: any) => (err?.status === 401 ? false : count < 2),
  });
  return { user: q.data, isLoading: q.isLoading, error: q.error };
};

export const useLogout = () => {
  const qc = useQueryClient();
  return async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      await qc.invalidateQueries({ queryKey: ['me'] });
    }
  };
};

export const useHasRole = (role: User['role']) => {
  const { user } = useSession();
  return !!user && user.role === role;
};
