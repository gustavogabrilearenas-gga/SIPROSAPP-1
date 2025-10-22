'use client'

import { useEffect, useState } from 'react'
import { Activity, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'
import type { EtapaProduccion } from '@/types/models'

const EtapasProduccionPage = () => {
  const [etapas, setEtapas] = useState<EtapaProduccion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchEtapas()
  }, [])

  const fetchEtapas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getEtapasProduccion({ page_size: 100 })
      setEtapas(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener las etapas de producción'
      setError(detail)
      showError('Error al cargar etapas', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = etapas.filter((etapa) => {
    const term = searchTerm.toLowerCase()
    return (
      etapa.codigo.toLowerCase().includes(term) ||
      etapa.nombre.toLowerCase().includes(term) ||
      etapa.descripcion.toLowerCase().includes(term)
    )
  })

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/10 p-3 text-blue-700">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Etapas de producción</h1>
            <p className="text-sm text-gray-600">
              Datos sincronizados con{' '}
              <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">/api/catalogos/etapas-produccion/</code>
            </p>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por código, nombre o descripción"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <DataState
          loading={loading}
          error={hasError ? error : null}
          empty={isEmpty}
          emptyMessage="No hay etapas registradas"
        >
          {!hasError && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered
                .slice()
                .sort((a, b) => a.orden_tipico - b.orden_tipico)
                .map((etapa, index) => (
                  <motion.div
                    key={etapa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-gray-900">
                              {etapa.codigo}
                            </CardTitle>
                            <CardDescription className="text-base text-gray-700">
                              {etapa.nombre}
                            </CardDescription>
                          </div>
                          <Badge className={etapa.activa ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                            {etapa.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-gray-700">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Orden típico</p>
                          <p className="font-medium text-gray-900">{etapa.orden_tipico}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
                          <p className="text-gray-700">{etapa.descripcion || 'Sin descripción registrada'}</p>
                        </div>
                        {etapa.parametros_esperados && etapa.parametros_esperados.length > 0 && (
                          <div className="space-y-1 text-xs text-gray-500">
                            <p className="font-medium text-gray-600">Parámetros esperados</p>
                            <pre className="whitespace-pre-wrap rounded bg-gray-100 px-3 py-2 text-gray-700">
                              {JSON.stringify(etapa.parametros_esperados, null, 2)}
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </DataState>
      </div>
    </div>
  )
}

export default EtapasProduccionPage
