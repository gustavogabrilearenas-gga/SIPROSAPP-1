'use client'

import { useState, useEffect, useTransition } from 'react'
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
  Shield,
  Plus,
  Search,
  Edit,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface ControlCalidad {
  id: number
  lote_etapa_codigo: string
  lote_codigo: string
  tipo_control: string
  valor_medido: number
  unidad: string
  valor_minimo: number
  valor_maximo: number
  conforme: boolean
  fecha_control: string
  controlado_por_nombre: string
  observaciones: string
}

type DataState = 'loading' | 'error' | 'empty' | 'ready'

export default function ControlCalidadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [controles, setControles] = useState<ControlCalidad[]>([])
  const [dataState, setDataState] = useState<DataState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterConforme, setFilterConforme] = useState<string>('TODOS')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedControlId, setSelectedControlId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchControles()
  }, [])

  const fetchControles = async () => {
    setDataState('loading')
    setErrorMessage(null)
    try {
      const response = await api.getControlesCalidad()
      const items = Array.isArray(response) ? response : response?.results ?? []
      startTransition(() => {
        setControles(items)
        setDataState(items.length === 0 ? 'empty' : 'ready')
      })
      toast({
        title: 'Controles actualizados',
        description: 'Se actualizaron los registros de control de calidad.',
      })
    } catch (error) {
      const { message } = handleApiError(error)
      startTransition(() => {
        setDataState('error')
        setErrorMessage(message || 'No se pudieron obtener los controles de calidad')
      })
      toast({
        title: 'Error al cargar controles',
        description: message || 'No se pudieron obtener los controles de calidad',
        variant: 'destructive',
      })
    }
  }

  const filteredControles = controles.filter(c => {
    const matchesSearch = c.tipo_control.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.lote_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.controlado_por_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterConforme === 'TODOS' ||
                         (filterConforme === 'CONFORME' && c.conforme) ||
                         (filterConforme === 'NO_CONFORME' && !c.conforme)
    return matchesSearch && matchesFilter
  })

  const isBusy = dataState === 'loading' || isPending

  const getConformeColor = (conforme: boolean) => {
    return conforme ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getConformeIcon = (conforme: boolean) => {
    return conforme ? CheckCircle : XCircle
  }

  const getValorStatus = (valor: number, min: number, max: number) => {
    if (valor < min) return { status: 'BAJO', color: 'text-red-600', icon: AlertTriangle }
    if (valor > max) return { status: 'ALTO', color: 'text-orange-600', icon: AlertTriangle }
    return { status: 'OK', color: 'text-green-600', icon: CheckCircle }
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
                    <Shield className="w-8 h-8 text-green-600" />
                    Control de Calidad
                  </h1>
                  <p className="text-gray-600">Gestión de controles y ensayos de calidad</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSelectedControlId(null)
                  setIsFormOpen(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Control
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
                placeholder="Buscar por tipo de control, lote o controlado por..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {['TODOS', 'CONFORME', 'NO_CONFORME'].map(filter => (
                <Button
                  key={filter}
                  variant={filterConforme === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    startTransition(() => {
                      setFilterConforme(filter)
                    })
                  }
                  disabled={isBusy}
                >
                  {filter.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Controls List */}
          {dataState === 'loading' ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
              />
            </div>
          ) : dataState === 'error' ? (
            <div className="text-center py-12 space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-600">{errorMessage}</p>
              <Button onClick={fetchControles} disabled={isBusy}>
                Reintentar
              </Button>
            </div>
          ) : dataState === 'empty' ? (
            <div className="text-center py-12 space-y-3">
              <Shield className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="text-gray-600">Sin registros disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredControles.map((control, index) => {
                const ConformeIcon = getConformeIcon(control.conforme)
                const valorStatus = getValorStatus(control.valor_medido, control.valor_minimo, control.valor_maximo)
                const StatusIcon = valorStatus.icon

                return (
                  <motion.div
                    key={control.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className={`hover:shadow-xl transition-shadow duration-300 ${
                      control.conforme ? 'border-green-200' : 'border-red-200'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{control.tipo_control}</h3>
                              <Badge className={getConformeColor(control.conforme)}>
                                <ConformeIcon className="w-3 h-3 mr-1" />
                                {control.conforme ? 'CONFORME' : 'NO CONFORME'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Lote: {control.lote_codigo} | Etapa: {control.lote_etapa_codigo}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{new Date(control.fecha_control).toLocaleString()}</p>
                            <p>Por: {control.controlado_por_nombre}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Valor Medido</p>
                            <div className="flex items-center justify-center gap-1">
                              <StatusIcon className={`w-4 h-4 ${valorStatus.color}`} />
                              <p className={`text-lg font-bold ${valorStatus.color}`}>
                                {control.valor_medido} {control.unidad}
                              </p>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Mínimo</p>
                            <p className="text-lg font-medium">{control.valor_minimo} {control.unidad}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Máximo</p>
                            <p className="text-lg font-medium">{control.valor_maximo} {control.unidad}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Estado</p>
                            <Badge className={valorStatus.color.replace('text-', 'bg-').replace('-600', '-100')}>
                              {valorStatus.status}
                            </Badge>
                          </div>
                        </div>

                        {control.observaciones && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="text-gray-600">{control.observaciones}</p>
                          </div>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedControlId(control.id)
                              setIsFormOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {dataState === 'ready' && filteredControles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No se encontraron controles de calidad con los filtros aplicados
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
