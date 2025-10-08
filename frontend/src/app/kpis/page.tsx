'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Home, BarChart3, PieChart, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import { api, handleApiError } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { DashboardStats, OeeMetrics } from '@/types/models'
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
import DataState from '@/components/common/data-state'

function KPIsContent() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [oeeMetrics, setOeeMetrics] = useState<OeeMetrics | null>(null)
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
      const [statsResult, oeeResult, lotesResult] = await Promise.allSettled([
        api.getDashboardStats(),
        api.getOEE(),
        api.getLotes({ page: 1 })
      ])

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
      } else {
        setStats(null)
      }

      if (oeeResult.status === 'fulfilled') {
        setOeeMetrics(oeeResult.value)
      } else {
        setOeeMetrics(null)
      }

      const mainFailureReasons: unknown[] = []
      if (statsResult.status === 'rejected') {
        mainFailureReasons.push(statsResult.reason)
      }
      if (oeeResult.status === 'rejected') {
        mainFailureReasons.push(oeeResult.reason)
      }

      if (mainFailureReasons.length > 0) {
        const { message } = handleApiError(mainFailureReasons[0])
        toast({
          title: 'Error al cargar métricas',
          description: message,
          variant: 'destructive'
        })
        setError(message ?? 'No se pudieron cargar los datos de KPIs')
      } else {
        setError(null)
      }

      if (lotesResult.status === 'fulfilled') {
        const estadosCount: Record<string, number> = {}
        lotesResult.value.results.forEach((lote: { estado: string }) => {
          estadosCount[lote.estado] = (estadosCount[lote.estado] || 0) + 1
        })

        const lotesPorEstadoData = Object.entries(estadosCount).map(([estado, cantidad]) => ({
          estado: estado.replace('_', ' '),
          cantidad,
        }))

        setLotesPorEstado(lotesPorEstadoData)
      } else if (lotesResult.status === 'rejected') {
        setLotesPorEstado([])
        const { message } = handleApiError(lotesResult.reason)
        toast({
          title: 'Error al cargar lotes',
          description: message,
          variant: 'destructive'
        })
      }
    } catch (err) {
      const { message } = handleApiError(err)
      toast({
        title: 'Error al cargar métricas',
        description: message,
        variant: 'destructive'
      })
      setError(message ?? 'No se pudieron cargar los datos de KPIs')
      setStats(null)
      setOeeMetrics(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Datos de ejemplo para tendencias (6 meses)
  // TODO: Estos datos deberían venir del backend cuando se implemente el endpoint de históricos
  const totalLotes = stats?.lotes.total ?? 0
  const lotesActivos = stats?.lotes.activos ?? 0
  const lotesHoy = stats?.lotes.hoy ?? 0
  const ordenesAbiertas = stats?.ordenes_trabajo.abiertas ?? 0
  const ordenesUrgentes = stats?.ordenes_trabajo.urgentes ?? 0
  const incidentesCriticos = stats?.incidentes.criticos ?? 0

  const oeeValue = oeeMetrics?.oee ?? stats?.oee_7_dias?.oee ?? 0
  const disponibilidad = oeeMetrics?.disponibilidad ?? stats?.oee_7_dias?.disponibilidad ?? 0
  const rendimiento = oeeMetrics?.rendimiento ?? stats?.oee_7_dias?.rendimiento ?? 0
  const calidad = oeeMetrics?.calidad ?? stats?.oee_7_dias?.calidad ?? 0
  const tiempoParadasHoras = oeeMetrics?.metricas?.tiempo_paradas_horas ?? 0

  const periodLabel = stats?.fecha
    ? new Date(stats.fecha).toLocaleString('es-AR', { month: 'short' })
    : 'Actual'

  const hasKpiData = Boolean(stats || oeeMetrics)
  const isEmptyState = !isLoading && !error && !hasKpiData && lotesPorEstado.length === 0

  const kpiTendencias = [
    { mes: 'May', oee: 75, disponibilidad: 92, eficiencia: 85 },
    { mes: 'Jun', oee: 78, disponibilidad: 94, eficiencia: 86 },
    { mes: 'Jul', oee: 82, disponibilidad: 95, eficiencia: 88 },
    { mes: 'Ago', oee: 80, disponibilidad: 93, eficiencia: 87 },
    { mes: 'Sep', oee: 85, disponibilidad: 96, eficiencia: 90 },
    { mes: periodLabel, oee: Number(oeeValue.toFixed(1)), disponibilidad: Number(disponibilidad.toFixed(1)), eficiencia: Number(rendimiento.toFixed(1)) },
  ]

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const clampPercentage = (value: number) => Math.max(0, Math.min(value, 100))
  const formatNumber = (value: number) => value.toLocaleString('es-AR')

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
        <DataState loading={isLoading} error={error} empty={isEmptyState}>
          <>
            {error && (
              <div className="mb-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={fetchData}>
                  Reintentar
                </Button>
              </div>
            )}

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 rounded-2xl border border-white/60 bg-white/70 shadow-inner animate-pulse"
                  />
                ))
              ) : (
                <>
              <motion.div
                key="oee-card"
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
                        {oeeValue.toFixed(1)}%
                      </span>
                      <span className="text-xs font-medium text-green-600">
                        Últimos 7 días
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${clampPercentage(oeeValue)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Calidad promedio: {calidad.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                key="availability-card"
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
                        {disponibilidad.toFixed(1)}%
                      </span>
                      <span className="text-xs font-medium text-blue-600">
                        Meta &gt; 90%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${clampPercentage(disponibilidad)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Operativas: {formatNumber(lotesActivos)} líneas
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                key="performance-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Rendimiento</h3>
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-gray-900">
                        {rendimiento.toFixed(1)}%
                      </span>
                      <span className="text-xs font-medium text-purple-600">
                        Variación semanal
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${clampPercentage(rendimiento)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Lotes completados hoy: {formatNumber(lotesHoy)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                key="downtime-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Tiempo de Paradas</h3>
                      <PieChart className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-bold text-gray-900">
                        {tiempoParadasHoras.toFixed(1)}h
                      </span>
                      <span className="text-xs font-medium text-amber-600">
                        Últimas 24h
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Órdenes urgentes: {formatNumber(ordenesUrgentes)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
                </>
              )}
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
                {isLoading ? (
                  <div className="h-[300px] rounded-xl bg-slate-100 animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={kpiTendencias}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="oee" fill="#22c55e" name="OEE %" />
                      <Bar dataKey="disponibilidad" fill="#3b82f6" name="Disponibilidad %" />
                      <Bar dataKey="eficiencia" fill="#a855f7" name="Rendimiento %" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                {isLoading ? (
                  <div className="h-[300px] rounded-xl bg-slate-100 animate-pulse" />
                ) : lotesPorEstado.length > 0 ? (
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
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Lotes</p>
                    <p className="text-3xl font-bold text-blue-600">{formatNumber(totalLotes)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Lotes Activos</p>
                    <p className="text-3xl font-bold text-green-600">{formatNumber(lotesActivos)}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Órdenes Abiertas</p>
                    <p className="text-3xl font-bold text-orange-600">{formatNumber(ordenesAbiertas)}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Incidentes Críticos</p>
                    <p className="text-3xl font-bold text-red-600">{formatNumber(incidentesCriticos)}</p>
                  </div>
                </div>
              )}
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
          </>
        </DataState>
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
