'use client'

import { ProtectedRoute } from '@/components/protected-route'
import MainLayout from '@/components/main-layout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  )
}