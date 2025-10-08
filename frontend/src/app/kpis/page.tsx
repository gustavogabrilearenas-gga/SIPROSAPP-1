'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowLeft, Home, Loader2, AlertCircle, BarChart3, PieChart, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts'

interface DashboardStats {
  totalProduccion: number
  lotesActivos: number
  ordenesMantenimiento: number
  alertasPendientes: number
  eficienciaPromedio: number
  tiempoMedioReparacion: number
  oee: number
  disponibilidad: number
}

function KPIsContent() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lotesPorEstado, setLotesPorEstado] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Obtener estadísticas generales
      const statsData = await api.getDashboardStats()
      setStats(statsData)

      // Obtener lotes para calcular distribución por estado
      const lotesResponse = await api.getLotes({ page: 1 })
      
      // Contar lotes por estado
      const estadosCount: Record<string, number> = {}
      lotesResponse.results.forEach((lote) => {
        estadosCount[lote.estado] = (estadosCount[lote.estado] || 0) + 1
      })

      const lotesPorEstadoData = Object.entries(estadosCount).map(([estado, cantidad]) => ({
        estado: estado.replace('_', ' '),
        cantidad,
      }))

      setLotesPorEstado(lotesPorEstadoData)
    } catch (err: any) {
      const message = err?.message || 'No se pudieron cargar los datos de KPIs'
      toast({
        title: 'Error al cargar KPIs',
        description: message,
        variant: 'destructive',
      })
      setError('Error al cargar los datos de KPIs')
    } finally {
      setIsLoading(false)
    }
  }

  // Datos de ejemplo para tendencias (6 meses)
  // TODO: Estos datos deberían venir del backend cuando se implemente el endpoint de históricos
  const kpiTendencias = [
    { mes: 'May', oee: 75, disponibilidad: 92, eficiencia: 85 },
    { mes: 'Jun', oee: 78, disponibilidad: 94, eficiencia: 86 },
    { mes: 'Jul', oee: 82, disponibilidad: 95, eficiencia: 88 },
    { mes: 'Ago', oee: 80, disponibilidad: 93, eficiencia: 87 },
    { mes: 'Sep', oee: 85, disponibilidad: 96, eficiencia: 90 },
    { mes: 'Oct', oee: stats?.oee || 78, disponibilidad: stats?.disponibilidad || 94, eficiencia: stats?.eficienciaPromedio || 88 },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando KPIs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">KPIs y Métricas</h1>
                  <p className="text-sm text-gray-600">Indicadores clave de desempeño</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">OEE Global</h3>
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats?.oee.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    +5.2%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.oee}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Disponibilidad</h3>
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats?.disponibilidad.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    +2.1%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.disponibilidad}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Eficiencia</h3>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats?.eficienciaPromedio.toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium text-purple-600">
                    +3.8%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats?.eficienciaPromedio}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">MTTR (Tiempo Medio de Reparación)</h3>
                  <PieChart className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {stats?.tiempoMedioReparacion.toFixed(1)}h
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    -0.5h
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Objetivo: {'<'} 3h
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Tendencias */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Tendencia de KPIs (6 meses)</CardTitle>
                <CardDescription>
                  Evolución de los principales indicadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiTendencias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="oee" fill="#22c55e" name="OEE %" />
                    <Bar dataKey="disponibilidad" fill="#3b82f6" name="Disponibilidad %" />
                    <Bar dataKey="eficiencia" fill="#a855f7" name="Eficiencia %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Distribución de Lotes por Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Lotes por Estado</CardTitle>
                <CardDescription>
                  Distribución actual de lotes de producción
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lotesPorEstado.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={lotesPorEstado}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ estado, cantidad, percent }) => 
                          `${estado}: ${cantidad} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {lotesPorEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay datos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Estadísticas Adicionales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Resumen de Operaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Lotes</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.totalProduccion}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Lotes Activos</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.lotesActivos}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Órdenes Mantenimiento</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.ordenesMantenimiento}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Incidentes Activos</p>
                  <p className="text-3xl font-bold text-red-600">{stats?.alertasPendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Nota */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> Los datos de tendencias históricas son simulados. 
                Se implementará un endpoint dedicado para obtener datos históricos reales del sistema.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default function KPIsPage() {
  return (
    <ProtectedRoute>
      <KPIsContent />
    </ProtectedRoute>
  )
}
