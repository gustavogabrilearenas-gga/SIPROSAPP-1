'use client'

import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type DataStateProps = {
  loading?: boolean
  error?: string | null
  empty?: boolean
  loadingMessage?: ReactNode
  errorMessage?: ReactNode
  emptyMessage?: ReactNode
  children: ReactNode
  className?: string
}

export function DataState({
  loading,
  error,
  empty,
  loadingMessage,
  errorMessage,
  emptyMessage,
  children,
  className
}: DataStateProps) {
  if (loading) {
    return (
      <div className={cn('flex min-h-[200px] w-full items-center justify-center flex-col gap-4', className)}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        {loadingMessage && (
          <p className="text-sm text-gray-600">{loadingMessage}</p>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Ocurrió un problema</p>
            <p>{errorMessage || error}</p>
          </div>
        </div>
      )}

      {empty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-500">
          {emptyMessage ?? 'Sin datos disponibles'}
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export default DataState
