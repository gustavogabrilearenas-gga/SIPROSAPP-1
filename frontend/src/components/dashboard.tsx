'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  LineChart as LineChartIcon,
  Package,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wrench
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import NotificationCenter from '@/components/notification-center'
import GlobalSearch from '@/components/global-search'
import DataState from '@/components/common/data-state'
import { api, KpiDashboard, KpiHistorialPoint, KpiOEE } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'

const toPercent = (value: number | null | undefined): number => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 0
  }

  const ratio = value > 1 ? value : value * 100
  return Number(ratio.toFixed(1))
}

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0'
  }

  return value.toLocaleString('es-AR')
}

export function Dashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [data, setData] = useState<KpiDashboard | null>(null)
  const [oee, setOee] = useState<KpiOEE | null>(null)
  const [historial, setHistorial] = useState<KpiHistorialPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchMetrics = async (background = false) => {
      if (!background) {
        setLoading(true)
      }
      try {
        const [resumen, oeeData, historialData] = await Promise.all([
          api.getDashboardResumen(),
          api.getOEE(),
          api.getHistorialProduccion()
        ])

        if (!isMounted) {
          return
        }

        setData(resumen)
        setOee(oeeData)
        setHistorial(historialData.historial)
        setError(null)
        setLastUpdated(new Date())
      } catch (err) {
        if (!isMounted) {
          return
        }

        const message = (err as { message?: string })?.message ?? 'No se pudieron cargar las métricas'
        setError(message)
        setData(null)
        setOee(null)
        setHistorial([])
        showError('Error al cargar métricas', message)
      } finally {
        if (isMounted && !background) {
          setLoading(false)
        }
      }
    }

    fetchMetrics(false)
    const interval = setInterval(() => fetchMetrics(true), 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const productionChartData = useMemo(() => {
    return historial.map((item) => {
      const date = new Date(item.fecha)
      const label = date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' })
      return {
        label,
        produccion: item.unidades_producidas,
        rechazos: item.unidades_rechazadas
      }
    })
  }, [historial])

  const resumenCards = useMemo(() => {
    if (!data) {
      return []
    }

    return [
      {
        title: 'Producción diaria',
        subtitle: 'Lotes finalizados hoy',
        value: data.produccion_diaria,
        icon: Package,
        gradient: 'from-blue-500 to-indigo-600'
      },
      {
        title: 'Producción semanal',
        subtitle: 'Acumulado últimos 7 días',
        value: data.produccion_semanal,
        icon: Clock,
        gradient: 'from-sky-500 to-cyan-600'
      },
      {
        title: 'Rendimiento promedio',
        subtitle: 'Sobre el plan semanal',
        value: `${toPercent(data.rendimiento_promedio)}%`,
        icon: TrendingUp,
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        title: 'Alertas de calidad',
        subtitle: 'Desviaciones críticas y controles no conformes',
        value: formatNumber(
          data.calidad_desviaciones_abiertas + data.calidad_controles_no_conformes
        ),
        icon: AlertTriangle,
        gradient: 'from-rose-500 to-pink-600'
      }
    ]
  }, [data])

  const soporteCards = useMemo(() => {
    if (!data) {
      return []
    }

    return [
      {
        title: 'Insumos por vencer',
        value: data.inventario_por_vencer,
        description: 'Lotes de insumos a vencer en 30 días',
        icon: PieChart,
        accent: 'text-purple-600'
      },
      {
        title: 'Stock crítico',
        value: data.inventario_stock_bajo,
        description: 'Insumos por debajo del punto de reposición',
        icon: Package,
        accent: 'text-amber-600'
      },
      {
        title: 'Órdenes en seguimiento',
        value: data.mantenimiento_abiertas + data.mantenimiento_en_pausa,
        description: 'Mantenimiento abierto o en pausa',
        icon: Wrench,
        accent: 'text-blue-600'
      },
      {
        title: 'Órdenes completadas',
        value: data.mantenimiento_completadas_semana,
        description: 'Completadas en la última semana',
        icon: Target,
        accent: 'text-emerald-600'
      }
    ]
  }, [data])

  const emptyState = !data && productionChartData.length === 0 && !oee
  const updatedAtLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SIPROSA MES
              </h1>
              <p className="text-gray-600 font-medium">Centro de Control de Manufactura Farmacéutica</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <GlobalSearch />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-4"
            >
              <NotificationCenter />

              {user && (
                <button
                  onClick={() => router.push('/perfil')}
                  className="text-right border-r border-gray-300 pr-4 hover:opacity-70 transition-opacity"
                >
                  <p className="text-sm text-gray-500">Usuario</p>
                  <p className="font-semibold text-gray-900">{user.full_name || user.username}</p>
                  <p className="text-xs text-blue-600">Mi Perfil →</p>
                </button>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Última actualización</p>
                <p className="font-mono text-sm font-semibold text-blue-600">{updatedAtLabel}</p>
              </div>
              <Badge
                className={
                  error
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : loading
                      ? 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
                      : 'bg-green-100 text-green-800 border-green-200'
                }
              >
                <Activity className="w-3 h-3 mr-1" />
                {error ? 'Sin datos' : loading ? 'Sincronizando' : 'Datos en línea'}
              </Badge>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  onClick={() => router.push('/configuracion/usuarios')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Usuarios
                </Button>
              )}
              <Button
                variant="outline"
                className="bg-white/50 backdrop-blur-sm"
                onClick={() => router.push('/configuracion')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataState loading={loading} error={error} empty={emptyState}>
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="uppercase text-xs tracking-wide text-blue-100">Panel ejecutivo</p>
                    <h2 className="text-3xl font-bold mb-2">Visión general de la operación</h2>
                    <p className="text-blue-100 text-lg max-w-xl">
                      Datos consolidados de producción, mantenimiento e indicadores de calidad para la última semana de trabajo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-white/10 p-4">
                      <p className="text-sm text-blue-100">Tiempo real</p>
                      <p className="text-2xl font-semibold">{currentTime.toLocaleTimeString('es-AR')}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <p className="text-sm text-blue-100">Lotes hoy</p>
                      <p className="text-2xl font-semibold">{formatNumber(data?.produccion_diaria)}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <p className="text-sm text-blue-100">OEE actual</p>
                      <p className="text-2xl font-semibold">{oee ? `${toPercent(oee.oee)}%` : '--'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {resumenCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {resumenCards.map((kpi) => (
                  <Card key={kpi.title} className="relative overflow-hidden border-0 shadow-lg">
                    <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-10`} />
                    <CardHeader className="relative z-10 pb-1">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                        <span>{kpi.title}</span>
                        <kpi.icon className="h-5 w-5 text-gray-500" />
                      </CardTitle>
                      <CardDescription>{kpi.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <p className="text-3xl font-bold text-gray-900">{typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:col-span-2"
              >
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Historial de producción (7 días)</span>
                    </CardTitle>
                    <CardDescription>Unidades producidas y rechazos diarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={productionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="produccion" fill="#2563eb" name="Unidades producidas" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="rechazos" fill="#ef4444" name="Unidades rechazadas" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="shadow-lg border-0 h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LineChartIcon className="h-5 w-5 text-emerald-600" />
                      <span>Indicadores OEE</span>
                    </CardTitle>
                    <CardDescription>Disponibilidad, rendimiento y calidad actuales</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {oee ? (
                      [
                        { label: 'OEE', value: toPercent(oee.oee), accent: 'bg-emerald-500' },
                        { label: 'Disponibilidad', value: toPercent(oee.disponibilidad), accent: 'bg-blue-500' },
                        { label: 'Rendimiento', value: toPercent(oee.rendimiento), accent: 'bg-purple-500' },
                        { label: 'Calidad', value: toPercent(oee.calidad), accent: 'bg-amber-500' }
                      ].map((metric) => (
                        <div key={metric.label}>
                          <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                            <span>{metric.label}</span>
                            <span>{metric.value}%</span>
                          </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${metric.accent}`}
                              style={{ width: `${Math.min(100, metric.value)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex min-h-[160px] items-center justify-center text-sm text-gray-500">
                        No hay métricas de OEE disponibles
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {soporteCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {soporteCards.map((item) => (
                  <Card key={item.title} className="border border-gray-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base text-gray-700">
                        {item.title}
                        <item.icon className={`h-5 w-5 ${item.accent}`} />
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-gray-900">{formatNumber(item.value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-900">
                    <Activity className="h-5 w-5" />
                    <span>Resumen operativo</span>
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Indicadores clave provenientes del backend operacional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700">
                    <div className="rounded-lg border border-green-200 bg-white/60 p-4">
                      <p className="font-semibold text-green-800">Producción semanal</p>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(data?.produccion_semanal)}</p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-white/60 p-4">
                      <p className="font-semibold text-green-800">Órdenes abiertas</p>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(data?.mantenimiento_abiertas)}</p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-white/60 p-4">
                      <p className="font-semibold text-green-800">Órdenes en pausa</p>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(data?.mantenimiento_en_pausa)}</p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-white/60 p-4">
                      <p className="font-semibold text-green-800">Controles no conformes</p>
                      <p className="text-2xl font-bold text-green-900">{formatNumber(data?.calidad_controles_no_conformes)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </DataState>
      </main>
    </div>
  )
}

export default Dashboard
