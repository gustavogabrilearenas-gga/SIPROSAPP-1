'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LoteEtapa } from '@/types/models'
import { Play, Pause, CheckCircle, Edit, Trash2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

interface LoteEtapasListProps {
  loteId: number
  etapas: LoteEtapa[]
  onRefresh: () => void
}

export default function LoteEtapasList({ loteId, etapas, onRefresh }: LoteEtapasListProps) {
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleIniciarEtapa = async (etapaId: number) => {
    setLoading(etapaId)
    setError(null)
    try {
      await api.iniciarLoteEtapa(etapaId)
      onRefresh()
    } catch (err: any) {
      console.error('Error iniciando etapa:', err)
      setError(err.response?.data?.detail || 'Error al iniciar la etapa')
    } finally {
      setLoading(null)
    }
  }

  const handlePausarEtapa = async (etapaId: number) => {
    setLoading(etapaId)
    setError(null)
    try {
      await api.pausarLoteEtapa(etapaId)
      onRefresh()
    } catch (err: any) {
      console.error('Error pausando etapa:', err)
      setError(err.response?.data?.detail || 'Error al pausar la etapa')
    } finally {
      setLoading(null)
    }
  }

  const handleCompletarEtapa = async (etapaId: number) => {
    // Pedir confirmación
    const confirmar = window.confirm('¿Está seguro de completar esta etapa? Asegúrese de que todos los controles de calidad estén registrados.')
    if (!confirmar) return

    setLoading(etapaId)
    setError(null)
    try {
      await api.completarLoteEtapa(etapaId, {})
      onRefresh()
    } catch (err: any) {
      console.error('Error completando etapa:', err)
      setError(err.response?.data?.detail || 'Error al completar la etapa')
      alert(err.response?.data?.detail || 'Error al completar la etapa')
    } finally {
      setLoading(null)
    }
  }

  const getEstadoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-gray-100 text-gray-800',
      EN_PROCESO: 'bg-blue-100 text-blue-800',
      PAUSADO: 'bg-orange-100 text-orange-800',
      COMPLETADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  if (!etapas || etapas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay etapas definidas para este lote</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Agregar Primera Etapa
        </button>
      </div>
    )
  }

  // Ordenar etapas por orden
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden)

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {etapasOrdenadas.map((etapa, index) => (
        <motion.div
          key={etapa.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded">
                  ETAPA {etapa.orden}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{etapa.etapa_nombre}</h3>
                <Badge className={getEstadoBadgeColor(etapa.estado)}>
                  {etapa.estado}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Máquina: <span className="font-medium">{etapa.maquina_nombre}</span>
              </p>
              {etapa.operario_nombre && (
                <p className="text-sm text-gray-600">
                  Operario: <span className="font-medium">{etapa.operario_nombre}</span>
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              {etapa.estado === 'PENDIENTE' && (
                <button
                  onClick={() => handleIniciarEtapa(etapa.id)}
                  disabled={loading === etapa.id}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  title="Iniciar etapa"
                >
                  {loading === etapa.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Iniciar
                    </>
                  )}
                </button>
              )}

              {etapa.estado === 'EN_PROCESO' && (
                <>
                  <button
                    onClick={() => handlePausarEtapa(etapa.id)}
                    disabled={loading === etapa.id}
                    className="flex items-center gap-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm"
                    title="Pausar etapa"
                  >
                    {loading === etapa.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Pause className="w-4 h-4" />
                        Pausar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCompletarEtapa(etapa.id)}
                    disabled={loading === etapa.id}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    title="Completar etapa"
                  >
                    {loading === etapa.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </>
                    )}
                  </button>
                </>
              )}

              {etapa.estado === 'PAUSADO' && (
                <button
                  onClick={() => handleIniciarEtapa(etapa.id)}
                  disabled={loading === etapa.id}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                  title="Reanudar etapa"
                >
                  {loading === etapa.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Reanudar
                    </>
                  )}
                </button>
              )}

              {etapa.estado === 'COMPLETADO' && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Completada
                </div>
              )}
            </div>
          </div>

          {/* Detalles de Cantidades */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {etapa.cantidad_entrada !== null && etapa.cantidad_entrada !== undefined && (
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">Entrada</div>
                <div className="text-lg font-bold text-blue-600">{etapa.cantidad_entrada}</div>
              </div>
            )}
            {etapa.cantidad_salida !== null && etapa.cantidad_salida !== undefined && (
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">Salida</div>
                <div className="text-lg font-bold text-green-600">{etapa.cantidad_salida}</div>
              </div>
            )}
            {etapa.cantidad_merma !== null && etapa.cantidad_merma !== undefined && etapa.cantidad_merma > 0 && (
              <div className="bg-red-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">Merma</div>
                <div className="text-lg font-bold text-red-600">{etapa.cantidad_merma}</div>
              </div>
            )}
            {etapa.porcentaje_rendimiento !== null && etapa.porcentaje_rendimiento !== undefined && (
              <div className="bg-purple-50 rounded-lg p-2">
                <div className="text-xs text-gray-600">Rendimiento</div>
                <div className="text-lg font-bold text-purple-600">
                  {etapa.porcentaje_rendimiento.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Tiempos */}
          {(etapa.fecha_inicio || etapa.duracion_minutos) && (
            <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
              {etapa.fecha_inicio && (
                <div>
                  <span className="font-medium">Inicio:</span>{' '}
                  {new Date(etapa.fecha_inicio).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {etapa.fecha_fin && (
                <div>
                  <span className="font-medium">Fin:</span>{' '}
                  {new Date(etapa.fecha_fin).toLocaleString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {etapa.duracion_minutos !== null && etapa.duracion_minutos !== undefined && (
                <div>
                  <span className="font-medium">Duración:</span> {etapa.duracion_minutos} min
                </div>
              )}
            </div>
          )}

          {/* Observaciones */}
          {etapa.observaciones && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Observaciones:</span> {etapa.observaciones}
              </p>
            </div>
          )}

          {/* Aprobación de Calidad */}
          {etapa.requiere_aprobacion_calidad && (
            <div className={`mt-3 rounded-lg p-3 ${etapa.aprobada_por_calidad ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <p className="text-sm">
                {etapa.aprobada_por_calidad ? (
                  <span className="font-semibold text-green-700">
                    ✓ Aprobada por Calidad
                    {etapa.aprobada_por_calidad_nombre && ` - ${etapa.aprobada_por_calidad_nombre}`}
                  </span>
                ) : (
                  <span className="font-semibold text-orange-700">
                    ⏳ Requiere Aprobación de Calidad
                  </span>
                )}
              </p>
            </div>
          )}
        </motion.div>
      ))}

      {/* Botón para agregar nueva etapa */}
      <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 font-medium flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        Agregar Nueva Etapa
      </button>
    </div>
  )
}
