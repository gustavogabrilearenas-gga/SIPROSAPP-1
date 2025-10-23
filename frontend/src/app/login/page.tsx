'use client'

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { handleApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { login, hydrate, hydrated, isLoading, error, clearError, user, token } = useAuthStore(
    (state) => ({
      login: state.login,
      hydrate: state.hydrate,
      hydrated: state.hydrated,
      isLoading: state.isLoading,
      error: state.error,
      clearError: state.clearError,
      user: state.user,
      token: state.token,
    }),
  )

  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (hydrated && user && token) {
      router.replace('/dashboard')
    }
  }, [hydrated, user, token, router])

  useEffect(() => {
    return () => {
      clearError()
    }
  }, [clearError])

  if (!hydrated && typeof window !== 'undefined') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="mt-4 text-sm font-medium">Preparando inicio de sesión…</p>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    clearError()

    try {
      await login(credentials.username, credentials.password)
      router.replace('/dashboard')
    } catch (err) {
      const { message } = handleApiError(err)
      setLocalError(message)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-800">SIPROSA MES</h1>
          <p className="mt-1 text-sm text-slate-500">Accedé con tus credenciales del sistema</p>
        </header>

        {(error || localError) && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={credentials.username}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? 'Iniciando sesión…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Usa tus credenciales internas de SIPROSA para acceder.
        </p>
      </div>
    </div>
  )
}

