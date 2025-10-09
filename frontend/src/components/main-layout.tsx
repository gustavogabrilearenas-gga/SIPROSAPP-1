'use client';
import React from 'react';
import Link from 'next/link';
import {
  BarChart2,
  Box,
  ClipboardList,
  Cpu,
  Factory,
  FileText,
  FlaskConical,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Package,
  Siren,
  Sliders,
  User,
  Users,
  Wrench,
  Clock,
  Warehouse,
  MinusCircle
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/formulas', label: 'Fórmulas', icon: FlaskConical },
  { href: '/maquinas', label: 'Máquinas', icon: Cpu },
  { href: '/lotes', label: 'Lotes', icon: ClipboardList },
  { href: '/inventario', label: 'Inventario', icon: Warehouse },
  { href: '/mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { href: '/incidentes', label: 'Incidentes', icon: Siren },
  { href: '/desviaciones', label: 'Desviaciones', icon: FileText },
  { href: '/control-calidad', label: 'Control Calidad', icon: HeartPulse },
  { href: '/kpis', label: 'KPIs', icon: Gauge },
  { href: '/ubicaciones', label: 'Ubicaciones', icon: MapPin },
  { href: '/turnos', label: 'Turnos', icon: Clock },
  { href: '/etapas-produccion', label: 'Etapas Producción', icon: Factory },
  { href: '/paradas', label: 'Paradas', icon: MinusCircle },
  { href: '/configuracion/usuarios', label: 'Usuarios', icon: Users },
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
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex flex-col bg-white shadow-lg border-r">
        <div className="flex items-center justify-center h-20 border-b">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SIPROSA MES
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
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