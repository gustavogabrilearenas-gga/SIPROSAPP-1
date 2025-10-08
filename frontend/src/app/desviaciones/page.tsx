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
  AlertTriangle,
  Plus,
  Search,
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface Desviacion {
  id: number
  codigo: string
  titulo: string
  descripcion: string
  severidad: string
  estado: string
  fecha_deteccion: string
  detectado_por_nombre: string
  lote_codigo: string
  area_responsable: string
  requiere_capa: boolean
  fecha_cierre: string | null
  impacto_calidad: string
  impacto_seguridad: string
  causa_raiz: string
}

export default function DesviacionesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [desviaciones, setDesviaciones] = useState<Desviacion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('TODAS')

  useEffect(() => {
    fetchDesviaciones()
  }, [])

  const fetchDesviaciones = async () => {
    try {
      setLoading(true)
      const response = await api.get('/desviaciones/')
      setDesviaciones(response.results || response)
    } catch (error: any) {
      toast({
        title: 'Error al cargar desviaciones',
        description: error?.message || 'No se pudo obtener la información de desviaciones',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeveridadColor = (severidad: string) => {
    const colors: Record<string, string> = {
      CRITICA: 'bg-red-600 text-white',
      MAYOR: 'bg-orange-500 text-white',
      MENOR: 'bg-yellow-500 text-white',
    }
    return colors[severidad] || 'bg-gray-500 text-white'
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      ABIERTA: 'bg-red-100 text-red-800',
      EN_INVESTIGACION: 'bg-yellow-100 text-yellow-800',
      EN_CAPA: 'bg-blue-100 text-blue-800',
      CERRADA: 'bg-green-100 text-green-800',
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const filteredDesviaciones = desviaciones.filter(d => {
    const matchesSearch = d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterEstado === 'TODAS' || d.estado === filterEstado
    return matchesSearch && matchesFilter
  })

  const estadoOptions = ['TODAS', 'ABIERTA', 'EN_INVESTIGACION', 'EN_CAPA', 'CERRADA']

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
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                    Gestión de Desviaciones (CAPA)
                  </h1>
                  <p className="text-gray-600">Sistema de Acciones Correctivas y Preventivas</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {/* TODO: Open create modal */}}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Desviación
                </Button>
              )}
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
                placeholder="Buscar por código, título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {estadoOptions.map(estado => (
                <Button
                  key={estado}
                  variant={filterEstado === estado ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterEstado(estado)}
                >
                  {estado.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Deviations List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDesviaciones.map((desv, index) => (
                <motion.div
                  key={desv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                        onClick={() => {/* TODO: Open detail modal */}}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl font-bold">
                              {desv.codigo}
                            </CardTitle>
                            <Badge className={getSeveridadColor(desv.severidad)}>
                              {desv.severidad}
                            </Badge>
                            <Badge className={getEstadoColor(desv.estado)}>
                              {desv.estado.replace('_', ' ')}
                            </Badge>
                            {desv.requiere_capa && (
                              <Badge className="bg-purple-100 text-purple-800">
                                Requiere CAPA
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {desv.titulo}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {desv.descripcion}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Detectado por</p>
                          <p className="font-medium">{desv.detectado_por_nombre}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Fecha Detección</p>
                          <p className="font-medium">
                            {new Date(desv.fecha_deteccion).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Lote Afectado</p>
                          <p className="font-medium">{desv.lote_codigo || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Área Responsable</p>
                          <p className="font-medium">{desv.area_responsable || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Impact Indicators */}
                      {(desv.impacto_calidad || desv.impacto_seguridad) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex gap-4">
                            {desv.impacto_calidad && (
                              <div className="flex-1 bg-red-50 p-3 rounded">
                                <p className="text-xs font-medium text-red-700 mb-1">Impacto en Calidad</p>
                                <p className="text-xs text-red-600">{desv.impacto_calidad}</p>
                              </div>
                            )}
                            {desv.impacto_seguridad && (
                              <div className="flex-1 bg-orange-50 p-3 rounded">
                                <p className="text-xs font-medium text-orange-700 mb-1">Impacto en Seguridad</p>
                                <p className="text-xs text-orange-600">{desv.impacto_seguridad}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Root Cause */}
                      {desv.causa_raiz && (
                        <div className="mt-4 bg-blue-50 p-3 rounded">
                          <p className="text-xs font-medium text-blue-700 mb-1">Causa Raíz</p>
                          <p className="text-sm text-blue-900">{desv.causa_raiz}</p>
                        </div>
                      )}

                      {/* Closure Info */}
                      {desv.fecha_cierre && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Cerrada el {new Date(desv.fecha_cierre).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredDesviaciones.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No se encontraron desviaciones</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

