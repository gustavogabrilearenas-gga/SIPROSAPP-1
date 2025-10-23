'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, token, refreshUser, logout } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    refreshUser: state.refreshUser,
    logout: state.logout,
  }))
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    const ensureSession = async () => {
      if (!token) {
        if (active) {
          setChecking(false)
        }
        router.replace('/login')
        return
      }

      if (!user) {
        try {
          await refreshUser()
        } catch (error) {
          logout()
          if (active) {
            setChecking(false)
          }
          router.replace('/login')
          return
        }
      }

      if (active) {
        setChecking(false)
      }
    }

    void ensureSession()

    return () => {
      active = false
    }
  }, [token, user, refreshUser, logout, router])

  if (checking || !user || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-4 text-sm font-medium">Verificando sesión…</p>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
