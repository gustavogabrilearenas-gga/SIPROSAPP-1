'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Wrench, Plus, Search, Filter, Home, Loader2, Clock, AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import OrdenTrabajoDetailModal from '@/components/orden-trabajo-detail-modal'
import OrdenTrabajoFormModal from '@/components/orden-trabajo-form-modal'
import { useAuth } from '@/stores/auth-store'
import { api } from '@/lib/api'
import type { OrdenTrabajoListItem } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function MantenimientoContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [ordenes, setOrdenes] = useState<OrdenTrabajoListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos')
  const [page, setPage] = useState<number>(1)
  const [count, setCount] = useState<number>(0)
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedOrdenForEdit, setSelectedOrdenForEdit] = useState<OrdenTrabajoListItem | null>(null)

  useEffect(() => {
    fetchOrdenes(1)
  }, [filtroEstado, filtroPrioridad])

  const fetchOrdenes = async (requestedPage: number = page) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page: requestedPage }
      if (filtroEstado !== 'todos') params.estado = filtroEstado
      if (filtroPrioridad !== 'todos') params.prioridad = filtroPrioridad
      const response = await api.getOrdenesTrabajo(params)
      setOrdenes(response.results)
      setCount(response.count)
      setPage(requestedPage)
    } catch (err: any) {
      console.error('Error al cargar órdenes de trabajo:', err)
      setError('Error al cargar las órdenes de trabajo')
    } finally {
      setIsLoading(false)
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
    fetchOrdenes(page)
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
                
                <div className="flex space-x-2">
                  {['todos', 'BAJA', 'NORMAL', 'ALTA', 'URGENTE'].map((prioridad) => (
                    <button
                      key={prioridad}
                      onClick={() => setFiltroPrioridad(prioridad)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        filtroPrioridad === prioridad
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
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
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando órdenes de trabajo...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchOrdenes(page)}>
                    Reintentar
                  </Button>
                </div>
              ) : ordenes.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No se encontraron órdenes de trabajo</p>
                  <Button onClick={handleCreateOrden}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Orden
                  </Button>
                </div>
              ) : (
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
                              <p className="font-medium text-gray-900 truncate">
                                {orden.titulo}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700">
                              {orden.maquina_nombre}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700">
                              {orden.tipo_nombre}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {getEstadoBadge(orden.estado)}
                          </td>
                          <td className="py-4 px-4">
                            {getPrioridadBadge(orden.prioridad)}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {formatFecha(orden.fecha_creacion)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {orden.asignada_a || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                onClick={() => fetchOrdenes(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => fetchOrdenes(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrdenes(page + 1)}
                disabled={page === totalPages}
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
