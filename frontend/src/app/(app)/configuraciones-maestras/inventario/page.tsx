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
import DataState from '@/components/common/data-state'
import {
  Package,
  Plus,
  Search,
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { featureFlags } from '@/lib/feature-flags'
import { showError } from '@/components/common/toast-utils'
import InsumoFormModal from '@/components/insumo-form-modal'
import LoteFormModal from '@/components/lote-form-modal'

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

const monthsFromNow = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

const FALLBACK_INSUMOS: Insumo[] = [
  {
    id: 1,
    codigo: 'INS-001',
    nombre: 'Etanol 96%',
    categoria_nombre: 'Solventes',
    unidad_medida: 'L',
    stock_minimo: 50,
    stock_maximo: 500,
    punto_reorden: 100,
    stock_actual: 320,
    requiere_cadena_frio: false,
    activo: true,
  },
  {
    id: 2,
    codigo: 'INS-002',
    nombre: 'Ácido Cítrico',
    categoria_nombre: 'Aditivos',
    unidad_medida: 'Kg',
    stock_minimo: 25,
    stock_maximo: 250,
    punto_reorden: 60,
    stock_actual: 40,
    requiere_cadena_frio: false,
    activo: true,
  },
]

const FALLBACK_LOTES_INSUMO: LoteInsumo[] = [
  {
    id: 1,
    insumo_nombre: 'Etanol 96%',
    codigo_lote_proveedor: 'ETH-2401',
    cantidad_actual: 120,
    unidad: 'L',
    fecha_vencimiento: monthsFromNow(4),
    estado: 'APROBADO',
    proveedor: 'Quimex SA',
    ubicacion_nombre: 'Depósito Central',
  },
  {
    id: 2,
    insumo_nombre: 'Ácido Cítrico',
    codigo_lote_proveedor: 'CIT-2398',
    cantidad_actual: 30,
    unidad: 'Kg',
    fecha_vencimiento: monthsFromNow(1),
    estado: 'CUARENTENA',
    proveedor: 'BioChem',
    ubicacion_nombre: 'Almacén Químicos',
  },
]

export default function InventarioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [lotesInsumo, setLotesInsumo] = useState<LoteInsumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'insumos' | 'lotes'>('insumos')
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false)
  const [isLoteModalOpen, setIsLoteModalOpen] = useState(false)
  const [selectedInsumoId, setSelectedInsumoId] = useState<number | null>(null)

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
      setError(null)
      const response = await api.getInsumos()
      setInsumos(response.results || response)
    } catch (err) {
      const { status, message } = handleApiError(err)
      if (status === 500) {
        setInsumos(FALLBACK_INSUMOS)
      }
      setError(message ?? 'No se pudieron obtener los insumos')
      showError('Error al cargar inventario', message ?? 'No se pudieron obtener los insumos')
    } finally {
      setLoading(false)
    }
  }

  const fetchLotesInsumo = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getLotesInsumo()
      setLotesInsumo(response.results || response)
    } catch (err) {
      const { status, message } = handleApiError(err)
      if (status === 500) {
        setLotesInsumo(FALLBACK_LOTES_INSUMO)
      }
      setError(message ?? 'No se pudieron obtener los lotes de insumo')
      showError(
        'Error al cargar inventario',
        message ?? 'No se pudieron obtener los lotes de insumo',
      )
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

  const filteredInsumos = insumos.filter((insumo) => {
    if (!searchTerm) return true
    const normalized = searchTerm.toLowerCase()
    return (
      insumo.codigo.toLowerCase().includes(normalized) ||
      insumo.nombre.toLowerCase().includes(normalized) ||
      insumo.categoria_nombre.toLowerCase().includes(normalized)
    )
  })

  const filteredLotes = lotesInsumo.filter((lote) => {
    if (!searchTerm) return true
    const normalized = searchTerm.toLowerCase()
    return (
      lote.insumo_nombre.toLowerCase().includes(normalized) ||
      lote.codigo_lote_proveedor.toLowerCase().includes(normalized) ||
      lote.proveedor.toLowerCase().includes(normalized)
    )
  })

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar inventario${error ? `: ${error}` : ''}` : null
  const isEmptyState =
    !loading && !hasError &&
    ((activeTab === 'insumos' && filteredInsumos.length === 0) ||
      (activeTab === 'lotes' && filteredLotes.length === 0))

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
                  onClick={() => router.push('/configuraciones-maestras')}
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
              {(user?.is_superuser || user?.is_staff) && featureFlags.inventarioEdicion && (
                <Button
                  onClick={() => {
                    if (activeTab === 'insumos') {
                      setSelectedInsumoId(null)
                      setIsInsumoModalOpen(true)
                    } else {
                      setIsLoteModalOpen(true)
                    }
                  }}
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
          <DataState
            loading={loading}
            error={dataStateError}
            empty={isEmptyState}
            emptyMessage={
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-600">
                <Package className="h-12 w-12 text-gray-400" />
                <p className="text-lg font-medium">Sin registros disponibles</p>
                <p className="text-sm">Intenta ajustar los filtros o vuelve a intentarlo más tarde.</p>
              </div>
            }
          >
            {activeTab === 'insumos' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInsumos.map((insumo, index) => {
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
                            {(user?.is_superuser || user?.is_staff) && featureFlags.inventarioEdicion && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInsumoId(insumo.id)
                                  setIsInsumoModalOpen(true)
                                }}
                              >
                                Editar
                              </Button>
                            )}
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
                                    stockPorcentaje <= 30
                                      ? 'bg-red-500'
                                      : stockPorcentaje <= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
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
                {filteredLotes.map((lote, index) => {
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
                                  <p
                                    className={`font-bold ${
                                      diasVencimiento < 30
                                        ? 'text-red-600'
                                        : diasVencimiento < 90
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                    }`}
                                  >
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
          </DataState>
        </main>
      </div>
      <InsumoFormModal
        isOpen={isInsumoModalOpen}
        onClose={() => {
          setIsInsumoModalOpen(false)
          setSelectedInsumoId(null)
        }}
        insumoId={selectedInsumoId}
        onSuccess={() => {
          if (activeTab === 'insumos') {
            fetchInsumos()
          }
        }}
      />
      <LoteFormModal
        isOpen={isLoteModalOpen}
        onClose={() => {
          setIsLoteModalOpen(false)
        }}
        onSuccess={() => {
          if (activeTab === 'lotes') {
            fetchLotesInsumo()
          }
        }}
      />
    </ProtectedRoute>
  )
}

