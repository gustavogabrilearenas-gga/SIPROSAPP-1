import { useQuery } from '@tanstack/react-query';
import { get } from './api';
import { mapBackendUser, type User } from './rbac';

type SessionOptions = {
  enabled?: boolean;
};

export const useSession = ({ enabled = true }: SessionOptions = {}) => {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User> => {
      const me = await get('/auth/me/');
      return mapBackendUser(me);
    },
    staleTime: 60_000,
    enabled,
    retry: false,
  });

  return {
    user: query.data,
    isLoading: query.status === 'pending',
    error: query.error,
    refetch: query.refetch,
  };
};
