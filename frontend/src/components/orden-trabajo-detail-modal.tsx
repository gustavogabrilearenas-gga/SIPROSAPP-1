'use client'

import { useState, useEffect } from 'react'
import { X, Wrench, Calendar, User, AlertTriangle, Clock, CheckCircle, History, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { OrdenTrabajo, LogAuditoria } from '@/types/models'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { showError, showSuccess } from '@/components/common/toast-utils'

interface OrdenTrabajoDetailModalProps {
  isOpen: boolean
  onClose: () => void
  ordenId: number
  onRefresh?: () => void
}

export default function OrdenTrabajoDetailModal({ isOpen, onClose, ordenId, onRefresh }: OrdenTrabajoDetailModalProps) {
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null)
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'auditoria'>('general')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && ordenId) {
      loadOrdenData()
    }
  }, [isOpen, ordenId])

  const loadOrdenData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar datos de la orden
      const ordenData = await api.getOrdenTrabajo(ordenId)
      setOrden(ordenData)

      // Cargar logs de auditoría
      const logsData = await api.getLogsAuditoria({ modelo: 'ordentrabajo', objeto_id: ordenId.toString() })
      setLogs(Array.isArray(logsData?.logs) ? logsData.logs : [])
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Error al cargar los datos de la orden'
      setError(message)
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'asignar' | 'iniciar' | 'pausar' | 'completar' | 'cerrar') => {
    if (!orden) return

    setActionLoading(true)
    try {
      let result
      switch (action) {
        case 'asignar':
          // Este caso requiere un usuario_id, por ahora lo omitiremos o lo haremos en otro modal
          break
        case 'iniciar':
          result = await api.iniciarOrdenTrabajo(orden.id)
          break
        case 'pausar':
          result = await api.pausarOrdenTrabajo(orden.id)
          break
        case 'completar':
          result = await api.completarOrdenTrabajo(orden.id, { trabajo_realizado: 'Trabajo completado' })
          break
        case 'cerrar':
          result = await api.cerrarOrdenTrabajo(orden.id)
          break
      }

      if (result) {
        setOrden(result)
        if (onRefresh) onRefresh()
        const successMessages: Record<typeof action, string | null> = {
          asignar: null,
          iniciar: 'Orden de trabajo iniciada correctamente',
          pausar: 'Orden de trabajo pausada correctamente',
          completar: 'Orden de trabajo completada correctamente',
          cerrar: 'Orden de trabajo cerrada correctamente',
        }
        const successMessage = successMessages[action]
        if (successMessage) {
          showSuccess(successMessage)
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || `Error al ${action} la orden`
      showError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      ABIERTA: 'bg-blue-100 text-blue-800',
      ASIGNADA: 'bg-purple-100 text-purple-800',
      EN_PROCESO: 'bg-yellow-100 text-yellow-800',
      PAUSADA: 'bg-orange-100 text-orange-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const getPrioridadBadgeColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      BAJA: 'bg-gray-100 text-gray-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      ALTA: 'bg-orange-100 text-orange-800',
      URGENTE: 'bg-red-100 text-red-800',
    }
    return colors[prioridad] || 'bg-gray-100 text-gray-800'
  }

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return 'N/A'
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'N/A'
    }
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Código OT</span>
          </div>
          <p className="text-lg font-bold">{orden?.codigo}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Tipo</span>
          </div>
          <p className="text-lg font-bold">{orden?.tipo_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Máquina</span>
          </div>
          <p className="text-lg font-bold">{orden?.maquina_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Requiere Parada</span>
          </div>
          <p className="text-lg font-bold">{orden?.requiere_parada_produccion ? 'SÍ' : 'NO'}</p>
        </div>
      </div>

      {/* Título y Descripción */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{orden?.titulo}</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{orden?.descripcion}</p>
      </div>

      {/* Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Creada Por</span>
          </div>
          <p className="font-medium">{orden?.creada_por_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Asignada A</span>
          </div>
          <p className="font-medium">{orden?.asignada_a ? 'Usuario #' + orden.asignada_a : 'Sin asignar'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Completada Por</span>
          </div>
          <p className="font-medium">{orden?.completada_por ? 'Usuario #' + orden.completada_por : 'N/A'}</p>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Creación</span>
          </div>
          <p className="font-medium">{formatFecha(orden?.fecha_creacion)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Planificada</span>
          </div>
          <p className="font-medium">{formatFecha(orden?.fecha_planificada)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Inicio</span>
          </div>
          <p className="font-medium">{formatFecha(orden?.fecha_inicio)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Fin</span>
          </div>
          <p className="font-medium">{formatFecha(orden?.fecha_fin)}</p>
        </div>
      </div>

      {/* Duración y Costos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Duración Real</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {orden?.duracion_real_horas ? `${orden.duracion_real_horas.toFixed(1)} h` : 'N/A'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Costo Estimado</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {orden?.costo_estimado ? `$${orden.costo_estimado.toFixed(2)}` : 'N/A'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Costo Real</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {orden?.costo_real ? `$${orden.costo_real.toFixed(2)}` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Trabajo Realizado */}
      {orden?.trabajo_realizado && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Trabajo Realizado
          </h4>
          <p className="text-gray-700 whitespace-pre-wrap">{orden.trabajo_realizado}</p>
        </div>
      )}

      {/* Observaciones */}
      {orden?.observaciones && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Observaciones
          </h4>
          <p className="text-gray-700 whitespace-pre-wrap">{orden.observaciones}</p>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="bg-gray-50 p-4 rounded-lg border-t-4 border-blue-500">
        <h4 className="font-semibold mb-3">Acciones Rápidas</h4>
        <div className="flex flex-wrap gap-2">
          {orden?.estado === 'ABIERTA' && (
            <button
              onClick={() => handleAction('iniciar')}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Iniciar OT
            </button>
          )}
          {orden?.estado === 'EN_PROCESO' && (
            <>
              <button
                onClick={() => handleAction('pausar')}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Pausar OT
              </button>
              <button
                onClick={() => handleAction('completar')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Completar OT
              </button>
            </>
          )}
          {orden?.estado === 'COMPLETADA' && (
            <button
              onClick={() => handleAction('cerrar')}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Cerrar OT
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const renderAuditoriaTab = () => (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay logs de auditoría para esta orden</p>
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{log.accion_display}</h4>
                <p className="text-sm text-gray-600">{log.usuario_nombre}</p>
              </div>
              <span className="text-xs text-gray-500">{formatFecha(log.fecha)}</span>
            </div>

            {log.cambios && Object.keys(log.cambios).length > 0 && (
              <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                <p className="font-medium mb-1">Cambios:</p>
                <pre className="text-gray-700 overflow-x-auto">{JSON.stringify(log.cambios, null, 2)}</pre>
              </div>
            )}

            {log.ip_address && (
              <div className="mt-2 text-xs text-gray-500">
                IP: {log.ip_address}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Detalle de Orden de Trabajo</h2>
                {orden && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{orden.codigo}</span>
                    <Badge className={getEstadoBadgeColor(orden.estado)}>
                      {orden.estado}
                    </Badge>
                    <Badge className={getPrioridadBadgeColor(orden.prioridad)}>
                      {orden.prioridad}
                    </Badge>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Wrench className="w-4 h-4" />
                General
              </button>
              <button
                onClick={() => setActiveTab('auditoria')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'auditoria'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <History className="w-4 h-4" />
                Auditoría
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'auditoria' && renderAuditoriaTab()}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
