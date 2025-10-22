'use client'

import { ShieldAlert } from 'lucide-react'

interface AccessDeniedProps {
  title?: string
  description?: string
}

export const AccessDenied = ({
  title = 'Acceso restringido',
  description = 'No tiene permisos para visualizar esta sección.',
}: AccessDeniedProps) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <ShieldAlert className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="max-w-md text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
