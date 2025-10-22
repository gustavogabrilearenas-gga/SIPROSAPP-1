'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DataState from '@/components/common/data-state'
import { AccessDenied } from '@/components/access-denied'
import FormulaFormModal from '@/components/formula-form-modal'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'
import type { Formula } from '@/types/models'

const FormulasPage = () => {
  const { status, canEdit } = useMasterConfigAccess()
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'ready') {
      void fetchFormulas()
    }
  }, [status])

  const fetchFormulas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getFormulas({ page_size: 200 })
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
    const term = searchTerm.toLowerCase().trim()
    if (!term) {
      return formulas
    }

    return formulas.filter((formula) =>
      [formula.codigo, formula.version, formula.producto_nombre || '', formula.descripcion || '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [formulas, searchTerm])

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
    const target = formulas.find((item) => item.id === id)
    const confirmation = window.confirm(
      `¿Desea eliminar la fórmula ${target?.codigo ?? ''} versión ${target?.version ?? ''}?`,
    )
    if (!confirmation) {
      return
    }

    try {
      await api.deleteFormula(id)
      showSuccess('Fórmula eliminada correctamente')
      void fetchFormulas()
    } catch (err) {
      const { message } = handleApiError(err)
      showError('No se pudo eliminar la fórmula', message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-purple-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verificando permisos...
      </div>
    )
  }

  if (status === 'forbidden') {
    return <AccessDenied description="Esta sección sólo está disponible para supervisores y administradores." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold text-gray-900">
              <FileText className="h-8 w-8 text-purple-600" />
              Formulaciones registradas
            </h1>
            <p className="text-sm text-gray-600">
              Información provista por{' '}
              <code className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">/api/catalogos/formulas/</code>
            </p>
          </div>
          {canEdit && (
            <Button onClick={openCreateModal} className="bg-purple-600 text-white hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> Nueva fórmula
            </Button>
          )}
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por producto, código o versión"
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
              <p className="text-lg text-gray-500">No hay fórmulas registradas.</p>
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">{formula.codigo}</CardTitle>
                          <CardDescription className="text-base text-gray-700">
                            {formula.producto_nombre}
                          </CardDescription>
                          <p className="text-xs uppercase tracking-wide text-gray-500">Versión {formula.version}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={formula.activa ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}>
                            {formula.activa ? 'Activa' : 'Archivada'}
                          </Badge>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditModal(formula.id)}
                                aria-label="Editar fórmula"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(formula.id)}
                                aria-label="Eliminar fórmula"
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
                        <p className="text-gray-700">{formula.descripcion || 'Sin descripción registrada'}</p>
                      </div>
                      {formula.ingredientes && formula.ingredientes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Ingredientes destacados</p>
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

        <FormulaFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          formulaId={selectedId}
          onSuccess={fetchFormulas}
        />
      </div>
    </div>
  )
}

export default FormulasPage
