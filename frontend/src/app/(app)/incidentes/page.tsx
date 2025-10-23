'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import type { Incidente, Maquina } from '@/types/models'

const origenLabels: Record<Incidente['origen'], string> = {
  produccion: 'Producción',
  mantenimiento: 'Mantenimiento',
  general: 'General',
}

interface IncidenteFormState {
  fecha_inicio: string
  fecha_fin: string
  origen: Incidente['origen']
  es_parada_no_planificada: boolean
  maquina: string
  descripcion: string
  requiere_acciones_correctivas: boolean
  acciones_correctivas: string
  observaciones: string
}

const emptyForm: IncidenteFormState = {
  fecha_inicio: '',
  fecha_fin: '',
  origen: 'produccion',
  es_parada_no_planificada: true,
  maquina: '',
  descripcion: '',
  requiere_acciones_correctivas: false,
  acciones_correctivas: '',
  observaciones: '',
}

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const IncidentesPage = () => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<IncidenteFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [incidentesResp, maquinasResp] = await Promise.all([
        api.getIncidentes({ ordering: '-fecha_inicio', page_size: 50 }),
        api.getMaquinas({ page_size: 100 }),
      ])

      setIncidentes(incidentesResp.results ?? [])
      setMaquinas(maquinasResp.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo obtener la información de incidentes')
    } finally {
      setLoading(false)
    }
  }

  const maquinaMap = useMemo(() => new Map(maquinas.map((item) => [item.id, item])), [maquinas])

  const resetForm = () => setFormState(emptyForm)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.fecha_inicio || !formState.fecha_fin || !formState.descripcion.trim()) {
      setError('Completá fechas y descripción para reportar el incidente')
      return
    }
    if (formState.requiere_acciones_correctivas && !formState.acciones_correctivas.trim()) {
      setError('Detallá las acciones correctivas requeridas')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        fecha_inicio: new Date(formState.fecha_inicio).toISOString(),
        fecha_fin: new Date(formState.fecha_fin).toISOString(),
        origen: formState.origen,
        es_parada_no_planificada: formState.es_parada_no_planificada,
        descripcion: formState.descripcion.trim(),
        requiere_acciones_correctivas: formState.requiere_acciones_correctivas,
        observaciones: formState.observaciones.trim(),
      }

      if (formState.maquina) {
        payload.maquina = Number(formState.maquina)
      }
      if (formState.requiere_acciones_correctivas) {
        payload.acciones_correctivas = formState.acciones_correctivas.trim()
      }

      await api.createIncidente(payload)
      resetForm()
      await fetchData()
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo registrar el incidente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && incidentes.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-600/10 p-3 text-red-700">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Gestión de Incidentes</h1>
              <p className="text-sm text-gray-600">
                Registro de eventos críticos conectados al endpoint oficial <code>/api/incidentes/incidentes/</code>.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-600 shadow-sm">
            <Shield className="h-4 w-4 text-red-700" />
            Control de paradas y acciones correctivas
          </span>
        </header>

        <Card className="bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Reportar incidente</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Inicio *</span>
                <input
                  type="datetime-local"
                  required
                  value={formState.fecha_inicio}
                  onChange={(event) => setFormState((prev) => ({ ...prev, fecha_inicio: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Fin *</span>
                <input
                  type="datetime-local"
                  required
                  value={formState.fecha_fin}
                  onChange={(event) => setFormState((prev) => ({ ...prev, fecha_fin: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Origen *</span>
                <select
                  value={formState.origen}
                  onChange={(event) => setFormState((prev) => ({ ...prev, origen: event.target.value as Incidente['origen'] }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  {Object.entries(origenLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.es_parada_no_planificada}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, es_parada_no_planificada: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                ¿Es una parada no planificada?
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Máquina</span>
                <select
                  value={formState.maquina}
                  onChange={(event) => setFormState((prev) => ({ ...prev, maquina: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Sin asociar</option>
                  {maquinas.map((maquina) => (
                    <option key={maquina.id} value={maquina.id}>
                      {maquina.codigo} — {maquina.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Descripción *</span>
                <textarea
                  required
                  value={formState.descripcion}
                  onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Explicá el incidente, causas, áreas involucradas y consecuencias"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.requiere_acciones_correctivas}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      requiere_acciones_correctivas: event.target.checked,
                      acciones_correctivas: event.target.checked ? prev.acciones_correctivas : '',
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                ¿Requiere acciones correctivas?
              </label>

              {formState.requiere_acciones_correctivas && (
                <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                  <span className="font-medium text-gray-700">Acciones correctivas *</span>
                  <textarea
                    required
                    value={formState.acciones_correctivas}
                    onChange={(event) => setFormState((prev) => ({ ...prev, acciones_correctivas: event.target.value }))}
                    rows={2}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                    placeholder="Describe las tareas a ejecutar, responsables y plazos"
                  />
                </label>
              )}

              <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Observaciones</span>
                <textarea
                  value={formState.observaciones}
                  onChange={(event) => setFormState((prev) => ({ ...prev, observaciones: event.target.value }))}
                  rows={2}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Notas complementarias, seguimiento o decisiones tomadas"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-red-600 text-white hover:bg-red-700">
                  {isSubmitting ? 'Guardando…' : 'Registrar incidente'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Limpiar formulario
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Incidentes recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataState
              loading={loading}
              error={hasError ? error : null}
              empty={isEmpty}
              emptyMessage="No hay incidentes registrados."
            >
              {!hasError && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-gray-100/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Origen</th>
                        <th className="px-4 py-3">Máquina</th>
                        <th className="px-4 py-3">Descripción</th>
                        <th className="px-4 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidentes.map((incidente) => {
                        const maquina = incidente.maquina ? maquinaMap.get(incidente.maquina) : incidente.maquina_detalle
                        return (
                          <tr key={incidente.id} className="border-b border-gray-100/80 hover:bg-red-50/60">
                            <td className="px-4 py-3 text-gray-700">
                              {formatDateTime(incidente.fecha_inicio)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{origenLabels[incidente.origen]}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {maquina ? `${maquina.codigo} — ${maquina.nombre}` : 'No asociada'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{incidente.descripcion}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {incidente.requiere_acciones_correctivas
                                ? incidente.acciones_correctivas || 'Pendiente'
                                : 'No requeridas'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </DataState>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default IncidentesPage
