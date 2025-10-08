'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/stores/auth-store'

/**
 * Componente que inicializa la autenticación del lado del cliente
 * para evitar problemas de hidratación de Next.js
 */
export function AuthInit({ children }: { children: React.ReactNode }) {
  const { initializeAuth, _hasHydrated } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Marcar como montado en el cliente
    setMounted(true)
    
    // Inicializar autenticación solo en el cliente
    if (!_hasHydrated) {
      initializeAuth()
    }
  }, [initializeAuth, _hasHydrated])

  // Durante SSR y primera carga, renderizar sin problemas de hidratación
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
