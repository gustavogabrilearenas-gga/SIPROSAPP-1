'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/common/data-state'
import { AccessDenied } from '@/components/access-denied'
import TurnoFormModal from '@/components/turnos/TurnoFormModal'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'
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
  const { status, canEdit } = useMasterConfigAccess()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null)

  useEffect(() => {
    if (status === 'ready') {
      void fetchTurnos()
    }
  }, [status])

  const fetchTurnos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTurnos({ page_size: 200 })
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) {
      return turnos
    }
    return turnos.filter((turno) =>
      [turno.codigo, turno.nombre].some((value) => value.toLowerCase().includes(term)),
    )
  }, [turnos, searchTerm])

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  const openCreateModal = () => {
    setEditingTurno(null)
    setModalOpen(true)
  }

  const openEditModal = (turno: Turno) => {
    setEditingTurno(turno)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingTurno(null)
  }

  const handleDelete = async (turno: Turno) => {
    const confirmation = window.confirm(`¿Eliminar el turno ${turno.nombre}?`)
    if (!confirmation) {
      return
    }

    try {
      await api.deleteTurno(turno.id)
      showSuccess('Turno eliminado correctamente')
      void fetchTurnos()
    } catch (err) {
      const { message } = handleApiError(err)
      showError('No se pudo eliminar el turno', message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-indigo-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verificando permisos...
      </div>
    )
  }

  if (status === 'forbidden') {
    return <AccessDenied description="Sólo supervisores y administradores pueden acceder a los turnos operativos." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          {canEdit && (
            <Button onClick={openCreateModal} className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" /> Nuevo turno
            </Button>
          )}
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">{turno.nombre}</CardTitle>
                          <CardDescription className="text-base text-gray-700">
                            Código interno: {turno.codigo}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={turno.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                            {turno.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditModal(turno)}
                                aria-label="Editar turno"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(turno)}
                                aria-label="Eliminar turno"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
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

        <TurnoFormModal
          open={modalOpen}
          onClose={closeModal}
          onSuccess={fetchTurnos}
          initialData={
            editingTurno
              ? {
                  id: editingTurno.id,
                  codigo: editingTurno.codigo,
                  nombre: editingTurno.nombre,
                  horaInicio: editingTurno.hora_inicio,
                  horaFin: editingTurno.hora_fin,
                  activo: editingTurno.activo,
                }
              : null
          }
        />
      </div>
    </div>
  )
}

export default TurnosPage
