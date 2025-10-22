import { useEffect, useMemo } from 'react'
import { useAuth } from '@/stores/auth-store'
import { canAccessMasterConfig, canEditMasterConfig } from '@/lib/auth-utils'

export const useMasterConfigAccess = () => {
  const auth = useAuth()
  const { _hasHydrated, initializeAuth, isLoading, user } = auth

  useEffect(() => {
    if (!_hasHydrated) {
      void initializeAuth()
    }
  }, [_hasHydrated, initializeAuth])

  const status = useMemo(() => {
    if (!_hasHydrated || isLoading) {
      return 'loading' as const
    }
    if (!canAccessMasterConfig(user)) {
      return 'forbidden' as const
    }
    return 'ready' as const
  }, [_hasHydrated, isLoading, user])

  return {
    ...auth,
    status,
    canAccess: canAccessMasterConfig(user),
    canEdit: canEditMasterConfig(user),
  }
}
