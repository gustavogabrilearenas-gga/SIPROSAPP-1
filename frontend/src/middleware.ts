import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// NOTA: El middleware en Next.js corre del lado del servidor y no puede acceder
// a localStorage donde guardamos los tokens. Por ahora, solo manejamos redirecciones básicas.
// La protección real de rutas se hace del lado del cliente en los componentes.

export function middleware(request: NextRequest) {
  // Por ahora, solo dejamos pasar todas las requests
  // La autenticación se maneja del lado del cliente
  return NextResponse.next()
}

// Configurar las rutas donde se aplica el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
