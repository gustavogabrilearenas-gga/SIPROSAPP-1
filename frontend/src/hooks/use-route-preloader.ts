import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

const routes = [
  '/dashboard',
  '/produccion',
  '/mantenimiento',
  '/incidentes',
  '/observaciones',
  '/configuracion/usuarios',
  '/configuraciones-maestras'
];

export function useRoutePreloader() {
  const router = useRouter();

  const preloadRoute = useCallback(async (route: string) => {
    try {
      // Precargar la página
      await router.prefetch(route);
    } catch (error) {
      console.error(`Error precargando ruta ${route}:`, error);
    }
  }, [router]);

  useEffect(() => {
    // Precargar rutas principales después de que la página actual haya cargado
    const preloadRoutes = async () => {
      // Esperar a que la página actual termine de cargar
      if (document.readyState === 'complete') {
        // Precargar rutas en segundo plano con prioridad baja
        const preloadPromises = routes.map(route => {
          return new Promise(resolve => {
            requestIdleCallback(() => {
              preloadRoute(route).then(resolve);
            });
          });
        });

        await Promise.all(preloadPromises);
      }
    };

    preloadRoutes();
  }, [preloadRoute]);
}