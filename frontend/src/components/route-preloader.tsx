'use client';

import { useRoutePreloader } from '@/hooks/use-route-preloader';
import { useEffect } from 'react';

export function RoutePreloader() {
  useRoutePreloader();

  useEffect(() => {
    // Registrar un service worker para precarga
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/route-cache-sw.js').catch(err => {
          console.error('Error registrando service worker:', err);
        });
      });
    }
  }, []);

  return null;
}