import React from 'react';
import Link from 'next/link';
import {
  Factory,
  FileText,
  LayoutDashboard,
  Settings,
  Siren,
  Users,
  Wrench,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/stores/auth-store';
import { canAccessMasterConfig } from '@/lib/auth-utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/produccion', label: 'Producción', icon: Factory },
  { href: '/mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { href: '/incidentes', label: 'Incidentes', icon: Siren },
  { href: '/observaciones', label: 'Observaciones Generales', icon: FileText },
  { href: '/configuracion/usuarios', label: 'Gestión de Usuarios', icon: Users },
  { href: '/configuraciones-maestras', label: 'Configuraciones Maestras', icon: Settings },
  // ---------------- DESACTIVADAS ----------------
  // { href: '/configuraciones-maestras/productos', label: 'Productos', icon: Package },
  // { href: '/configuraciones-maestras/formulas', label: 'Fórmulas', icon: FlaskConical },
  // { href: '/lotes', label: 'Lotes', icon: ClipboardList },
  // { href: '/desviaciones', label: 'Desviaciones', icon: FileText },
  // { href: '/control-calidad', label: 'Control Calidad', icon: HeartPulse },
  // { href: '/kpis', label: 'KPIs', icon: Gauge },
  // { href: '/configuraciones-maestras/ubicaciones', label: 'Ubicaciones', icon: MapPin },
  // { href: '/configuraciones-maestras/turnos', label: 'Turnos', icon: Clock },
];

const NavLink = ({ item }: { item: typeof navItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <span
        className={`flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-100 ${
          isActive ? 'bg-blue-100 font-semibold text-blue-600' : ''
        }`}
      >
        <Icon className="w-5 h-5 mr-3" />
        {item.label}
      </span>
    </Link>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex flex-col bg-white shadow-lg border-r">
        <div className="flex items-center justify-center h-20 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SIPROSA MES
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => {
              // Ocultar "Gestión de Usuarios" a los no-admin
              if (item.href === '/configuracion/usuarios' && !user?.is_staff && !user?.is_superuser) {
                return false;
              }

              if (item.href.startsWith('/configuraciones-maestras') && !canAccessMasterConfig(user)) {
                return false;
              }

              return true;
            })
            .map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
        </nav>
        {/* User profile section can be added here */}
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;