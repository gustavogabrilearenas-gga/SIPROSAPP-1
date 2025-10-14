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
import { Clock, Plus, Search, Edit, ArrowLeft, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import ParadaFormModal from '@/components/paradas/ParadaFormModal'
import DataState from '@/components/common/data-state'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Parada as ParadaModel } from '@/types/models'

type Parada = ParadaModel

export default function ParadasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paradas, setParadas] = useState<Parada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('TODAS')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedParadaId, setSelectedParadaId] = useState<number | null>(null)

  useEffect(() => {
    fetchParadas()
  }, [])

  const fetchParadas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getParadas({ ordering: '-fecha_inicio' })
      setParadas(response.results || response)
    } catch (error: any) {
      const message = error?.message || 'No se pudieron obtener las paradas'
      setError(message)
      showError('Error al cargar paradas', message)
    } finally {
      setLoading(false)
    }
  }

  const search = searchTerm.trim().toLowerCase()

  const filteredParadas = paradas.filter(p => {
    const loteCodigo = p.lote_codigo ?? `LOTE-${p.lote_etapa}`
    const categoria = p.categoria_display ?? p.categoria ?? ''
    const descripcion = p.descripcion ?? ''
    const etapa = p.etapa_nombre ?? p.lote_etapa_descripcion ?? ''
    const registradoPor = p.registrado_por_nombre ?? ''
    const matchesSearch = !search || [
      loteCodigo,
      categoria,
      descripcion,
      etapa,
      registradoPor,
    ]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(search))
    const matchesFilter = filterTipo === 'TODAS' || p.tipo === filterTipo
    return matchesSearch && matchesFilter
  })

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      PLANIFICADA: 'bg-blue-100 text-blue-800',
      NO_PLANIFICADA: 'bg-red-100 text-red-800',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      FALLA_EQUIPO: 'bg-red-100 text-red-800',
      FALTA_INSUMO: 'bg-orange-100 text-orange-800',
      CAMBIO_FORMATO: 'bg-blue-100 text-blue-800',
      LIMPIEZA: 'bg-green-100 text-green-800',
      CALIDAD: 'bg-purple-100 text-purple-800',
      OTROS: 'bg-gray-100 text-gray-800',
    }
    return colors[categoria] || 'bg-gray-100 text-gray-800'
  }

  const getEstadoIcon = (fechaFin: string | null) => {
    return fechaFin ? CheckCircle : Clock
  }

  const getEstadoColor = (fechaFin: string | null) => {
    return fechaFin ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const formatDuration = (parada: Parada) => {
    if (parada.duracion_legible) return parada.duracion_legible

    const minutos = parada.duracion_actual_minutos ?? parada.duracion_minutos
    if (minutos == null) return 'En curso'
    if (minutos <= 0) return 'En curso (<1 min)'
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return mins === 0 ? `${horas} h` : `${horas} h ${mins} min`
  }

  const handleFinalizarParada = async (parada: Parada) => {
    const solucion = window.prompt(
      `Ingrese la solución aplicada para la parada del ${
        parada.lote_codigo ?? `lote ${parada.lote_etapa}`
      }`,
      parada.solucion ?? '',
    )

    if (!solucion || !solucion.trim()) {
      showError('Operación cancelada', 'Debes ingresar una solución para finalizar la parada.')
      return
    }

    try {
      await api.finalizarParada(parada.id, { solucion: solucion.trim() })
      showSuccess('Parada finalizada', 'La parada se finalizó correctamente.')
      fetchParadas()
    } catch (error: any) {
      const message = error?.message || 'No se pudo finalizar la parada'
      showError('Error al finalizar', message)
    }
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar paradas${error ? `: ${error}` : ''}` : null
  const isEmptyState = !loading && !hasError && filteredParadas.length === 0

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
                    <Clock className="w-8 h-8 text-orange-600" />
                    Gestión de Paradas
                  </h1>
                  <p className="text-gray-600">Registro de interrupciones de producción</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedParadaId(null)
                  setIsFormOpen(true)
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Parada
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por lote, categoría o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['TODAS', 'PLANIFICADA', 'NO_PLANIFICADA'].map(tipo => (
                <Button
                  key={tipo}
                  variant={filterTipo === tipo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo(tipo)}
                >
                  {tipo.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </motion.div>

          <DataState
            loading={loading}
            error={dataStateError}
            empty={isEmptyState}
            emptyMessage={
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron paradas</p>
              </div>
            }
          >
            <div className="space-y-4">
              {filteredParadas.map((parada, index) => {
                const EstadoIcon = getEstadoIcon(parada.fecha_fin)
                const isEnCurso = !parada.fecha_fin
                const loteCodigo = parada.lote_codigo ?? `Lote #${parada.lote_etapa}`
                const etapaNombre = parada.etapa_nombre ?? parada.etapa_codigo ?? `Etapa #${parada.lote_etapa}`
                const registradoPor =
                  parada.registrado_por_nombre ?? `Usuario #${parada.registrado_por}`

                return (
                  <motion.div
                    key={parada.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card
                      className={`hover:shadow-xl transition-shadow duration-300 ${
                        isEnCurso ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{loteCodigo}</h3>
                              <Badge className={getTipoColor(parada.tipo)}>
                                {(parada.tipo_display ?? parada.tipo).replace('_', ' ')}
                              </Badge>
                              <Badge className={getCategoriaColor(parada.categoria)}>
                                {(parada.categoria_display ?? parada.categoria).replace('_', ' ')}
                              </Badge>
                              <Badge className={getEstadoColor(parada.fecha_fin)}>
                                <EstadoIcon className="w-3 h-3 mr-1" />
                                {isEnCurso ? 'En Curso' : 'Finalizada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Etapa: {etapaNombre}
                            </p>
                            <p className="text-gray-800">{parada.descripcion}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{new Date(parada.fecha_inicio).toLocaleString()}</p>
                            <p>Por: {registradoPor}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Inicio</p>
                            <p className="font-medium">{new Date(parada.fecha_inicio).toLocaleTimeString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fin</p>
                            <p className="font-medium">
                              {parada.fecha_fin ? new Date(parada.fecha_fin).toLocaleTimeString() : 'En curso'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Duración</p>
                            <p className="font-bold text-orange-600">{formatDuration(parada)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Estado</p>
                            <p className="font-medium">{isEnCurso ? 'Activa' : 'Resuelta'}</p>
                          </div>
                        </div>

                        {parada.solucion && (
                          <div className="bg-green-50 p-3 rounded text-sm">
                            <p className="font-medium text-green-800 mb-1">Solución:</p>
                            <p className="text-green-700">{parada.solucion}</p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedParadaId(parada.id)
                              setIsFormOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {isEnCurso && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200"
                              onClick={() => handleFinalizarParada(parada)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </DataState>
        </main>
      </div>
      <ParadaFormModal
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedParadaId(null)
        }}
        initialData={
          selectedParadaId
            ? (() => {
                const parada = paradas.find((item) => item.id === selectedParadaId)
                return parada
                  ? {
                      id: parada.id,
                      loteEtapa: parada.lote_etapa,
                      tipo: (parada.tipo as 'PLANIFICADA' | 'NO_PLANIFICADA') ?? 'PLANIFICADA',
                      categoria:
                        (parada.categoria as
                          | 'FALLA_EQUIPO'
                          | 'FALTA_INSUMO'
                          | 'CAMBIO_FORMATO'
                          | 'LIMPIEZA'
                          | 'CALIDAD'
                          | 'OTROS') ?? 'OTROS',
                      fechaInicio: parada.fecha_inicio,
                      descripcion: parada.descripcion ?? '',
                      solucion: parada.solucion ?? '',
                    }
                  : undefined
              })()
            : undefined
        }
        onSuccess={() => {
          fetchParadas()
        }}
        currentUserId={user?.id ?? null}
      />
    </ProtectedRoute>
  )
}
