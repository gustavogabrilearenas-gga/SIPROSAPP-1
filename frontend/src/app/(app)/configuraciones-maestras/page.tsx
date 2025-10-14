'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'

export default function ConfiguracionPage() {
  const router = useRouter()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>

            <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3">
              <Settings className="h-10 w-10 text-gray-700" />
              <span>Configuración del Sistema</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Personaliza y configura tu experiencia en SIPROSA MES
            </p>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Versión</p>
                    <p className="font-semibold">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Entorno</p>
                    <p className="font-semibold">Desarrollo</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Base de Datos</p>
                    <p className="font-semibold">PostgreSQL 15.14</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Estado</p>
                    <p className="font-semibold text-green-600">Operativo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
