'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, ArrowLeft, Bell, Shield, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import DataState from '@/components/common/data-state'
import { featureFlags } from '@/lib/feature-flags'

export default function ConfiguracionPage() {
  const router = useRouter()

  if (!featureFlags.configuracion) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-8">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Configuración no disponible</CardTitle>
                <CardDescription>
                  Esta sección está deshabilitada en el entorno actual. Comunícate con el equipo de plataforma para habilitarla cuando exista respaldo funcional en backend.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataState empty emptyMessage={<p className="text-gray-600">Sin opciones de configuración activas.</p>}>
                  <div />
                </DataState>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const secciones = [
    {
      titulo: 'Notificaciones',
      descripcion: 'Configura alertas y notificaciones del sistema',
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      titulo: 'Seguridad',
      descripcion: 'Gestiona contraseñas y permisos de acceso',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      titulo: 'Base de Datos',
      descripcion: 'Configuración de conexiones y respaldos',
      icon: Database,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secciones.map((seccion, index) => (
              <motion.div
                key={seccion.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${seccion.bgColor}`}>
                        <seccion.icon className={`h-6 w-6 ${seccion.color}`} />
                      </div>
                      <div>
                        <CardTitle>{seccion.titulo}</CardTitle>
                        <CardDescription className="mt-1">
                          {seccion.descripcion}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Contacta a plataforma para activar esta integración cuando el servicio correspondiente esté disponible.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
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
    </ProtectedRoute>
  )
}
