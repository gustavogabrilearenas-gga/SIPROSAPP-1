'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Plus,
  Search,
  Edit,
  ArrowLeft,
  Building,
  Package,
  Wrench,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import DataState from '@/components/common/data-state'
import { showError } from '@/components/common/toast-utils'

interface Ubicacion {
  id: number
  codigo: string
  nombre: string
  tipo: string
  descripcion: string
  activa: boolean
  maquinas_count: number
  lotes_insumo_count: number
}

export default function UbicacionesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<number | null>(null)

  useEffect(() => {
    fetchUbicaciones()
  }, [])

  const fetchUbicaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ubicaciones/')
      setUbicaciones(response.results || response)
    } catch (error: any) {
      const message = error?.message || 'No se pudieron obtener las ubicaciones'
      setError(message)
      showError('Error al cargar ubicaciones', message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUbicaciones = ubicaciones.filter(u =>
    u.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      PRODUCCION: 'bg-blue-100 text-blue-800',
      ALMACEN: 'bg-green-100 text-green-800',
      MANTENIMIENTO: 'bg-orange-100 text-orange-800',
      SERVICIOS: 'bg-purple-100 text-purple-800',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getTipoIcon = (tipo: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      PRODUCCION: Package,
      ALMACEN: Building,
      MANTENIMIENTO: Wrench,
      SERVICIOS: Settings,
    }
    return icons[tipo] ?? MapPin
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar ubicaciones${error ? `: ${error}` : ''}` : null
  const isEmptyState = !loading && !hasError && filteredUbicaciones.length === 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-8 h-8 text-blue-600" />
                    Gestión de Ubicaciones
                  </h1>
                  <p className="text-gray-600">Áreas físicas de la planta</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedUbicacionId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Ubicación
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          <DataState
            loading={loading}
            error={dataStateError}
            empty={isEmptyState}
            emptyMessage={
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron ubicaciones</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUbicaciones.map((ubicacion, index) => {
                const TipoIcon = getTipoIcon(ubicacion.tipo)

                return (
                  <motion.div
                    key={ubicacion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-xl transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TipoIcon className="w-4 h-4 text-gray-500" />
                              <Badge className={getTipoColor(ubicacion.tipo)}>
                                {ubicacion.tipo}
                              </Badge>
                              {!ubicacion.activa && (
                                <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg font-bold mb-1">
                              {ubicacion.codigo}
                            </CardTitle>
                            <p className="text-sm font-medium text-gray-900">{ubicacion.nombre}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {ubicacion.descripcion && (
                            <p className="text-sm text-gray-600">{ubicacion.descripcion}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Máquinas</p>
                              <p className="font-bold text-blue-600">{ubicacion.maquinas_count}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Lotes Insumo</p>
                              <p className="font-bold text-green-600">{ubicacion.lotes_insumo_count}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/maquinas?ubicacion=${ubicacion.id}`)}
                            >
                              <Wrench className="w-4 h-4 mr-1" />
                              Máquinas
                            </Button>
                            {(user?.is_superuser || user?.is_staff) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUbicacionId(ubicacion.id)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </DataState>
        </main>
      </div>
    </ProtectedRoute>
  )
}
