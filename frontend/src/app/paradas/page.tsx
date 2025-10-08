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
import {
  Clock,
  Plus,
  Search,
  Edit,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Parada {
  id: number
  lote_etapa_codigo: string
  lote_codigo: string
  tipo: string
  categoria: string
  fecha_inicio: string
  fecha_fin: string | null
  duracion_minutos: number | null
  descripcion: string
  solucion: string
  registrado_por_nombre: string
  estado: string
}

export default function ParadasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [paradas, setParadas] = useState<Parada[]>([])
  const [loading, setLoading] = useState(true)
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
      const response = await api.get('/paradas/')
      setParadas(response.results || response)
    } catch (error) {
      console.error('Error fetching paradas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredParadas = paradas.filter(p => {
    const matchesSearch = p.lote_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
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

  const formatDuration = (minutos: number | null) => {
    if (!minutos) return 'En curso'
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return `${horas}h ${mins}min`
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

          {/* Paradas List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParadas.map((parada, index) => {
                const EstadoIcon = getEstadoIcon(parada.fecha_fin)
                const isEnCurso = !parada.fecha_fin

                return (
                  <motion.div
                    key={parada.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className={`hover:shadow-xl transition-shadow duration-300 ${
                      isEnCurso ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{parada.lote_codigo}</h3>
                              <Badge className={getTipoColor(parada.tipo)}>
                                {parada.tipo}
                              </Badge>
                              <Badge className={getCategoriaColor(parada.categoria)}>
                                {parada.categoria.replace('_', ' ')}
                              </Badge>
                              <Badge className={getEstadoColor(parada.fecha_fin)}>
                                <EstadoIcon className="w-3 h-3 mr-1" />
                                {isEnCurso ? 'En Curso' : 'Finalizada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Etapa: {parada.lote_etapa_codigo}
                            </p>
                            <p className="text-gray-800">{parada.descripcion}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{new Date(parada.fecha_inicio).toLocaleString()}</p>
                            <p>Por: {parada.registrado_por_nombre}</p>
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
                              onClick={() => {/* TODO: Finalizar parada */}}
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
          )}

          {!loading && filteredParadas.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron paradas</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
