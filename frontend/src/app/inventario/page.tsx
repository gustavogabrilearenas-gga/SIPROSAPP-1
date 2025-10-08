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
  Package,
  Plus,
  Search,
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Insumo {
  id: number
  codigo: string
  nombre: string
  categoria_nombre: string
  unidad_medida: string
  stock_minimo: number
  stock_maximo: number
  punto_reorden: number
  stock_actual: number
  requiere_cadena_frio: boolean
  activo: boolean
}

interface LoteInsumo {
  id: number
  insumo_nombre: string
  codigo_lote_proveedor: string
  cantidad_actual: number
  unidad: string
  fecha_vencimiento: string
  estado: string
  proveedor: string
  ubicacion_nombre: string
}

export default function InventarioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [lotesInsumo, setLotesInsumo] = useState<LoteInsumo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'insumos' | 'lotes'>('insumos')

  useEffect(() => {
    if (activeTab === 'insumos') {
      fetchInsumos()
    } else {
      fetchLotesInsumo()
    }
  }, [activeTab])

  const fetchInsumos = async () => {
    try {
      setLoading(true)
      const response = await api.get('/insumos/')
      setInsumos(response.results || response)
    } catch (error) {
      console.error('Error fetching insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLotesInsumo = async () => {
    try {
      setLoading(true)
      const response = await api.get('/lotes-insumo/')
      setLotesInsumo(response.results || response)
    } catch (error) {
      console.error('Error fetching lotes insumo:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (insumo: Insumo) => {
    if (insumo.stock_actual <= insumo.stock_minimo) {
      return { label: 'Crítico', color: 'bg-red-500 text-white', icon: AlertTriangle }
    } else if (insumo.stock_actual <= insumo.punto_reorden) {
      return { label: 'Bajo', color: 'bg-yellow-500 text-white', icon: TrendingDown }
    }
    return { label: 'Normal', color: 'bg-green-500 text-white', icon: Package }
  }

  const getEstadoLoteColor = (estado: string) => {
    const colors: Record<string, string> = {
      CUARENTENA: 'bg-yellow-100 text-yellow-800',
      APROBADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
      AGOTADO: 'bg-gray-100 text-gray-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const getDiasVencimiento = (fechaVencimiento: string) => {
    const dias = Math.floor((new Date(fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return dias
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
                    <Package className="w-8 h-8 text-blue-600" />
                    Gestión de Inventario
                  </h1>
                  <p className="text-gray-600">Control de insumos y materias primas</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {/* TODO: Open create modal */}}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'insumos' ? 'Nuevo Insumo' : 'Nuevo Lote'}
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('insumos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'insumos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Catálogo de Insumos
              </button>
              <button
                onClick={() => setActiveTab('lotes')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'lotes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lotes de Insumos (FEFO)
              </button>
            </nav>
          </div>

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
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : activeTab === 'insumos' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insumos.map((insumo, index) => {
                const status = getStockStatus(insumo)
                const StatusIcon = status.icon
                const stockPorcentaje = (insumo.stock_actual / insumo.stock_maximo) * 100

                return (
                  <motion.div
                    key={insumo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-xl transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                              {insumo.requiere_cadena_frio && (
                                <Badge className="bg-blue-100 text-blue-800">❄️</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg font-bold mb-1">
                              {insumo.codigo}
                            </CardTitle>
                            <p className="text-sm font-medium text-gray-900">{insumo.nombre}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm">
                            <Badge className="bg-gray-100 text-gray-800">
                              {insumo.categoria_nombre}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Stock Actual</p>
                              <p className="text-2xl font-bold">{insumo.stock_actual}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Unidad</p>
                              <p className="text-lg font-medium">{insumo.unidad_medida}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Mínimo</p>
                              <p className="font-medium">{insumo.stock_minimo}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Máximo</p>
                              <p className="font-medium">{insumo.stock_maximo}</p>
                            </div>
                          </div>
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Nivel de Stock</span>
                              <span>{stockPorcentaje.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, stockPorcentaje)}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-2 rounded-full ${
                                  stockPorcentaje <= 30 ? 'bg-red-500' :
                                  stockPorcentaje <= 50 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {lotesInsumo.map((lote, index) => {
                const diasVencimiento = getDiasVencimiento(lote.fecha_vencimiento)
                const esProximoVencer = diasVencimiento <= 90

                return (
                  <motion.div
                    key={lote.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className={`hover:shadow-lg transition-shadow ${esProximoVencer ? 'border-orange-300 border-2' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{lote.insumo_nombre}</h3>
                              <Badge className={getEstadoLoteColor(lote.estado)}>
                                {lote.estado}
                              </Badge>
                              {esProximoVencer && (
                                <Badge className="bg-orange-500 text-white">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Próx. Vencer
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              Lote: {lote.codigo_lote_proveedor} | Proveedor: {lote.proveedor}
                            </p>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs">Cantidad</p>
                                <p className="font-bold text-lg">{lote.cantidad_actual} {lote.unidad}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Ubicación</p>
                                <p className="font-medium">{lote.ubicacion_nombre}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Vencimiento</p>
                                <p className="font-medium">{new Date(lote.fecha_vencimiento).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Días Restantes</p>
                                <p className={`font-bold ${
                                  diasVencimiento < 30 ? 'text-red-600' :
                                  diasVencimiento < 90 ? 'text-orange-600' :
                                  'text-green-600'
                                }`}>
                                  {diasVencimiento} días
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

