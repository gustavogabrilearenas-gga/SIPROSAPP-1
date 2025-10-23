'use client'

import { create } from 'zustand'
import { api, AUTH_TOKEN_KEY, handleApiError } from '@/lib/api'
import type { User } from '@/types/models'

const USER_STORAGE_KEY = 'siprosa.auth.user'

type StoredAuth = {
  user: User | null
  token: string | null
}

const readStoredAuth = (): StoredAuth => {
  if (typeof window === 'undefined') {
    return { user: null, token: null }
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY)

  if (!rawUser) {
    return { user: null, token }
  }

  try {
    return { user: JSON.parse(rawUser) as User, token }
  } catch (error) {
    console.warn('No se pudo parsear el usuario almacenado', error)
    return { user: null, token }
  }
}

const writeToken = (token: string | null) => {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

const writeUser = (user: User | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    window.localStorage.removeItem(USER_STORAGE_KEY)
  }
}

interface AuthState {
  user: User | null
  token: string | null
  hydrated: boolean
  isLoading: boolean
  error: string | null
  hydrate: () => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  isLoading: false,
  error: null,

  hydrate: () => {
    if (get().hydrated) return
    const stored = readStoredAuth()
    set({ user: stored.user, token: stored.token, hydrated: true })
  },

  clearError: () => set({ error: null }),

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.login({ username, password })
      const token = (response.access || response.token || '') as string

      if (token) {
        writeToken(token)
      } else {
        writeToken(null)
      }

      let user = response.user ?? null
      if (!user) {
        user = await api.getCurrentUser()
      }

      writeUser(user)

      set({
        user,
        token: token || null,
        isLoading: false,
        hydrated: true,
        error: null,
      })
    } catch (error) {
      const { message } = handleApiError(error)
      writeToken(null)
      writeUser(null)
      set({
        user: null,
        token: null,
        isLoading: false,
        hydrated: true,
        error: message,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await api.logout()
    } finally {
      writeToken(null)
      writeUser(null)
      set({
        user: null,
        token: null,
        isLoading: false,
        hydrated: true,
        error: null,
      })
    }
  },

  loadUser: async () => {
    const { token } = get()
    if (!token) {
      writeUser(null)
      set({ user: null })
      return
    }

    set({ isLoading: true })
    try {
      const user = await api.getCurrentUser()
      writeUser(user)
      set({ user, isLoading: false, error: null })
    } catch (error) {
      console.warn('No se pudo cargar el usuario actual', error)
      writeToken(null)
      writeUser(null)
      set({ user: null, token: null, isLoading: false })
    }
  },
}))

