'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Search } from 'lucide-react'
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
import type { Ubicacion } from '@/types/models'

const UbicacionesPage = () => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchUbicaciones()
  }, [])

  const fetchUbicaciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getUbicaciones({ page_size: 100 })
      setUbicaciones(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener las ubicaciones'
      setError(detail)
      showError('Error al cargar ubicaciones', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = ubicaciones.filter((ubicacion) => {
    const term = searchTerm.toLowerCase()
    return (
      ubicacion.codigo.toLowerCase().includes(term) ||
      ubicacion.nombre.toLowerCase().includes(term) ||
      ubicacion.descripcion.toLowerCase().includes(term)
    )
  })

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/10 p-3 text-blue-700">
            <MapPin className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Ubicaciones de la planta</h1>
            <p className="text-sm text-gray-600">
              Información desde{' '}
              <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">/api/catalogos/ubicaciones/</code>
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
          emptyMessage="No hay ubicaciones registradas"
        >
          {!hasError && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((ubicacion, index) => (
                <motion.div
                  key={ubicacion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {ubicacion.codigo}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-700">
                            {ubicacion.nombre}
                          </CardDescription>
                        </div>
                        <Badge className={ubicacion.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {ubicacion.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{ubicacion.descripcion || 'Sin descripción registrada'}</span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Máquinas asociadas</p>
                        <p className="font-medium text-gray-900">{ubicacion.maquinas_count}</p>
                      </div>
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

export default UbicacionesPage
