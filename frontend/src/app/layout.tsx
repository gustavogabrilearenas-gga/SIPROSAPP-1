import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/stores/auth-store'
import { AuthInit } from '@/components/auth-init'
import { QueryProvider } from '@/lib/query-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <AuthInit>
              {children}
              <Toaster />
            </AuthInit>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
