import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cachear por 5 minutos
      staleTime: 1000 * 60 * 5,
      // Reintentar solo una vez
      retry: 1,
      // Mantener los datos en caché por 10 minutos
      gcTime: 1000 * 60 * 10,
      // No refrescar automáticamente
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Mostrar datos obsoletos mientras se recargan
      keepPreviousData: true,
    },
  },
});