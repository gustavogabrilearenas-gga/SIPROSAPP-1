'use client';

import { useSession } from '@/lib/auth';
import { toUserMessage } from '@/lib/errors';
import Spinner from '@/components/feedback/Spinner';
import StateError from '@/components/feedback/StateError';

export default function DashboardsPage() {
  const { user, isLoading, error } = useSession();

  if (isLoading) return <Spinner label="Cargando sesión..." />;
  if (error) return <StateError message={toUserMessage(error)} />;
  if (!user) return <StateError message="No autorizado" />;

  const allowed = user.role === 'supervisor' || user.role === 'admin';
  if (!allowed) return <StateError message="No autorizado" />;

  return (
    <div>
      <h1>Dashboards</h1>
      <p>Vista inicial de tableros (stub).</p>
    </div>
  );
}
