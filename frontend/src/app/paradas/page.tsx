'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
import { api, handleApiError } from '@/lib/api'
import DataState from '@/components/common/data-state'
import { showError, showSuccess } from '@/components/common/toast-utils'
import ParadaFormModal from '@/components/paradas/ParadaFormModal'

interface Parada {
  id: number
  lote_etapa: number
  lote_etapa_codigo?: string
  lote_codigo?: string
  tipo?: string
  tipo_display?: string
  categoria?: string
  categoria_display?: string
  fecha_inicio?: string
  fecha_fin?: string | null
  duracion_minutos?: number | null
  descripcion?: string
  solucion?: string
  registrado_por?: number
  registrado_por_nombre?: string
  estado?: string
}

const toLocalDateTimeInput = (value: string) => {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function ParadasPage() {
  const router = useRouter()
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
      const response = await api.getParadas()
      const items = Array.isArray(response) ? response : response?.results ?? []
      setParadas(items)
    } catch (error) {
      const { message } = handleApiError(error)
      setError(message || 'No se pudieron obtener las paradas')
      showError('Error al cargar paradas', message || 'No se pudieron obtener las paradas')
    } finally {
      setLoading(false)
    }
  }

  const filteredParadas = paradas.filter((p) => {
    const search = searchTerm.toLowerCase()
    const lote = (p.lote_codigo ?? `Lote ${p.lote_etapa ?? ''}`).toLowerCase()
    const categoria = (p.categoria ?? '').toLowerCase()
    const descripcion = (p.descripcion ?? '').toLowerCase()
    const matchesSearch = lote.includes(search) || categoria.includes(search) || descripcion.includes(search)
    const matchesFilter = filterTipo === 'TODAS' || (p.tipo ?? '').toUpperCase() === filterTipo
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

  const formatDuration = (minutos: number | null) => {
    if (!minutos) return 'En curso'
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar paradas${error ? `: ${error}` : ''}` : null
  const isEmptyState = !loading && !hasError && filteredParadas.length === 0

  const selectedParada = selectedParadaId
    ? paradas.find((item) => item.id === selectedParadaId) ?? null
    : null

  const handleModalOpenChange = (openState: boolean) => {
    setIsFormOpen(openState)
    if (!openState) {
      setSelectedParadaId(null)
    }
  }

  const handleFinalizarParada = async (parada: Parada) => {
    const solucion = window.prompt(
      'Ingrese la solución para finalizar la parada',
      parada.solucion ?? '',
    )

    if (solucion === null) {
      return
    }

    const trimmed = solucion.trim()
    if (!trimmed) {
      showError('Solución requerida', 'Debe ingresar una solución para finalizar la parada')
      return
    }

    try {
      await api.finalizarParada(parada.id, { solucion: trimmed })
      showSuccess('Parada finalizada', 'La parada se finalizó correctamente')
      await fetchParadas()
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudo finalizar la parada', message)
    }
  }

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
                  onClick={() => router.push('/')}
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
                const tipo = (parada.tipo ?? 'DESCONOCIDO').toUpperCase()
                const categoria = parada.categoria ?? 'OTROS'
                const loteCodigo = parada.lote_codigo ?? `Lote ${parada.lote_etapa ?? '—'}`
                const etapaCodigo = parada.lote_etapa_codigo ?? String(parada.lote_etapa ?? '—')
                const fechaInicio = parada.fecha_inicio ? new Date(parada.fecha_inicio) : null

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
                              <Badge className={getTipoColor(tipo)}>
                                {parada.tipo_display ?? tipo}
                              </Badge>
                              <Badge className={getCategoriaColor(categoria)}>
                                {(parada.categoria_display ?? categoria).replace('_', ' ')}
                              </Badge>
                              <Badge className={getEstadoColor(parada.fecha_fin)}>
                                <EstadoIcon className="w-3 h-3 mr-1" />
                                {isEnCurso ? 'En Curso' : 'Finalizada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Etapa: {etapaCodigo}</p>
                            <p className="text-gray-800">{parada.descripcion ?? 'Sin descripción'}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{fechaInicio ? fechaInicio.toLocaleString() : 'Sin fecha'}</p>
                            <p>Por: {parada.registrado_por_nombre ?? '—'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Inicio</p>
                            <p className="font-medium">
                              {fechaInicio ? fechaInicio.toLocaleTimeString() : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Fin</p>
                            <p className="font-medium">
                              {parada.fecha_fin ? new Date(parada.fecha_fin).toLocaleTimeString() : 'En curso'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Duración</p>
                            <p className="font-bold text-orange-600">{formatDuration(parada.duracion_minutos)}</p>
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
        <ParadaFormModal
          open={isFormOpen}
          onClose={handleModalOpenChange}
          onSubmitSuccess={fetchParadas}
          initialData={
            selectedParada
              ? {
                  id: selectedParada.id,
                  loteEtapa: String(selectedParada.lote_etapa ?? ''),
                  tipo: selectedParada.tipo ?? 'PLANIFICADA',
                  categoria: selectedParada.categoria ?? 'FALLA_EQUIPO',
                  descripcion: selectedParada.descripcion ?? '',
                  fechaInicio: selectedParada.fecha_inicio
                    ? toLocalDateTimeInput(selectedParada.fecha_inicio)
                    : toLocalDateTimeInput(new Date().toISOString()),
                  solucion: selectedParada.solucion ?? '',
                }
              : undefined
          }
        />
      </div>
    </ProtectedRoute>
  )
}
