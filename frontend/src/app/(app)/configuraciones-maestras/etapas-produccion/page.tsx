'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/common/data-state'
import { AccessDenied } from '@/components/access-denied'
import EtapaProduccionFormModal from '@/components/etapa-produccion-form-modal'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'
import type { EtapaProduccion } from '@/types/models'

const EtapasProduccionPage = () => {
  const { status, canEdit } = useMasterConfigAccess()
  const [etapas, setEtapas] = useState<EtapaProduccion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'ready') {
      void fetchEtapas()
    }
  }, [status])

  const fetchEtapas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getEtapasProduccion({ page_size: 200 })
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) {
      return etapas
    }
    return etapas.filter((etapa) => {
      const descripcion = etapa.descripcion ? etapa.descripcion.toLowerCase() : ''
      return (
        etapa.codigo.toLowerCase().includes(term) ||
        etapa.nombre.toLowerCase().includes(term) ||
        descripcion.includes(term)
      )
    })
  }, [etapas, searchTerm])

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  const openCreateModal = () => {
    setSelectedId(null)
    setModalOpen(true)
  }

  const openEditModal = (id: number) => {
    setSelectedId(id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedId(null)
  }

  const handleDelete = async (id: number) => {
    const target = etapas.find((item) => item.id === id)
    const confirmation = window.confirm(
      `¿Está seguro de eliminar la etapa ${target?.codigo ?? ''}? Esta operación afectará a las fórmulas asociadas.`,
    )
    if (!confirmation) {
      return
    }

    try {
      await api.deleteEtapaProduccion(id)
      showSuccess('Etapa eliminada correctamente')
      void fetchEtapas()
    } catch (err) {
      const { message } = handleApiError(err)
      showError('No se pudo eliminar la etapa', message)
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
    return <AccessDenied description="No cuenta con permisos para ver las etapas de producción." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          {canEdit && (
            <Button onClick={openCreateModal} className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Nueva etapa
            </Button>
          )}
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
                .sort((a, b) => a.codigo.localeCompare(b.codigo))
                .map((etapa, index) => (
                  <motion.div
                    key={etapa.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-gray-900">{etapa.codigo}</CardTitle>
                            <p className="text-base text-gray-700">{etapa.nombre}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={etapa.activa ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                              {etapa.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditModal(etapa.id)}
                                  aria-label="Editar etapa"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(etapa.id)}
                                  aria-label="Eliminar etapa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-gray-700">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
                          <p className="text-gray-700">{etapa.descripcion || 'Sin descripción registrada'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Máquinas permitidas</p>
                          <p className="text-gray-700">
                            {etapa.maquinas_permitidas_nombres && etapa.maquinas_permitidas_nombres.length > 0
                              ? etapa.maquinas_permitidas_nombres.map((item) => item.nombre).join(', ')
                              : 'Sin asignar'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </DataState>

        <EtapaProduccionFormModal
          isOpen={modalOpen}
          etapaId={selectedId}
          onClose={closeModal}
          onSuccess={fetchEtapas}
        />
      </div>
    </div>
  )
}

export default EtapasProduccionPage
