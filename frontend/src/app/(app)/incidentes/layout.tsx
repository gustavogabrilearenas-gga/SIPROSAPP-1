'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/stores/auth-store'
import { isSuperuser, isSupervisor } from '@/lib/auth-utils'

export default function IncidentesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const canSupervise = isSuperuser(user) || isSupervisor(user)

  const tabs = [
    { href: '/incidentes/crud', label: 'CRUD' },
    ...(canSupervise ? [{ href: '/incidentes/supervision', label: 'Supervisión' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <Link
            key={{tab.href}}
            href={{tab.href}}
            className={`py-2 px-4 border-b-2 ${{pathname.startsWith(tab.href) ? 'border-blue-600 font-semibold text-blue-600' : 'border-transparent text-gray-600'}}`}
          >
            {{tab.label}}
          </Link>
        ))}
      </div>
      <div>{{children}}</div>
    </div>
  )
}
