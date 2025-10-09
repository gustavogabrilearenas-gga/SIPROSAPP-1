'use client'

import { type ComponentType, useState, useEffect, useCallback, useMemo } from 'react'
import { Bell, X, AlertTriangle, Package, Activity, AlertCircle, RefreshCcw, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import DataState from '@/components/common/data-state'
import { api, KpiAlertas } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'

const alertDefinitions: Array<{
  key: keyof KpiAlertas
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
}> = [
  {
    key: 'insumos_por_vencer',
    title: 'Insumos por vencer',
    description: 'Lotes de insumo próximos a vencer',
    icon: Clock,
    accent: 'text-amber-600'
  },
  {
    key: 'insumos_stock_critico',
    title: 'Stock crítico',
    description: 'Insumos por debajo del stock mínimo',
    icon: Package,
    accent: 'text-red-600'
  },
  {
    key: 'maquinas_fuera_servicio',
    title: 'Máquinas fuera de servicio',
    description: 'Requieren parada de producción',
    icon: AlertTriangle,
    accent: 'text-orange-600'
  },
  {
    key: 'ordenes_atrasadas',
    title: 'Órdenes atrasadas',
    description: 'Órdenes de mantenimiento vencidas',
    icon: Activity,
    accent: 'text-blue-600'
  },
  {
    key: 'desviaciones_criticas_abiertas',
    title: 'Desviaciones críticas',
    description: 'Investigaciones de calidad sin cerrar',
    icon: AlertCircle,
    accent: 'text-rose-600'
  }
]

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [alertas, setAlertas] = useState<KpiAlertas | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadAlertas = useCallback(async (background = false) => {
    if (!background) {
      setLoading(true)
    }

    try {
      const data = await api.getAlertas()
      setAlertas(data)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No se pudieron cargar las alertas'
      setError(message)
      setAlertas(null)
      showError('Error al cargar alertas', message)
    } finally {
      if (!background) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    loadAlertas(false)
    const interval = setInterval(() => loadAlertas(true), 60000)

    return () => clearInterval(interval)
  }, [isOpen, loadAlertas])

  useEffect(() => {
    loadAlertas(false)
  }, [loadAlertas])

  const totalAlertas = useMemo(() => {
    if (!alertas) {
      return 0
    }

    return Object.values(alertas).reduce((acc, value) => acc + value, 0)
  }, [alertas])

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Sincronizando'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Centro de alertas"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {totalAlertas > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 px-1 flex items-center justify-center"
          >
            {totalAlertas > 99 ? '99+' : totalAlertas}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Alertas operativas</h3>
                  <p className="text-xs text-gray-500">Actualización automática cada 60 s</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-white/60 text-gray-600"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <DataState
                  loading={loading}
                  error={error}
                  empty={!alertas || totalAlertas === 0}
                  emptyMessage="Sin alertas activas"
                >
                  <div className="space-y-4">
                    {alertDefinitions.map((definition) => {
                      const value = alertas?.[definition.key] ?? 0
                      const Icon = definition.icon

                      return (
                        <div
                          key={definition.key}
                          className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg border bg-white p-2 shadow-sm ${definition.accent.replace('text-', 'border-')}`}
                            >
                              <Icon className={`h-5 w-5 ${definition.accent}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{definition.title}</p>
                              <p className="text-xs text-gray-500">{definition.description}</p>
                            </div>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                </DataState>
              </div>

              <div className="border-t bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
                <span>Última actualización: {lastUpdatedLabel}</span>
                <button
                  onClick={() => loadAlertas(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-gray-600 hover:bg-white"
                >
                  <RefreshCcw className="h-3 w-3" />
                  Refrescar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
