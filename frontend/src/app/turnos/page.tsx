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
  Sun,
  Moon,
  Sunset,
  Package,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Turno {
  id: number
  codigo: string
  nombre: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
  lotes_count: number
}

export default function TurnosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTurnoId, setSelectedTurnoId] = useState<number | null>(null)

  useEffect(() => {
    fetchTurnos()
  }, [])

  const fetchTurnos = async () => {
    try {
      setLoading(true)
      const response = await api.get('/turnos/')
      setTurnos(response.results || response)
    } catch (error: any) {
      toast({
        title: 'Error al cargar turnos',
        description: error?.message || 'No se pudieron obtener los turnos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTurnos = turnos.filter(t =>
    t.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTurnoIcon = (codigo: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      M: Sun,
      T: Sunset,
      N: Moon,
    }
    return icons[codigo] ?? Clock
  }

  const getTurnoColor = (codigo: string) => {
    const colors: Record<string, string> = {
      'M': 'bg-yellow-100 text-yellow-800',
      'T': 'bg-orange-100 text-orange-800',
      'N': 'bg-blue-100 text-blue-800',
    }
    return colors[codigo] || 'bg-gray-100 text-gray-800'
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrentTurno = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    return turnos.find(turno => {
      const startTime = new Date(`2000-01-01T${turno.hora_inicio}`).getHours() * 60 + 
                       new Date(`2000-01-01T${turno.hora_inicio}`).getMinutes()
      const endTime = new Date(`2000-01-01T${turno.hora_fin}`).getHours() * 60 + 
                     new Date(`2000-01-01T${turno.hora_fin}`).getMinutes()
      
      if (startTime <= endTime) {
        return currentTime >= startTime && currentTime < endTime
      } else {
        // Turno nocturno que cruza medianoche
        return currentTime >= startTime || currentTime < endTime
      }
    })
  }

  const currentTurno = getCurrentTurno()

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
                    <Clock className="w-8 h-8 text-blue-600" />
                    Gestión de Turnos
                  </h1>
                  <p className="text-gray-600">Horarios de trabajo de la planta</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedTurnoId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Turno
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Current Turno */}
          {currentTurno && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-800">Turno Actual</h3>
                      <p className="text-green-600">
                        {currentTurno.nombre} ({formatTime(currentTurno.hora_inicio)} - {formatTime(currentTurno.hora_fin)})
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Turnos Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTurnos.map((turno, index) => {
                const TurnoIcon = getTurnoIcon(turno.codigo)
                const isCurrent = currentTurno?.id === turno.id

                return (
                  <motion.div
                    key={turno.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className={`hover:shadow-xl transition-shadow duration-300 ${
                      isCurrent ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TurnoIcon className="w-4 h-4 text-gray-500" />
                              <Badge className={getTurnoColor(turno.codigo)}>
                                {turno.codigo}
                              </Badge>
                              {isCurrent && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Actual
                                </Badge>
                              )}
                              {!turno.activo && (
                                <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg font-bold mb-1">
                              {turno.nombre}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Inicio</p>
                              <p className="font-bold text-blue-600">{formatTime(turno.hora_inicio)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Fin</p>
                              <p className="font-bold text-blue-600">{formatTime(turno.hora_fin)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500 text-xs">Lotes Asignados</p>
                              <p className="font-bold text-green-600">{turno.lotes_count}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/lotes?turno=${turno.id}`)}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Ver Lotes
                            </Button>
                            {(user?.is_superuser || user?.is_staff) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTurnoId(turno.id)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {!loading && filteredTurnos.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron turnos</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
