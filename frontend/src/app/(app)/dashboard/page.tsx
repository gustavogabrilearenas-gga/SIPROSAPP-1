'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'

const modules = [
  { href: '/configuracion/usuarios', title: 'Usuarios', description: 'Gestiona altas y modificaciones de cuentas.' },
  { href: '/configuraciones-maestras', title: 'Configuraciones maestras', description: 'Mantén catálogos y parámetros actualizados.' },
  { href: '/maquinas', title: 'Máquinas', description: 'Registra equipos y su estado operativo.' },
  { href: '/produccion', title: 'Producción', description: 'Controla órdenes y avances de producción.' },
  { href: '/mantenimiento', title: 'Mantenimiento', description: 'Planifica y documenta actividades de mantenimiento.' },
  { href: '/incidentes', title: 'Incidentes', description: 'Reporta y hace seguimiento a incidentes.' },
  { href: '/observaciones', title: 'Observaciones', description: 'Captura observaciones generales de planta.' },
  { href: '/ordenes', title: 'Órdenes', description: 'Administra órdenes de trabajo activas.' },
]

export default function DashboardPage() {
  const { user } = useAuthStore((state) => ({ user: state.user }))

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-800">Bienvenido {user?.first_name || user?.username}</h1>
        <p className="text-sm text-slate-500">
          Usa este panel para acceder rápidamente a los módulos principales del sistema MES.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
          >
            <span className="text-sm font-semibold text-blue-600">{module.title}</span>
            <span className="mt-2 text-sm text-slate-600">{module.description}</span>
          </Link>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Tu sesión</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-400">Usuario</dt>
            <dd>{user?.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Nombre completo</dt>
            <dd>{user?.full_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Correo electrónico</dt>
            <dd>{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Grupos</dt>
            <dd>{user?.groups?.length ? user.groups.join(', ') : '—'}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

