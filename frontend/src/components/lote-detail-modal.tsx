'use client'

import { useState, useEffect } from 'react'
import { X, Package, Calendar, User, AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Lote, LoteEtapa, ControlCalidad } from '@/types/models'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

interface LoteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  loteId: number | null
  onEdit?: (lote: any) => void
  onUpdate?: () => void
}

export default function LoteDetailModal({ isOpen, onClose, loteId, onEdit, onUpdate }: LoteDetailModalProps) {
  const [lote, setLote] = useState<Lote | null>(null)
  const [etapas, setEtapas] = useState<LoteEtapa[]>([])
  const [controles, setControles] = useState<ControlCalidad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'etapas' | 'calidad'>('general')

  useEffect(() => {
    if (isOpen && loteId) {
      loadLoteData()
    }
  }, [isOpen, loteId])

  const loadLoteData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Cargar datos del lote
      const loteData = await api.getLote(loteId)
      setLote(loteData)

      // Cargar etapas del lote
      const etapasData = await api.getLotesEtapas({ lote: loteId })
      setEtapas(Array.isArray(etapasData?.results) ? etapasData.results : [])

      // Cargar controles de calidad
      const controlesData = await api.getControlesCalidad({ lote_etapa: loteId })
      setControles(Array.isArray(controlesData?.results) ? controlesData.results : [])
    } catch (err: any) {
      console.error('Error loading lote data:', err)
      setError(err.response?.data?.detail || 'Error al cargar los datos del lote')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      PLANIFICADO: 'bg-blue-100 text-blue-800',
      EN_PROCESO: 'bg-yellow-100 text-yellow-800',
      PAUSADO: 'bg-orange-100 text-orange-800',
      FINALIZADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
      LIBERADO: 'bg-purple-100 text-purple-800',
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

  const calcularProgreso = () => {
    if (!lote) return 0
    if (lote.cantidad_planificada <= 0) return 0
    return Math.min(100, (lote.cantidad_producida / lote.cantidad_planificada) * 100)
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Código Lote</span>
          </div>
          <p className="text-lg font-bold">{lote?.codigo_lote}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Producto</span>
          </div>
          <p className="text-lg font-bold">{lote?.producto_nombre}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Supervisor</span>
          </div>
          <p className="text-lg font-bold">{lote?.supervisor_nombre || 'N/A'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Turno</span>
          </div>
          <p className="text-lg font-bold">{lote?.turno_nombre || 'N/A'}</p>
        </div>
      </div>

      {/* Cantidades y Rendimiento */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Producción y Rendimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Planificada</p>
            <p className="text-2xl font-bold text-gray-900">
              {lote?.cantidad_planificada} <span className="text-sm">{lote?.unidad}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Producida</p>
            <p className="text-2xl font-bold text-green-600">
              {lote?.cantidad_producida} <span className="text-sm">{lote?.unidad}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rechazada</p>
            <p className="text-2xl font-bold text-red-600">
              {lote?.cantidad_rechazada} <span className="text-sm">{lote?.unidad}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rendimiento</p>
            <p className="text-2xl font-bold text-purple-600">
              {lote?.rendimiento_porcentaje?.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progreso de Producción</span>
            <span className="font-semibold">{calcularProgreso().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${calcularProgreso()}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Planificada Inicio</span>
          </div>
          <p className="font-medium">{formatFecha(lote?.fecha_planificada_inicio)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Planificada Fin</span>
          </div>
          <p className="font-medium">{formatFecha(lote?.fecha_planificada_fin)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Real Inicio</span>
          </div>
          <p className="font-medium">{formatFecha(lote?.fecha_real_inicio)}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Fecha Real Fin</span>
          </div>
          <p className="font-medium">{formatFecha(lote?.fecha_real_fin)}</p>
        </div>
      </div>

      {/* Observaciones */}
      {lote?.observaciones && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-yellow-700" />
            <span className="text-sm font-medium text-yellow-700">Observaciones</span>
          </div>
          <p className="text-gray-700">{lote.observaciones}</p>
        </div>
      )}
    </div>
  )

  const renderEtapasTab = () => (
    <div className="space-y-4">
      {etapas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay etapas registradas para este lote</p>
        </div>
      ) : (
        etapas.map((etapa) => (
          <div key={etapa.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-lg">{etapa.etapa_nombre}</h4>
                <p className="text-sm text-gray-600">Orden: {etapa.orden} | Máquina: {etapa.maquina_nombre}</p>
              </div>
              <Badge className={getEstadoBadgeColor(etapa.estado)}>
                {etapa.estado}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Operario</p>
                <p className="font-medium">{etapa.operario_nombre || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Entrada</p>
                <p className="font-medium">{etapa.cantidad_entrada || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Salida</p>
                <p className="font-medium">{etapa.cantidad_salida || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rendimiento</p>
                <p className="font-medium text-purple-600">
                  {etapa.porcentaje_rendimiento ? `${etapa.porcentaje_rendimiento.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Inicio</p>
                <p className="font-medium">{formatFecha(etapa.fecha_inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fin</p>
                <p className="font-medium">{formatFecha(etapa.fecha_fin)}</p>
              </div>
            </div>

            {etapa.observaciones && (
              <div className="mt-3 text-sm bg-gray-50 p-2 rounded">
                <p className="text-gray-600">{etapa.observaciones}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )

  const renderCalidadTab = () => (
    <div className="space-y-4">
      {controles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay controles de calidad registrados para este lote</p>
        </div>
      ) : (
        controles.map((control) => (
          <div key={control.id} className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${control.conforme ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{control.tipo_control}</h4>
                <p className="text-sm text-gray-600">{control.lote_etapa_descripcion}</p>
              </div>
              <Badge className={control.conforme ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {control.conforme ? 'CONFORME' : 'NO CONFORME'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Valor Medido</p>
                <p className="text-lg font-bold">{control.valor_medido} <span className="text-sm">{control.unidad}</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mínimo</p>
                <p className="font-medium">{control.valor_minimo} {control.unidad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Máximo</p>
                <p className="font-medium">{control.valor_maximo} {control.unidad}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Control</p>
                <p className="font-medium">{formatFecha(control.fecha_control)}</p>
              </div>
            </div>

            {control.observaciones && (
              <div className="bg-gray-50 p-2 rounded text-sm">
                <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                <p className="text-gray-700">{control.observaciones}</p>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              Controlado por: {control.controlado_por_nombre}
            </div>
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
          className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">Detalle de Lote</h2>
                {lote && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lote.codigo_lote}</span>
                    <Badge className={getEstadoBadgeColor(lote.estado)}>
                      {lote.estado}
                    </Badge>
                    <Badge className={getPrioridadBadgeColor(lote.prioridad)}>
                      {lote.prioridad}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onEdit && lote && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(lote)}
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
            <div className="flex overflow-x-auto">
              {[
                { id: 'general', label: 'General', icon: Package },
                { id: 'etapas', label: 'Etapas', icon: TrendingUp },
                { id: 'calidad', label: 'Calidad', icon: CheckCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
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
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'etapas' && renderEtapasTab()}
                {activeTab === 'calidad' && renderCalidadTab()}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
