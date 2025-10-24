'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuth } from '@/stores/auth-store'
import { isSuperuser, isSupervisor } from '@/lib/auth-utils'

export default function Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const canSeeSupervision = isSuperuser(user) || isSupervisor(user)

  const tabs = [
    { href: '/incidentes/crud', label: 'CRUD' },
    ...(canSeeSupervision ? [{ href: '/incidentes/supervision', label: 'Supervisión' }] : []),
  ] as Array<{ href: string; label: string }>

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`py-2 px-3 -mb-px border-b-2 ${
              pathname === href
                ? 'border-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
