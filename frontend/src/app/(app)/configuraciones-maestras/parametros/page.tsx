
'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
import ParametroFormModal from '@/components/parametro-form-modal'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Parametro } from '@/types/models'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'

export default function ParametrosPage() {
  const [parametros, setParametros] = useState<Parametro[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState<string>('')

  const access = useMasterConfigAccess()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await api.getParametros()
      setParametros(data.results)
    } catch (err) {
      showError('Error', handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return parametros.filter(
      (p) =>
        p.codigo.toLowerCase().includes(term) ||
        p.nombre.toLowerCase().includes(term),
    )
  }, [parametros, search])

  const openNew = () => {
    setSelectedId(null)
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    setSelectedId(id)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Confirma eliminar el parámetro?')) return
    try {
      await api.deleteParametro(id)
      showSuccess('Eliminado', 'El parámetro fue eliminado.')
      fetchData()
    } catch (err) {
      showError('Error', handleApiError(err).message)
    }
  }

  if (!access.canView) return <AccessDenied />

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal />
            <CardTitle>Parámetros</CardTitle>
          </div>
          {access.canEdit && (
            <Button size="sm" onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar…"
              className="input input-bordered w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataState
            loading={loading}
            dataLength={filtered.length}
            emptyMessage="Sin parámetros registrados."
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <motion.div key={p.id} layout>
                  <Card className="relative">
                    {access.canEdit && (
                      <div className="absolute right-2 top-2 flex space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(p.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <CardHeader>
                      <SlidersHorizontal className="h-8 w-8 text-gray-700" />
                      <CardTitle>{p.nombre}</CardTitle>
                      <CardDescription>{p.codigo}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {p.descripcion || 'Sin descripción.'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </DataState>
        </CardContent>
      </Card>

      <ParametroFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        parametroId={selectedId}
        onSuccess={fetchData}
      />
    </div>
  )
}
