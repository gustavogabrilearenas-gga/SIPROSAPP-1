'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Plus,
  Search,
  Edit,
  Wrench,
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import MaquinaFormModal from '@/components/maquina-form-modal'

interface Maquina {
  id: number
  codigo: string
  nombre: string
  tipo: string
  fabricante: string
  modelo: string
  ubicacion_nombre: string
  descripcion: string
  capacidad_nominal: string
  unidad_capacidad: string
  activa: boolean
  requiere_calificacion: boolean
}

export default function MaquinasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedMaquinaId, setSelectedMaquinaId] = useState<number | null>(null)

  useEffect(() => {
    fetchMaquinas()
  }, [])

  const fetchMaquinas = async () => {
    try {
      setLoading(true)
      const response = await api.get('/maquinas/')
      setMaquinas(response.results || response)
    } catch (error) {
      console.error('Error fetching maquinas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaquinas = maquinas.filter(m =>
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      COMPRESION: 'bg-blue-100 text-blue-800',
      MEZCLADO: 'bg-green-100 text-green-800',
      GRANULACION: 'bg-purple-100 text-purple-800',
      EMBLISTADO: 'bg-yellow-100 text-yellow-800',
      SERVICIOS: 'bg-gray-100 text-gray-800',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-800'
  }

  // Mock status for demonstration
  const getEstadoMaquina = (maquina: Maquina) => {
    const estados = [
      { label: 'Operativa', color: 'bg-green-500', icon: CheckCircle },
      { label: 'Mantenimiento', color: 'bg-yellow-500', icon: Wrench },
      { label: 'Fuera de Servicio', color: 'bg-red-500', icon: XCircle },
    ]
    return estados[Math.floor(Math.random() * estados.length)]
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
                    <Settings className="w-8 h-8 text-blue-600" />
                    Máquinas y Equipos
                  </h1>
                  <p className="text-gray-600">Gestión y monitoreo de equipamiento</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedMaquinaId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Máquina
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                placeholder="Buscar por código, nombre o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Machines Grid */}
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
              {filteredMaquinas.map((maquina, index) => {
                const estado = getEstadoMaquina(maquina)
                const EstadoIcon = estado.icon

                return (
                  <motion.div
                    key={maquina.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="hover:shadow-xl transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${estado.color} animate-pulse`}></div>
                              <span className="text-xs font-medium text-gray-600">{estado.label}</span>
                            </div>
                            <CardTitle className="text-lg font-bold mb-1">
                              {maquina.codigo}
                            </CardTitle>
                            <CardDescription className="font-medium text-gray-900">
                              {maquina.nombre}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Badge className={getTipoColor(maquina.tipo)}>
                              {maquina.tipo}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Fabricante</p>
                              <p className="font-medium">{maquina.fabricante || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Modelo</p>
                              <p className="font-medium">{maquina.modelo || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Ubicación</p>
                              <p className="font-medium">{maquina.ubicacion_nombre || 'N/A'}</p>
                            </div>
                            {maquina.capacidad_nominal && (
                              <div>
                                <p className="text-gray-500 text-xs">Capacidad</p>
                                <p className="font-medium">{maquina.capacidad_nominal} {maquina.unidad_capacidad}</p>
                              </div>
                            )}
                          </div>
                          {maquina.requiere_calificacion && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Requiere Calificación
                            </Badge>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/mantenimiento?maquina=${maquina.id}`)}
                            >
                              <Wrench className="w-4 h-4 mr-1" />
                              Mantenimiento
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMaquinaId(maquina.id)
                                setIsFormOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {!loading && filteredMaquinas.length === 0 && (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron máquinas</p>
            </div>
          )}
        </main>

        {/* Modals */}
        <MaquinaFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedMaquinaId(null)
          }}
          maquinaId={selectedMaquinaId}
          onSuccess={() => {
            fetchMaquinas()
          }}
        />
      </div>
    </ProtectedRoute>
  )
}

