'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package,
  Plus,
  Filter,
  Home,
  Loader2,
  Eye,
  EyeOff,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import LoteDetailModal from '@/components/lote-detail-modal'
import LoteFormModal from '@/components/lote-form-modal'
import { useAuth } from '@/stores/auth-store'
import { api, handleApiError } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import type { LoteListItem } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DataState from '@/components/common/data-state'

type LoteActionType = 'iniciar' | 'pausar' | 'completar' | 'cancelar'

function LotesContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [lotes, setLotes] = useState<LoteListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [mostrarOcultos, setMostrarOcultos] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [count, setCount] = useState<number>(0)
  const [selectedLoteId, setSelectedLoteId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedLoteForEdit, setSelectedLoteForEdit] = useState<LoteListItem | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitioningLoteId, setTransitioningLoteId] = useState<number | null>(null)

  useEffect(() => {
    fetchLotes(1)
  }, [filtroEstado, mostrarOcultos])

  const fetchLotes = async (requestedPage: number = page) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page: requestedPage }
      if (filtroEstado !== 'todos') params.estado = filtroEstado
      if (mostrarOcultos) params.mostrar_ocultos = 'true'
      const response = await api.getLotes(params)
      setLotes(response.results)
      setCount(response.count)
      setPage(requestedPage)
    } catch (err) {
      const { message } = handleApiError(err)
      toast.error('Error al cargar lotes', {
        description: message ?? 'No se pudo obtener la información de los lotes.',
      })
      setError(message ?? 'No se pudo cargar la información de los lotes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoteClick = (loteId: number) => {
    setSelectedLoteId(loteId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedLoteId(null)
  }

  const handleCreateLote = () => {
    setSelectedLoteForEdit(null)
    setIsFormModalOpen(true)
  }

  const handleEditLote = (lote: LoteListItem) => {
    setSelectedLoteForEdit(lote)
    setIsFormModalOpen(true)
  }

  const closeFormModal = () => {
    setIsFormModalOpen(false)
    setSelectedLoteForEdit(null)
  }

  const handleFormSuccess = () => {
    fetchLotes(page) // Recargar la lista
  }

  const handleLoteAction = async (lote: LoteListItem, action: LoteActionType) => {
    let motivo: string | null = null
    if (action === 'cancelar' || action === 'pausar') {
      motivo = window.prompt(
        `Ingrese un motivo para ${action === 'cancelar' ? 'cancelar' : 'pausar'} el lote ${lote.codigo_lote}`,
      )
      if (!motivo || !motivo.trim()) {
        toast.error('Acción cancelada', {
          description: 'Debes proporcionar un motivo para continuar.',
        })
        return
      }
      motivo = motivo.trim()
    }

    setIsTransitioning(true)
    setTransitioningLoteId(lote.id)

    try {
      let response: { message?: string } | null = null
      switch (action) {
        case 'iniciar':
          response = await api.iniciarLote(lote.id)
          break
        case 'pausar':
          response = await api.pausarLote(lote.id, { motivo: motivo ?? '' })
          break
        case 'completar':
          response = await api.completarLote(lote.id)
          break
        case 'cancelar':
          response = await api.cancelarLote(lote.id, { motivo: motivo ?? '' })
          break
        default:
          response = null
      }

      toast.success('Lote actualizado correctamente', {
        description: response?.message,
      })

      await fetchLotes(page)
    } catch (err) {
      const { message } = handleApiError(err)
      toast.error('Error al procesar el lote', {
        description: message ?? 'Ocurrió un error al ejecutar la acción.',
      })
    } finally {
      setIsTransitioning(false)
      setTransitioningLoteId(null)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { bg: string, text: string, label: string }> = {
      'PLANIFICADO': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Planificado' },
      'EN_PROCESO': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Proceso' },
      'PAUSADO': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Pausado' },
      'FINALIZADO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Finalizado' },
      'CANCELADO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
      'RECHAZADO': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
      'LIBERADO': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Liberado' },
    }
    const config = estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-800', label: estado }
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const prioridades: Record<string, { bg: string, text: string, label: string }> = {
      'URGENTE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgente' },
      'ALTA': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Alta' },
      'NORMAL': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal' },
      'BAJA': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Baja' },
    }
    const config = prioridades[prioridad] || { bg: 'bg-gray-100', text: 'text-gray-800', label: prioridad }
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    )
  }

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return '-'
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return fecha
    }
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar lotes${error ? `: ${error}` : ''}` : null
  const isEmptyState = !isLoading && !hasError && lotes.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Lotes</h1>
              <p className="text-gray-600">Gestión completa de lotes de producción</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-white/80"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={handleCreateLote}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lote
            </Button>
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
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-600" />
              <div className="flex space-x-2 flex-1">
                {['todos', 'PLANIFICADO', 'EN_PROCESO', 'FINALIZADO'].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstado(estado)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      filtroEstado === estado
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {estado === 'todos' ? 'Todos' : estado.replace('_', ' ')}
                  </button>
                ))}
              </div>
              
              {/* Botón para mostrar lotes ocultos - Solo para superadmins */}
              {user?.is_superuser && (
                <button
                  onClick={() => setMostrarOcultos(!mostrarOcultos)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                    mostrarOcultos
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={mostrarOcultos ? 'Ocultar lotes ocultos' : 'Mostrar lotes ocultos'}
                >
                  {mostrarOcultos ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Ocultos</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Ver Ocultos</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Lotes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Lotes de Producción ({lotes.length})
              </span>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Mostrando {(count === 0 ? 0 : (page - 1) * 50 + 1)}–{Math.min(page * 50, count)} de {count}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLotes(Math.max(1, page - 1))}
                    disabled={isLoading || page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLotes(page + 1)}
                    disabled={isLoading || lotes.length === 0 || page * 50 >= count}
                  >
                    Siguiente
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLotes(page)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataState
              loading={isLoading}
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
              {hasError && lotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="text-gray-600">No pudimos cargar los lotes en este momento.</p>
                  <Button onClick={() => fetchLotes(page)} disabled={isLoading}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rendimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lotes.map((lote) => {
                      const isLoteTransitioning = isTransitioning && transitioningLoteId === lote.id

                      return (
                        <tr
                          key={lote.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleLoteClick(lote.id)}
                            className="font-mono text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {lote.codigo_lote}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{lote.producto_nombre}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">
                              {lote.cantidad_producida?.toLocaleString()} / {lote.cantidad_planificada?.toLocaleString()}
                            </p>
                            <p className="text-gray-500 text-xs">{lote.unidad}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getEstadoBadge(lote.estado)}
                        </td>
                        <td className="px-4 py-4">
                          {getPrioridadBadge(lote.prioridad)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">
                            {formatFecha(lote.fecha_real_inicio || lote.fecha_planificada_inicio)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  lote.rendimiento_porcentaje >= 90
                                    ? 'bg-green-500'
                                    : lote.rendimiento_porcentaje >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(lote.rendimiento_porcentaje || 0, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                              {lote.rendimiento_porcentaje?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoteAction(lote, 'iniciar')}
                              disabled={isTransitioning}
                              className="flex items-center gap-1"
                            >
                              {isLoteTransitioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                              <span>Iniciar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoteAction(lote, 'pausar')}
                              disabled={isTransitioning}
                              className="flex items-center gap-1"
                            >
                              {isLoteTransitioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PauseCircle className="h-4 w-4" />
                              )}
                              <span>Pausar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoteAction(lote, 'completar')}
                              disabled={isTransitioning}
                              className="flex items-center gap-1"
                            >
                              {isLoteTransitioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              <span>Completar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoteAction(lote, 'cancelar')}
                              disabled={isTransitioning}
                              className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              {isLoteTransitioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                              <span>Cancelar</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
                </div>
              )}
            </DataState>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Detalle */}
      <LoteDetailModal
        loteId={selectedLoteId}
        isOpen={isModalOpen}
        onClose={closeModal}
        onEdit={handleEditLote}
        onUpdate={fetchLotes}
      />

      {/* Modal de Formulario */}
      <LoteFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
        lote={selectedLoteForEdit}
      />
    </div>
  )
}

export default function LotesPage() {
  return (
    <ProtectedRoute>
      <LotesContent />
    </ProtectedRoute>
  )
}
