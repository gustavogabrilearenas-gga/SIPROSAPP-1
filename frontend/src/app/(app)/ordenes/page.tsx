'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * PÁGINA DEPRECADA
 * Esta página fue reemplazada por /mantenimiento
 * Redirige automáticamente a la nueva ubicación
 */
export default function OrdenesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la nueva página de mantenimiento
    router.replace('/mantenimiento')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo a Mantenimiento...</p>
      </div>
    </div>
  )
}

