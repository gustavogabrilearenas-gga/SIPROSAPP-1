'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search } from 'lucide-react'
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
import type { Turno } from '@/types/models'

const formatTime = (value: string) => {
  const date = new Date(`2000-01-01T${value}`)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const TurnosPage = () => {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchTurnos()
  }, [])

  const fetchTurnos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTurnos({ page_size: 100 })
      setTurnos(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener los turnos'
      setError(detail)
      showError('Error al cargar turnos', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = turnos.filter((turno) => {
    const term = searchTerm.toLowerCase()
    return (
      turno.codigo.toLowerCase().includes(term) ||
      turno.nombre.toLowerCase().includes(term)
    )
  })

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600/10 p-3 text-indigo-700">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Turnos operativos</h1>
            <p className="text-sm text-gray-600">
              Información oficial de{' '}
              <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">/api/catalogos/turnos/</code>
            </p>
          </div>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por código o nombre"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <DataState
          loading={loading}
          error={hasError ? error : null}
          empty={isEmpty}
          emptyMessage="No hay turnos registrados"
        >
          {!hasError && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((turno, index) => (
                <motion.div
                  key={turno.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {turno.nombre}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-700">
                            Código interno: {turno.codigo}
                          </CardDescription>
                        </div>
                        <Badge className={turno.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {turno.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span>
                          {formatTime(turno.hora_inicio)} — {formatTime(turno.hora_fin)}
                        </span>
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

export default TurnosPage
