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
  Activity,
  Plus,
  Search,
  Edit,
  ArrowLeft,
  Settings,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { api } from '@/lib/api'

interface EtapaProduccion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  orden_tipico: number
  requiere_registro_parametros: boolean
  parametros_esperados: any[]
  activa: boolean
  lotes_count: number
}

export default function EtapasProduccionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [etapas, setEtapas] = useState<EtapaProduccion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEtapaId, setSelectedEtapaId] = useState<number | null>(null)

  useEffect(() => {
    fetchEtapas()
  }, [])

  const fetchEtapas = async () => {
    try {
      setLoading(true)
      const response = await api.get('/etapas-produccion/')
      setEtapas(response.results || response)
    } catch (error) {
      console.error('Error fetching etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEtapas = etapas.filter(e =>
    e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getOrdenColor = (orden: number) => {
    if (orden <= 3) return 'bg-green-100 text-green-800'
    if (orden <= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

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
                    <Activity className="w-8 h-8 text-blue-600" />
                    Etapas de Producción
                  </h1>
                  <p className="text-gray-600">Procesos del flujo productivo</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedEtapaId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Etapa
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
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Etapas Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEtapas
                .sort((a, b) => a.orden_tipico - b.orden_tipico)
                .map((etapa, index) => (
                <motion.div
                  key={etapa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getOrdenColor(etapa.orden_tipico)}>
                              Orden {etapa.orden_tipico}
                            </Badge>
                            {etapa.requiere_registro_parametros && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Settings className="w-3 h-3 mr-1" />
                                Parámetros
                              </Badge>
                            )}
                            {!etapa.activa && (
                              <Badge className="bg-gray-100 text-gray-800">Inactiva</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg font-bold mb-1">
                            {etapa.codigo}
                          </CardTitle>
                          <p className="text-sm font-medium text-gray-900">{etapa.nombre}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {etapa.descripcion && (
                          <p className="text-sm text-gray-600">{etapa.descripcion}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Lotes Procesados</p>
                            <p className="font-bold text-blue-600">{etapa.lotes_count}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Parámetros</p>
                            <p className="font-medium">{etapa.parametros_esperados?.length || 0}</p>
                          </div>
                        </div>
                        {etapa.parametros_esperados && etapa.parametros_esperados.length > 0 && (
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <p className="font-medium mb-1">Parámetros:</p>
                            <div className="flex flex-wrap gap-1">
                              {etapa.parametros_esperados.map((param: any, idx: number) => (
                                <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                                  {param.nombre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/lotes?etapa=${etapa.id}`)}
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            Ver Lotes
                          </Button>
                          {(user?.is_superuser || user?.is_staff) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEtapaId(etapa.id)
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
              ))}
            </div>
          )}

          {!loading && filteredEtapas.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron etapas</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
