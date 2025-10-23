import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/stores/auth-store'
import { AuthInit } from '@/components/auth-init'
import { QueryProvider } from '@/lib/query-provider'
import DataState from '@/components/common/data-state'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'SIPROSA MES - Sistema de Gestión de Manufactura',
  description: 'Manufacturing Execution System para la Farmacia Oficial del Sistema Provincial de Salud',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-sans">
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <AuthInit>
                <DataState>{children}</DataState>
              </AuthInit>
              <Toaster />
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
