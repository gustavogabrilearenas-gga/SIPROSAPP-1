'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'
import type { Formula } from '@/types/models'

const FormulasPage = () => {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchFormulas()
  }, [])

  const fetchFormulas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getFormulas({ page_size: 100 })
      setFormulas(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener las fórmulas'
      setError(detail)
      showError('Error al cargar fórmulas', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return formulas.filter((formula) =>
      [formula.codigo, formula.version, formula.producto_nombre]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [formulas, searchTerm])

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-gray-900">
            <FileText className="h-8 w-8 text-purple-600" />
            Formulaciones registradas
          </h1>
          <p className="text-sm text-gray-600">
            Información provista por{' '}
            <code className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">/api/catalogos/formulas/</code>
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por producto o versión"
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <DataState
          loading={loading}
          error={hasError ? error : null}
          empty={isEmpty}
          emptyMessage={
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-500 text-lg">No hay fórmulas registradas.</p>
            </div>
          }
        >
          {!hasError && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((formula, index) => (
                <motion.div
                  key={formula.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {formula.codigo}
                          </CardTitle>
                          <CardDescription className="text-base text-gray-700">
                            {formula.producto_nombre}
                          </CardDescription>
                        </div>
                        <Badge className={formula.activa ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                          {formula.activa ? 'Activa' : 'Archivada'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-700">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Versión</p>
                        <p className="font-medium text-gray-900">{formula.version}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
                        <p className="text-gray-700">{formula.descripcion || 'Sin descripción registrada'}</p>
                      </div>
                      {formula.ingredientes && formula.ingredientes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Ingredientes</p>
                          <ul className="space-y-1 text-gray-700">
                            {formula.ingredientes.slice(0, 3).map((ingrediente) => (
                              <li key={ingrediente.id}>
                                {ingrediente.material_nombre} — {ingrediente.cantidad} {ingrediente.unidad}
                              </li>
                            ))}
                            {formula.ingredientes.length > 3 && (
                              <li className="text-xs text-gray-500">
                                +{formula.ingredientes.length - 3} ingredientes adicionales
                              </li>
                            )}
                          </ul>
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

export default FormulasPage
