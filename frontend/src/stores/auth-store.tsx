'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import type { User } from '@/types/models'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  initializeAuth: () => Promise<void>
  clearError: () => void
  setHasHydrated: (state: boolean) => void
}

// Store sin persistencia para evitar problemas de hidratación
export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  _hasHydrated: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.login({ username, password })
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error de autenticación'
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      throw new Error(errorMessage)
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await api.logout()
    } catch (error) {
      console.error('Error durante logout:', error)
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  getCurrentUser: async () => {
    if (!api.isAuthenticated()) {
      set({ isAuthenticated: false, user: null })
      return
    }

    set({ isLoading: true })
    try {
      const user = await api.getCurrentUser()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Error al obtener usuario:', error)
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sesión expirada',
      })
    }
  },

  // Inicializar autenticación al cargar la app
  initializeAuth: async () => {
    if (typeof window === 'undefined') {
      return
    }

    if (get()._hasHydrated) {
      return
    }

    if (get().isLoading) {
      return
    }

    const hasToken = !!localStorage.getItem('access_token')

    if (!hasToken) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        _hasHydrated: true,
      })
      return
    }

    set({ isLoading: true, error: null })

    try {
      await get().getCurrentUser()
    } finally {
      set({ isLoading: false, _hasHydrated: true })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  setHasHydrated: (state: boolean) => {
    set({ _hasHydrated: state })
  },
}))

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
