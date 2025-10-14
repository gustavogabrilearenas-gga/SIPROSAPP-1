'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SIPROSA MES
              </h1>
              <p className="text-gray-600 font-medium">Centro de Control de Manufactura Farmacéutica</p>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={() => router.push('/perfil')}
                  className="text-right border-r border-gray-300 pr-4 hover:opacity-70 transition-opacity"
                >
                  <p className="text-sm text-gray-500">Usuario</p>
                  <p className="font-semibold text-gray-900">{user.full_name || user.username}</p>
                  <p className="text-xs text-blue-600">Mi Perfil →</p>
                </button>
              )}
              
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600 text-xl mt-20">
          Falta desarrollar
        </div>
      </main>
    </div>
  )
}
