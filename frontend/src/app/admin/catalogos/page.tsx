'use client';

import { useSession } from '@/lib/auth';
import Spinner from '@/components/feedback/Spinner';
import StateError from '@/components/feedback/StateError';
import { toUserMessage } from '@/lib/errors';

export default function AdminCatalogosPage() {
  const { user, isLoading, error } = useSession();

  if (isLoading) return <Spinner label="Cargando sesión..." />;
  if (error) return <StateError message={toUserMessage(error)} />;
  if (!user || user.role !== 'admin') return <StateError message="No autorizado" />;

  return (
    <div>
      <h1>Administración — Catálogos</h1>
      <p>Stub de administración de catálogos maestros.</p>
    </div>
  );
}
