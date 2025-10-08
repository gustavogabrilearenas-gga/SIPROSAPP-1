'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Plus, Filter, Home, Loader2, Calendar, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import IncidenteDetailModal from '@/components/incidente-detail-modal'
import IncidenteFormModal from '@/components/incidente-form-modal'
import { useAuth } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import type { IncidenteListItem } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function IncidentesContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [incidentes, setIncidentes] = useState<IncidenteListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroSeveridad, setFiltroSeveridad] = useState<string>('todos')
  const [page, setPage] = useState<number>(1)
  const [count, setCount] = useState<number>(0)
  const [selectedIncidenteId, setSelectedIncidenteId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedIncidenteForEdit, setSelectedIncidenteForEdit] = useState<IncidenteListItem | null>(null)

  useEffect(() => {
    fetchIncidentes(1)
  }, [filtroEstado, filtroSeveridad])

  const fetchIncidentes = async (requestedPage: number = page) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page: requestedPage }
      if (filtroEstado !== 'todos') params.estado = filtroEstado
      if (filtroSeveridad !== 'todos') params.severidad = filtroSeveridad
      
      const response = await api.getIncidentes(params)
      setIncidentes(response.results)
      setCount(response.count)
      setPage(requestedPage)
    } catch (err: any) {
      const message = err?.message || 'No se pudieron cargar los incidentes'
      toast({
        title: 'Error al cargar incidentes',
        description: message,
        variant: 'destructive',
      })
      setError('Error al cargar los incidentes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncidenteClick = (incidenteId: number) => {
    setSelectedIncidenteId(incidenteId)
    setIsModalOpen(true)
  }

  const handleCreateIncidente = () => {
    setSelectedIncidenteForEdit(null)
    setIsFormModalOpen(true)
  }

  const handleEditIncidente = (incidente: IncidenteListItem) => {
    setSelectedIncidenteForEdit(incidente)
    setIsFormModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedIncidenteId(null)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setSelectedIncidenteForEdit(null)
  }

  const handleUpdate = () => {
    fetchIncidentes(page)
  }

  const getSeveridadBadge = (severidad: string) => {
    const severidades: Record<string, { bg: string, text: string, label: string }> = {
      'CRITICA': { bg: 'bg-red-600', text: 'text-white', label: 'Crítica' },
      'MAYOR': { bg: 'bg-red-100', text: 'text-red-800', label: 'Mayor' },
      'MODERADA': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Moderada' },
      'MENOR': { bg: 'bg-green-100', text: 'text-green-800', label: 'Menor' },
    }
    
    const config = severidades[severidad] || severidades['MODERADA']
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0 font-semibold`}>
        {config.label}
      </Badge>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { bg: string, text: string, label: string }> = {
      'ABIERTO': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Abierto' },
      'EN_INVESTIGACION': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Investigación' },
      'ACCION_CORRECTIVA': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Acción Correctiva' },
      'CERRADO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrado' },
    }
    
    const config = estados[estado] || estados['ABIERTO']
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
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

  const totalPages = Math.ceil(count / 50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
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
                <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Incidentes</h1>
                  <p className="text-sm text-gray-600">Registro y seguimiento de incidencias</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleCreateIncidente}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Reportar Incidente
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
        className="mb-6 mt-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-600" />
                
                {/* Filtro por Estado */}
                <div className="flex space-x-2 flex-1">
                  <span className="text-sm font-medium text-gray-600 flex items-center">Estado:</span>
                  {['todos', 'ABIERTO', 'EN_INVESTIGACION', 'ACCION_CORRECTIVA', 'CERRADO'].map((estado) => (
                    <button
                      key={estado}
                      onClick={() => setFiltroEstado(estado)}
                      className={`px-4 py-2 rounded-lg transition-all text-sm ${
                        filtroEstado === estado
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {estado === 'todos' ? 'Todos' : estado.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                
                {/* Filtro por Severidad */}
                <div className="flex space-x-2">
                  <span className="text-sm font-medium text-gray-600 flex items-center">Severidad:</span>
                  {['todos', 'CRITICA', 'MAYOR', 'MODERADA', 'MENOR'].map((severidad) => (
                    <button
                      key={severidad}
                      onClick={() => setFiltroSeveridad(severidad)}
                      className={`px-4 py-2 rounded-lg transition-all text-sm ${
                        filtroSeveridad === severidad
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {severidad === 'todos' ? 'Todas' : severidad}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </motion.div>

      {/* Lista de Incidentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Incidentes Registrados</span>
                <span className="text-sm font-normal text-gray-500">
                  {count} incidentes encontrados
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando incidentes...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => fetchIncidentes(page)}>
                    Reintentar
                  </Button>
                </div>
              ) : incidentes.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No se encontraron incidentes</p>
                  <Button onClick={handleCreateIncidente}>
                    <Plus className="h-4 w-4 mr-2" />
                    Reportar Primer Incidente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidentes.map((incidente) => (
                    <div
                      key={incidente.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                    <div className="flex-1">
                          {/* Header del incidente */}
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm font-semibold text-blue-600">
                          {incidente.codigo}
                            </span>
                            {getSeveridadBadge(incidente.severidad)}
                            {getEstadoBadge(incidente.estado)}
                            {incidente.requiere_notificacion_anmat && (
                              <Badge className="bg-purple-100 text-purple-800 border-0">
                                ANMAT
                              </Badge>
                            )}
                          </div>

                          {/* Título */}
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {incidente.titulo}
                        </h3>

                          {/* Descripción */}
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {incidente.descripcion}
                          </p>

                          {/* Información adicional */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatFecha(incidente.fecha_ocurrencia)}
                            </span>
                            {incidente.ubicacion_nombre && (
                              <span className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {incidente.ubicacion_nombre}
                              </span>
                            )}
                            {incidente.tipo_nombre && (
                              <span className="text-gray-700 font-medium">
                                Tipo: {incidente.tipo_nombre}
                        </span>
                            )}
                          </div>
                      </div>

                        {/* Botón de acción */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleIncidenteClick(incidente.id)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
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
          className="mt-6 mb-8"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchIncidentes(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchIncidentes(pageNum)}
                      className={pageNum === page ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchIncidentes(page + 1)}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
        </div>
          </div>
        </motion.div>
      )}

      {/* Modales */}
      <IncidenteDetailModal
        incidenteId={selectedIncidenteId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditIncidente}
        onUpdate={handleUpdate}
      />

      <IncidenteFormModal
        incidente={selectedIncidenteForEdit}
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

export default function IncidentesPage() {
  return (
    <ProtectedRoute>
      <IncidentesContent />
    </ProtectedRoute>
  )
}
