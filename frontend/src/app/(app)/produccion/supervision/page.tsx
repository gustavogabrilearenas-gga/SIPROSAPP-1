'use client'

import { redirect } from 'next/navigation'
import { useAuth } from '@/stores/auth-store'
import { isSuperuser, isSupervisor } from '@/lib/auth-utils'

export default function SupervisionPage() {
  const { user, isLoading, initializeAuth, _hasHydrated } = useAuth()

  if (!_hasHydrated && !isLoading) {
    void initializeAuth()
  }

  const allowed = isSuperuser(user) || isSupervisor(user)

  if (!isLoading && _hasHydrated && !allowed) {
    redirect('/produccion/crud')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <h1 className="text-2xl font-semibold text-gray-600">En desarrollo</h1>
    </div>
  )
}
