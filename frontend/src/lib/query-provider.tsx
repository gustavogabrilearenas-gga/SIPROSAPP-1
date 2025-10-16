'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { queryClient } from '@/utils/query-client'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
