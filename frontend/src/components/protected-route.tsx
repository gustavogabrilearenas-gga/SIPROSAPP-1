'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, token, hydrated, isLoading, hydrate, loadUser } = useAuthStore()
  const requestedUser = useRef(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (token && !user && !requestedUser.current) {
      requestedUser.current = true
      void loadUser()
    }
  }, [hydrated, token, user, loadUser])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (!token && !isLoading) {
      router.replace('/login')
    }
  }, [hydrated, token, isLoading, router])

  if (!hydrated || isLoading || (token && !user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-4 text-sm font-medium">Verificando sesión…</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

