import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';

export function useApiQuery<T>(
  key: string[], 
  url: string, 
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      return get<T>(url);
    },
    ...options
  });
}

// Helper para cachear respuestas indefinidamente
export function useApiQueryStatic<T>(
  key: string[],
  url: string
) {
  return useApiQuery<T>(key, url, {
    staleTime: Infinity,
    gcTime: Infinity
  });
}