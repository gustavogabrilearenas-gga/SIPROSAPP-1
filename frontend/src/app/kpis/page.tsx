'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Home, BarChart3, LineChart, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/protected-route'
import DataState from '@/components/common/data-state'
import { api, KpiDashboard, KpiHistorialPoint, KpiOEE } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts'

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

function KPIsContent() {
  const router = useRouter()
  const [resumen, setResumen] = useState<KpiDashboard | null>(null)
  const [oee, setOee] = useState<KpiOEE | null>(null)
  const [historial, setHistorial] = useState<KpiHistorialPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const [resumenData, oeeData, historialData] = await Promise.all([
          api.getDashboardResumen(),
          api.getOEE(),
          api.getHistorialProduccion()
        ])

        if (!isMounted) {
          return
        }

        setResumen(resumenData)
        setOee(oeeData)
        setHistorial(historialData.historial)
        setError(null)
      } catch (err) {
        if (!isMounted) {
          return
        }

        const message = (err as { message?: string })?.message ?? 'No se pudieron cargar los datos de KPIs'
        setError(message)
        setResumen(null)
        setOee(null)
        setHistorial([])
        showError('Error al cargar métricas', message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const historialData = useMemo(() => {
    return historial.map((item) => {
      const date = new Date(item.fecha)
      const label = date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' })
      return {
        label,
        produccion: item.unidades_producidas,
        rechazadas: item.unidades_rechazadas,
        lotes: item.lotes_finalizados
      }
    })
  }, [historial])

  const resumenCards = useMemo(() => {
    if (!resumen) {
      return []
    }

    return [
      {
        title: 'Producción diaria',
        value: resumen.produccion_diaria,
        icon: BarChart3,
        description: 'Lotes finalizados hoy'
      },
      {
        title: 'Producción semanal',
        value: resumen.produccion_semanal,
        icon: LineChart,
        description: 'Últimos 7 días'
      },
      {
        title: 'Rendimiento promedio',
        value: `${toPercent(resumen.rendimiento_promedio)}%`,
        icon: TrendingUp,
        description: 'vs. planificado'
      },
      {
        title: 'Alertas de calidad',
        value: resumen.calidad_desviaciones_abiertas + resumen.calidad_controles_no_conformes,
        icon: PieChart,
        description: 'Desviaciones y controles no conformes'
      }
    ]
  }, [resumen])

  const oeeMetrics = useMemo(() => {
    if (!oee) {
      return []
    }

    return [
      { label: 'OEE', value: toPercent(oee.oee), color: '#10b981' },
      { label: 'Disponibilidad', value: toPercent(oee.disponibilidad), color: '#3b82f6' },
      { label: 'Rendimiento', value: toPercent(oee.rendimiento), color: '#8b5cf6' },
      { label: 'Calidad', value: toPercent(oee.calidad), color: '#f97316' }
    ]
  }, [oee])

  const emptyState = !resumen && historialData.length === 0 && !oee

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataState loading={loading} error={error} empty={emptyState}>
          <div className="space-y-8">
            {resumenCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resumenCards.map((card) => (
                  <Card key={card.title} className="shadow-sm border border-emerald-100">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base text-gray-700">
                        {card.title}
                        <card.icon className="h-5 w-5 text-emerald-600" />
                      </CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold text-gray-900">
                        {typeof card.value === 'number' ? formatNumber(card.value) : card.value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    <span>Historial de producción (7 días)</span>
                  </CardTitle>
                  <CardDescription>Unidades producidas, rechazadas y lotes finalizados por día</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={historialData}>
                      <defs>
                        <linearGradient id="produccion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rechazos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis dataKey="label" stroke="#059669" />
                      <YAxis stroke="#059669" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          border: '1px solid #d1fae5'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="produccion"
                        name="Unidades producidas"
                        stroke="#10b981"
                        fill="url(#produccion)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="rechazadas"
                        name="Unidades rechazadas"
                        stroke="#ef4444"
                        fill="url(#rechazos)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5 text-emerald-600" />
                    <span>Indicadores OEE</span>
                  </CardTitle>
                  <CardDescription>Detalle porcentual de disponibilidad, rendimiento y calidad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {oeeMetrics.length > 0 ? (
                    oeeMetrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                          <span>{metric.label}</span>
                          <span>{metric.value}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-emerald-100">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(metric.value, 100)}%`, backgroundColor: metric.color }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center text-sm text-gray-500">
                      No hay métricas de OEE disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {resumen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-emerald-100 bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-700">Insumos por vencer</CardTitle>
                    <CardDescription>Lotes a vencer en 30 días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(resumen.inventario_por_vencer)}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-100 bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-700">Stock crítico</CardTitle>
                    <CardDescription>Insumos bajo punto de reposición</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(resumen.inventario_stock_bajo)}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-100 bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-700">Órdenes abiertas</CardTitle>
                    <CardDescription>Mantenimiento activo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(resumen.mantenimiento_abiertas)}</p>
                  </CardContent>
                </Card>
                <Card className="border border-emerald-100 bg-white">
                  <CardHeader>
                    <CardTitle className="text-gray-700">Órdenes en pausa</CardTitle>
                    <CardDescription>Mantenimiento pendiente de reanudar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">{formatNumber(resumen.mantenimiento_en_pausa)}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
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
