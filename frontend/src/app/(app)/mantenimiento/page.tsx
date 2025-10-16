'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from '@/lib/motion'
import { Wrench, Plus, Search, Filter, Home, Clock, AlertTriangle, CheckCircle, User, Calendar } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import OrdenTrabajoDetailModal from '@/components/orden-trabajo-detail-modal'
import OrdenTrabajoFormModal from '@/components/orden-trabajo-form-modal'
import DataState from '@/components/common/data-state'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { useAuth } from '@/stores/auth-store'
import { api, handleApiError } from '@/lib/api'
import type { OrdenTrabajoListItem } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type ViewState = 'loading' | 'error' | 'empty' | 'ready'

const FALLBACK_ORDENES: OrdenTrabajoListItem[] = [
  {
    id: 1,
    codigo: 'OT-2024-001',
    maquina: 12,
    maquina_nombre: 'Llenadora A1',
    tipo: 3,
    tipo_nombre: 'Mantenimiento Preventivo',
    prioridad: 'ALTA',
    prioridad_display: 'Alta',
    estado: 'EN_PROCESO',
    estado_display: 'En proceso',
    titulo: 'Inspección de sistema neumático',
    fecha_creacion: new Date().toISOString(),
    fecha_planificada: new Date().toISOString(),
    asignada_a: null,
  },
  {
    id: 2,
    codigo: 'OT-2024-002',
    maquina: 7,
    maquina_nombre: 'Etiquetadora B2',
    tipo: 2,
    tipo_nombre: 'Correctivo',
    prioridad: 'NORMAL',
    prioridad_display: 'Normal',
    estado: 'ABIERTA',
    estado_display: 'Abierta',
    titulo: 'Reemplazo de rodillos',
    fecha_creacion: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    fecha_planificada: null,
    asignada_a: null,
  },
]

const ERROR_BANNER_TEXT = 'Error al cargar mantenimiento'

function MantenimientoContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [ordenes, setOrdenes] = useState<OrdenTrabajoListItem[]>([])
  const [dataState, setDataState] = useState<ViewState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos')
  const [page, setPage] = useState<number>(1)
  const [count, setCount] = useState<number>(0)
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedOrdenForEdit, setSelectedOrdenForEdit] = useState<OrdenTrabajoListItem | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    void fetchOrdenes(1)
  }, [filtroEstado, filtroPrioridad])

  const fetchOrdenes = async (requestedPage: number = page) => {
    setDataState('loading')
    setErrorMessage(null)
    try {
      const params: Record<string, any> = { page: requestedPage }
      if (filtroEstado !== 'todos') params.estado = filtroEstado
      if (filtroPrioridad !== 'todos') params.prioridad = filtroPrioridad
      const response = await api.getOrdenesTrabajo(params)
      const results = response.results || []
      startTransition(() => {
        setOrdenes(results)
        setCount(response.count ?? results.length)
        setPage(requestedPage)
        setDataState(results.length === 0 ? 'empty' : 'ready')
      })
      showSuccess('Órdenes de trabajo actualizadas correctamente')
    } catch (err: unknown) {
      const { status, message } = handleApiError(err)
      if (status === 500) {
        startTransition(() => {
          setOrdenes(FALLBACK_ORDENES)
          setCount(FALLBACK_ORDENES.length)
          setPage(1)
          setDataState(FALLBACK_ORDENES.length === 0 ? 'empty' : 'ready')
        })
        showSuccess('Datos de demostración cargados')
      } else {
        startTransition(() => {
          setDataState('error')
          setErrorMessage(ERROR_BANNER_TEXT)
        })
        showError(message || ERROR_BANNER_TEXT)
      }
    }
  }

  const handleOrdenClick = (ordenId: number) => {
    setSelectedOrdenId(ordenId)
    setIsModalOpen(true)
  }

  const handleEditOrden = (orden: OrdenTrabajoListItem) => {
    setSelectedOrdenForEdit(orden)
    setIsFormModalOpen(true)
  }

  const handleCreateOrden = () => {
    setSelectedOrdenForEdit(null)
    setIsFormModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedOrdenId(null)
  }

  const handleFormModalClose = () => {
    setIsFormModalOpen(false)
    setSelectedOrdenForEdit(null)
  }

  const handleUpdate = () => {
    void fetchOrdenes(page)
  }

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { bg: string, text: string, label: string, icon: any }> = {
      'ABIERTA': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Abierta', icon: Clock },
      'ASIGNADA': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Asignada', icon: User },
      'EN_PROCESO': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'En Proceso', icon: Wrench },
      'PAUSADA': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pausada', icon: Clock },
      'COMPLETADA': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada', icon: CheckCircle },
      'CANCELADA': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada', icon: AlertTriangle },
    }
    
    const estadoConfig = estados[estado] || estados['ABIERTA']
    const Icon = estadoConfig.icon
    
    return (
      <Badge className={`${estadoConfig.bg} ${estadoConfig.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {estadoConfig.label}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const prioridades: Record<string, { bg: string, text: string, label: string }> = {
      'BAJA': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Baja' },
      'NORMAL': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal' },
      'ALTA': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Alta' },
      'URGENTE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgente' },
    }
    
    const prioridadConfig = prioridades[prioridad] || prioridades['NORMAL']
    
    return (
      <Badge className={`${prioridadConfig.bg} ${prioridadConfig.text} border-0`}>
        {prioridadConfig.label}
      </Badge>
    )
  }

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '-'
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) return '-'
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return '-'
    }
  }

  const totalPages = Math.ceil(count / 10)
  const isBusy = dataState === 'loading' || isPending
  const isError = dataState === 'error'
  const isEmpty = dataState === 'empty'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <Wrench className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
                  <p className="text-sm text-gray-600">Gestión de Órdenes de Trabajo</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateOrden}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isBusy}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <div className="flex space-x-2 flex-1">
                  {['todos', 'ABIERTA', 'ASIGNADA', 'EN_PROCESO', 'COMPLETADA'].map((estado) => (
                    <button
                      key={estado}
                      onClick={() =>
                        startTransition(() => {
                          setFiltroEstado(estado)
                        })
                      }
                      className={`px-4 py-2 rounded-lg transition-all ${
                        filtroEstado === estado
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isBusy}
                    >
                      {estado === 'todos' ? 'Todos' : estado.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  {['todos', 'BAJA', 'NORMAL', 'ALTA', 'URGENTE'].map((prioridad) => (
                    <button
                      key={prioridad}
                      onClick={() =>
                        startTransition(() => {
                          setFiltroPrioridad(prioridad)
                        })
                      }
                      className={`px-4 py-2 rounded-lg transition-all ${
                        filtroPrioridad === prioridad
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isBusy}
                    >
                      {prioridad === 'todos' ? 'Todas' : prioridad}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tabla de Órdenes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Órdenes de Trabajo</span>
                <span className="text-sm font-normal text-gray-500">
                  {count} órdenes encontradas
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataState
                loading={dataState === 'loading'}
                error={isError ? errorMessage : null}
                empty={isEmpty}
                emptyMessage="Sin órdenes de trabajo registradas"
              >
                {!isError && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Código</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Título</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Máquina</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Prioridad</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Creación</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Asignada a</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordenes.map((orden) => (
                          <tr
                            key={orden.id}
                            onClick={() => handleOrdenClick(orden.id)}
                            className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm font-semibold text-blue-600">
                                {orden.codigo}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="max-w-xs">
                                <p className="font-medium text-gray-900 truncate">{orden.titulo}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-700">{orden.maquina_nombre}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-700">{orden.tipo_nombre}</span>
                            </td>
                            <td className="py-4 px-4">{getEstadoBadge(orden.estado)}</td>
                            <td className="py-4 px-4">{getPrioridadBadge(orden.prioridad)}</td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">{formatFecha(orden.fecha_creacion)}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-gray-600">{orden.asignada_a || '-'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DataState>
              {isError && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() =>
                      startTransition(() => {
                        void fetchOrdenes(page)
                      })
                    }
                    disabled={isBusy}
                  >
                    Reintentar
                  </Button>
                </div>
              )}
              {isEmpty && (
                <div className="mt-6 text-center">
                  <Button onClick={handleCreateOrden} disabled={isBusy}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Orden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Paginación */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  startTransition(() => {
                    void fetchOrdenes(page - 1)
                  })
                }
                disabled={page === 1 || isBusy}
              >
                Anterior
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    startTransition(() => {
                      void fetchOrdenes(pageNum)
                    })
                  }
                  disabled={isBusy}
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  startTransition(() => {
                    void fetchOrdenes(page + 1)
                  })
                }
                disabled={page === totalPages || isBusy}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modales */}
      <OrdenTrabajoDetailModal
        ordenId={selectedOrdenId}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onEdit={handleEditOrden}
        onUpdate={handleUpdate}
      />

      <OrdenTrabajoFormModal
        orden={selectedOrdenForEdit}
        isOpen={isFormModalOpen}
        onClose={handleFormModalClose}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

export default function MantenimientoPage() {
  return (
    <ProtectedRoute>
      <MantenimientoContent />
    </ProtectedRoute>
  )
}
