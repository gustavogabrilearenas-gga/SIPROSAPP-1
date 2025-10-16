import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export function useApiQuery<T>(
  key: string[], 
  url: string, 
  options = {}
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await axios.get<T>(url);
      return data;
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