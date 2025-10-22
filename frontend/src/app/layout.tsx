import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import ClientLayout from './layout.client';

export const metadata: Metadata = {
  title: 'SIPROSA MES - Sistema de Gestión de Manufactura',
  description: 'Sistema de gestión de manufactura para SIPROSA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
