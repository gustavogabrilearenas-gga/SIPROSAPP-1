'use client'

import { create } from 'zustand'
import { api, AUTH_TOKEN_KEY } from '@/lib/api'
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
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasGroup: (groupName: string) => boolean
  refreshUser: (username?: string) => Promise<User>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...readStoredAuth(),

  async login(username, password) {
    const response = await api.login({ username, password })
    const accessToken = response.access

    if (!accessToken) {
      throw new Error('No se recibió un token de acceso válido.')
    }

    writeToken(accessToken)

    try {
      const user = await api.fetchCurrentUser({ username })
      writeUser(user)
      set({ user, token: accessToken })
    } catch (error) {
      writeToken(null)
      writeUser(null)
      set({ user: null, token: null })
      throw error
    }
  },

  logout() {
    writeToken(null)
    writeUser(null)
    set({ user: null, token: null })
  },

  hasGroup(groupName) {
    const current = get().user
    if (!current?.groups?.length) {
      return false
    }
    return current.groups.some((group) => group.toLowerCase() === groupName.toLowerCase())
  },

  async refreshUser(username) {
    const candidateUsername = username ?? get().user?.username ?? undefined

    try {
      const user = await api.fetchCurrentUser({ username: candidateUsername })
      writeUser(user)
      set({ user })
      return user
    } catch (error) {
      writeToken(null)
      writeUser(null)
      set({ user: null, token: null })
      throw error
    }
  },
}))
