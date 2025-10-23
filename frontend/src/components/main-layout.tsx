'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/configuracion/usuarios', label: 'Usuarios' },
  { href: '/configuraciones-maestras', label: 'Configuraciones maestras' },
  { href: '/maquinas', label: 'Máquinas' },
  { href: '/produccion', label: 'Producción' },
  { href: '/mantenimiento', label: 'Mantenimiento' },
  { href: '/incidentes', label: 'Incidentes' },
  { href: '/observaciones', label: 'Observaciones' },
  { href: '/ordenes', label: 'Órdenes' },
  { href: '/perfil', label: 'Perfil' },
]

const linkClasses = (
  active: boolean,
): string =>
  `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition hover:bg-blue-50 ${
    active ? 'bg-blue-100 text-blue-700' : 'text-slate-600'
  }`

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuthStore()

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 backdrop-blur md:flex">
        <div className="px-6 py-6">
          <p className="text-lg font-semibold text-blue-700">SIPROSA MES</p>
          <p className="mt-1 text-xs text-slate-500">Panel administrativo</p>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={linkClasses(active)}>
                <span>{item.label}</span>
                {active && <span className="text-xs uppercase text-blue-600">Actual</span>}
              </Link>
            )
          })}
        </nav>
        <div className="px-6 py-4 text-xs text-slate-500">
          <p className="font-medium text-slate-700">{user?.full_name || user?.username}</p>
          {user?.email && <p className="truncate">{user.email}</p>}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{user?.full_name || user?.username}</span>
            {user?.groups?.length ? (
              <span className="text-xs text-slate-500">
                Grupos: {user.groups.join(', ')}
              </span>
            ) : null}
          </div>
          <button
            onClick={() => {
              void logout()
            }}
            disabled={isLoading}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cerrar sesión
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  )
}

export default MainLayout

