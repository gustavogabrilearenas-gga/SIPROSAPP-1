'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Pencil, Plus, Search, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import DataState from '@/components/common/data-state'
import { AccessDenied } from '@/components/access-denied'
import ParametroFormModal from '@/components/parametros/ParametroFormModal'
import { api, handleApiError, unpackResults } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'
import type { Parametro } from '@/types/models'

const ParametrosPage = () => {
  const { status, canEdit } = useMasterConfigAccess()
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Parametro | null>(null)

  useEffect(() => {
    if (status === 'ready') {
      void fetchParametros()
    }
  }, [status])

  const fetchParametros = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getParametros({ page_size: 200 })
      setParametros(unpackResults(response))
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener los parámetros'
      setError(detail)
      showError('Error al cargar parámetros', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return parametros
    return parametros.filter(
      (p) =>
        p.codigo.toLowerCase().includes(term) ||
        p.nombre.toLowerCase().includes(term) ||
        (p.descripcion ?? '').toLowerCase().includes(term),
    )
  }, [parametros, searchTerm])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (data: Parametro) => {
    setEditing(data)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar el parámetro?')) return
    try {
      await api.deleteParametro(id)
      showSuccess('Parámetro eliminado')
      void fetchParametros()
    } catch (err) {
      const { message } = handleApiError(err)
      showError('Error', message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-blue-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verificando permisos...
      </div>
    )
  }

  if (status === 'forbidden') {
    return (
      <AccessDenied description="Sólo supervisores y administradores pueden acceder a las configuraciones maestras." />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Parámetros</h2>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Parámetro
          </Button>
        )}
      </div>

      <div className="relative max-w-xs">
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      </div>

      <DataState
        loading={loading}
        error={error}
        emptyText="No se encontraron parámetros"
        retry={fetchParametros}
      >
        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((param) => (
              <motion.div
                key={param.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                        {param.nombre}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Código: {param.codigo}
                      </CardDescription>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Pencil
                          className="h-4 w-4 cursor-pointer text-gray-500 hover:text-blue-600"
                          onClick={() => openEdit(param)}
                        />
                        <Trash2
                          className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(param.id)}
                        />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">Descripción</p>
                    <p className="text-gray-700">
                      {param.descripcion || 'Sin descripción registrada'}
                    </p>
                    <p className="font-medium pt-2">Unidad</p>
                    <p className="text-gray-700">{param.unidad || '—'}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </DataState>

      <ParametroFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchParametros}
        initialData={editing}
      />
    </div>
  )
}

export default ParametrosPage
