'use client'

import { type ReactNode } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import MainLayout from '@/components/main-layout'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  )
}

