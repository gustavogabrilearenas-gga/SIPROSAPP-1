'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LoteEtapa } from '@/types/models'
import { CheckCircle, Clock, XCircle, Pause, Play, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LoteEtapasTimelineProps {
  loteId: number
  etapas: LoteEtapa[]
  onRefresh?: () => void
}

export default function LoteEtapasTimeline({ loteId, etapas, onRefresh }: LoteEtapasTimelineProps) {
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'EN_PROCESO':
        return <Play className="w-6 h-6 text-blue-600 animate-pulse" />
      case 'PAUSADO':
        return <Pause className="w-6 h-6 text-orange-600" />
      case 'RECHAZADO':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'PENDIENTE':
      default:
        return <Clock className="w-6 h-6 text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'border-green-500 bg-green-50'
      case 'EN_PROCESO':
        return 'border-blue-500 bg-blue-50'
      case 'PAUSADO':
        return 'border-orange-500 bg-orange-50'
      case 'RECHAZADO':
        return 'border-red-500 bg-red-50'
      case 'PENDIENTE':
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getConnectorColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
        return 'bg-green-500'
      case 'EN_PROCESO':
        return 'bg-blue-500'
      case 'PAUSADO':
        return 'bg-orange-500'
      case 'RECHAZADO':
        return 'bg-red-500'
      case 'PENDIENTE':
      default:
        return 'bg-gray-300'
    }
  }

  const formatFecha = (fecha: string | null | undefined) => {
    if (!fecha) return 'N/A'
    try {
      const date = new Date(fecha)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'N/A'
    }
  }

  const calcularDuracion = (inicio: string | null | undefined, fin: string | null | undefined) => {
    if (!inicio) return 'N/A'
    try {
      const fechaInicio = new Date(inicio)
      const fechaFin = fin ? new Date(fin) : new Date()
      const diffMs = fechaFin.getTime() - fechaInicio.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    } catch {
      return 'N/A'
    }
  }

  if (!etapas || etapas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay etapas definidas para este lote</p>
      </div>
    )
  }

  // Ordenar etapas por orden
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden)

  return (
    <div className="relative">
      {etapasOrdenadas.map((etapa, index) => (
        <motion.div
          key={etapa.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative pb-8"
        >
          <div className="flex items-start gap-4">
            {/* Timeline Icon */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${getEstadoColor(etapa.estado)}`}>
                {getEstadoIcon(etapa.estado)}
              </div>
              {/* Connector Line */}
              {index < etapasOrdenadas.length - 1 && (
                <div className={`absolute left-1/2 top-12 w-1 h-12 -ml-0.5 ${getConnectorColor(etapa.estado)}`} />
              )}
            </div>

            {/* Content Card */}
            <div className={`flex-1 border-2 rounded-lg p-4 ${getEstadoColor(etapa.estado)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded">
                      ETAPA {etapa.orden}
                    </span>
                    <Badge className={`text-xs ${getEstadoColor(etapa.estado)}`}>
                      {etapa.estado}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{etapa.etapa_nombre}</h3>
                  <p className="text-sm text-gray-600">
                    Máquina: <span className="font-medium">{etapa.maquina_nombre}</span>
                  </p>
                </div>
                {etapa.porcentaje_rendimiento !== null && etapa.porcentaje_rendimiento !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {etapa.porcentaje_rendimiento.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Rendimiento</div>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {etapa.operario_nombre && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500">Operario</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{etapa.operario_nombre}</div>
                  </div>
                )}
                {etapa.cantidad_entrada !== null && etapa.cantidad_entrada !== undefined && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500">Entrada</div>
                    <div className="text-sm font-bold text-blue-600">{etapa.cantidad_entrada}</div>
                  </div>
                )}
                {etapa.cantidad_salida !== null && etapa.cantidad_salida !== undefined && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500">Salida</div>
                    <div className="text-sm font-bold text-green-600">{etapa.cantidad_salida}</div>
                  </div>
                )}
                {etapa.cantidad_merma !== null && etapa.cantidad_merma !== undefined && etapa.cantidad_merma > 0 && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500">Merma</div>
                    <div className="text-sm font-bold text-red-600">{etapa.cantidad_merma}</div>
                  </div>
                )}
              </div>

              {/* Timeline Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">Inicio</div>
                  <div className="font-medium text-gray-900">{formatFecha(etapa.fecha_inicio)}</div>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">Fin</div>
                  <div className="font-medium text-gray-900">{formatFecha(etapa.fecha_fin)}</div>
                </div>
                {etapa.duracion_minutos !== null && etapa.duracion_minutos !== undefined && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">Duración</div>
                    <div className="font-medium text-gray-900">{etapa.duracion_minutos} min</div>
                  </div>
                )}
                {etapa.estado === 'EN_PROCESO' && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-xs text-gray-500 mb-1">Tiempo transcurrido</div>
                    <div className="font-medium text-blue-600">{calcularDuracion(etapa.fecha_inicio, null)}</div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {etapa.observaciones && (
                <div className="mt-3 bg-white rounded-lg p-3 border-l-4 border-yellow-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Observaciones</div>
                      <p className="text-sm text-gray-600">{etapa.observaciones}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aprobación de Calidad */}
              {etapa.requiere_aprobacion_calidad && (
                <div className="mt-3 bg-white rounded-lg p-3 border-l-4 border-purple-400">
                  <div className="flex items-center gap-2">
                    {etapa.aprobada_por_calidad ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div className="text-sm">
                          <span className="font-semibold text-green-700">Aprobada por Calidad</span>
                          {etapa.aprobada_por_calidad_nombre && (
                            <span className="text-gray-600"> - {etapa.aprobada_por_calidad_nombre}</span>
                          )}
                          {etapa.fecha_aprobacion_calidad && (
                            <span className="text-gray-500 text-xs ml-2">{formatFecha(etapa.fecha_aprobacion_calidad)}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-700">Pendiente de Aprobación de Calidad</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
