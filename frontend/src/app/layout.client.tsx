'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import { useSession, useLogout } from '@/lib/auth';
import { toUserMessage } from '@/lib/errors';

type Props = { children: ReactNode };

export default function ClientLayout({ children }: Props) {
  const { user, isLoading, error } = useSession();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/login');

  const menuItems = useMemo(() => {
    const items = [
      { href: '/produccion', label: 'Producción', show: true },
      { href: '/mantenimiento', label: 'Mantenimiento', show: true },
      { href: '/incidentes', label: 'Incidentes', show: true },
      { href: '/observaciones', label: 'Observaciones', show: true },
      { href: '/dashboards', label: 'Dashboards', show: user?.role === 'supervisor' || user?.role === 'admin' },
    ];
    if (user?.role === 'admin') {
      items.push({ href: '/admin/usuarios', label: 'Usuarios', show: true });
      items.push({ href: '/admin/catalogos', label: 'Catálogos', show: true });
    }
    return items.filter((item) => item.show);
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <p>Cargando…</p>;
  }

  if (error && !user) {
    return (
      <main style={{ padding: '2rem' }}>
        <p role="alert">{toUserMessage(error)}</p>
        <p>
          <button type="button" onClick={() => router.push('/login')}>
            Ir al inicio de sesión
          </button>
        </p>
      </main>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#f4f4f5', padding: '1.5rem' }}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e4e4e7',
          }}
        >
          <div style={{ fontWeight: 600 }}>SIPROSA MES</div>
          {user && (
            <button type="button" onClick={handleLogout}>
              Salir
            </button>
          )}
        </header>
        <main style={{ padding: '2rem', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
