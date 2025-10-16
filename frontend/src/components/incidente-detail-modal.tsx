'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Calendar, User, MapPin, Package, History, FileText } from '@/lib/icons'
import { motion, AnimatePresence } from '@/lib/motion'
import { Button } from '@/components/ui/button'
import { Incidente, LogAuditoria } from '@/types/models'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

interface IncidenteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  incidenteId: number
  onEdit?: (incidente: any) => void
}

export default function IncidenteDetailModal({ isOpen, onClose, incidenteId, onEdit }: IncidenteDetailModalProps) {
  const [incidente, setIncidente] = useState<Incidente | null>(null)
  const [logs, setLogs] = useState<LogAuditoria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'auditoria'>('general')

  useEffect(() => {
    if (isOpen && incidenteId) {
      loadIncidenteData()
    }
  }, [isOpen, incidenteId])

  const loadIncidenteData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar datos del incidente
      const incidenteData = await api.getIncidente(incidenteId)
      setIncidente(incidenteData)

  // Cargar logs de auditoría (usar nombre de modelo del backend)
  const logsData = await api.getLogsAuditoria({ modelo: 'Incidente', objeto_id: incidenteId.toString() })
      setLogs(Array.isArray(logsData?.logs) ? logsData.logs : [])
    } catch (err: any) {
      console.error('Error loading incidente data:', err)
      setError(err.response?.data?.detail || 'Error al cargar los datos del incidente')
    } finally {
      setLoading(false)
    }
  }

  const getSeveridadBadgeColor = (severidad: string) => {
    const colors: Record<string, string> = {
      MENOR: 'bg-blue-100 text-blue-800',
      MODERADA: 'bg-yellow-100 text-yellow-800',
      MAYOR: 'bg-orange-100 text-orange-800',
      CRITICA: 'bg-red-100 text-red-800',
    }
    return colors[severidad] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      ABIERTO: 'bg-blue-100 text-blue-800',
      EN_INVESTIGACION: 'bg-yellow-100 text-yellow-800',
      ACCION_CORRECTIVA: 'bg-orange-100 text-orange-800',
      CERRADO: 'bg-green-100 text-green-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
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
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Código</span>
          </div>
          <p className="text-lg font-bold">{incidente?.codigo}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Tipo</span>
          </div>
          <p className="text-lg font-bold">{incidente?.tipo_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Ubicación</span>
          </div>
          <p className="text-lg font-bold">{incidente?.ubicacion_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Máquina</span>
          </div>
          <p className="text-lg font-bold">{incidente?.maquina_nombre || 'N/A'}</p>
        </div>
      </div>

      {/* Título */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-semibold text-xl mb-2">{incidente?.titulo}</h3>
      </div>

      {/* Descripción */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600" />
          Descripción del Incidente
        </h4>
        <p className="text-gray-700 whitespace-pre-wrap">{incidente?.descripcion}</p>
      </div>

      {/* Lote Afectado */}
      {incidente?.lote_afectado && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-yellow-700" />
            <span className="text-sm font-medium text-yellow-700">Lote Afectado</span>
          </div>
          <p className="text-lg font-bold">{incidente.lote_afectado_codigo}</p>
        </div>
      )}

      {/* Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Reportado Por</span>
          </div>
          <p className="font-medium">{incidente?.reportado_por_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Asignado A</span>
          </div>
          <p className="font-medium">{incidente?.asignado_a_nombre || 'Sin asignar'}</p>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Ocurrencia</span>
          </div>
          <p className="font-medium">{formatFecha(incidente?.fecha_ocurrencia)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Reporte</span>
          </div>
          <p className="font-medium">{formatFecha(incidente?.fecha_reporte)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Cierre</span>
          </div>
          <p className="font-medium">{formatFecha(incidente?.fecha_cierre)}</p>
        </div>
      </div>

      {/* Impactos */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-2 border-red-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Análisis de Impactos
        </h3>

        <div className="space-y-4">
          {incidente?.impacto_produccion && (
            <div className="bg-white p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-red-700">Impacto en Producción</h4>
              <p className="text-gray-700">{incidente.impacto_produccion}</p>
            </div>
          )}

          {incidente?.impacto_calidad && (
            <div className="bg-white p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-orange-700">Impacto en Calidad</h4>
              <p className="text-gray-700">{incidente.impacto_calidad}</p>
            </div>
          )}

          {incidente?.impacto_seguridad && (
            <div className="bg-white p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-purple-700">Impacto en Seguridad</h4>
              <p className="text-gray-700">{incidente.impacto_seguridad}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notificación ANMAT */}
      {incidente?.requiere_notificacion_anmat && (
        <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-800 text-lg">Requiere Notificación a ANMAT</h4>
              <p className="text-red-700 text-sm mt-1">
                Este incidente debe ser reportado a la Autoridad Nacional de Medicamentos, Alimentos y Tecnología Médica.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderAuditoriaTab = () => (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay logs de auditoría para este incidente</p>
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
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
              <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Detalle de Incidente</h2>
                {incidente && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{incidente.codigo}</span>
                    <Badge className={getSeveridadBadgeColor(incidente.severidad)}>
                      {incidente.severidad}
                    </Badge>
                    <Badge className={getEstadoBadgeColor(incidente.estado)}>
                      {incidente.estado}
                    </Badge>
                    {incidente.requiere_notificacion_anmat && (
                      <Badge className="bg-red-900 text-white">
                        ANMAT
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {incidente && onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        onEdit(incidente)
                      } finally {
                        onClose()
                      }
                    }}
                    className="bg-white/10 text-white"
                  >
                    Editar
                  </Button>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
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
                <AlertTriangle className="w-4 h-4" />
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
