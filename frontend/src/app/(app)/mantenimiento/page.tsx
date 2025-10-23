'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import type { Maquina, RegistroMantenimiento } from '@/types/models'

const mantenimientoTipos: Record<string, string> = {
  CORRECTIVO: 'Correctivo',
  AUTONOMO: 'Autónomo',
  PREVENTIVO: 'Preventivo',
}

interface MantenimientoFormState {
  maquina: string
  tipo_mantenimiento: keyof typeof mantenimientoTipos
  hora_inicio: string
  hora_fin: string
  descripcion: string
  tiene_anomalias: boolean
  descripcion_anomalias: string
  observaciones: string
}

const emptyForm: MantenimientoFormState = {
  maquina: '',
  tipo_mantenimiento: 'PREVENTIVO',
  hora_inicio: '',
  hora_fin: '',
  descripcion: '',
  tiene_anomalias: false,
  descripcion_anomalias: '',
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

const MantenimientoPage = () => {
  const [registros, setRegistros] = useState<RegistroMantenimiento[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<MantenimientoFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [registrosResp, maquinasResp] = await Promise.all([
        api.getMantenimientoRegistros({ ordering: '-hora_inicio', page_size: 50 }),
        api.getMaquinas({ page_size: 100 }),
      ])

      setRegistros(registrosResp.results ?? [])
      setMaquinas(maquinasResp.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo obtener la información de mantenimiento')
    } finally {
      setLoading(false)
    }
  }

  const maquinaMap = useMemo(() => new Map(maquinas.map((item) => [item.id, item])), [maquinas])

  const resetForm = () => setFormState(emptyForm)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.maquina || !formState.hora_inicio || !formState.hora_fin || !formState.descripcion.trim()) {
      setError('Completá máquina, horarios y descripción para registrar el mantenimiento')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        maquina: Number(formState.maquina),
        tipo_mantenimiento: formState.tipo_mantenimiento,
        hora_inicio: new Date(formState.hora_inicio).toISOString(),
        hora_fin: new Date(formState.hora_fin).toISOString(),
        descripcion: formState.descripcion.trim(),
        tiene_anomalias: formState.tiene_anomalias,
        observaciones: formState.observaciones.trim(),
      }

      if (formState.tiene_anomalias) {
        payload.descripcion_anomalias = formState.descripcion_anomalias.trim()
      }

      await api.createMantenimientoRegistro(payload)
      resetForm()
      await fetchData()
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo registrar el mantenimiento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && registros.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-100">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600/10 p-3 text-blue-700">
              <Wrench className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Registro de Mantenimiento</h1>
              <p className="text-sm text-gray-600">
                Registrar intervenciones de mantenimiento sincronizadas con el backend oficial de SIPROSA.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-600 shadow-sm">
            <ClipboardCheck className="h-4 w-4 text-blue-700" />
            Modelo de datos: <code>/api/mantenimiento/registros/</code>
          </span>
        </header>

        <Card className="bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Registrar intervención</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Máquina *</span>
                <select
                  required
                  value={formState.maquina}
                  onChange={(event) => setFormState((prev) => ({ ...prev, maquina: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccioná una máquina</option>
                  {maquinas.map((maquina) => (
                    <option key={maquina.id} value={maquina.id}>
                      {maquina.codigo} — {maquina.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Tipo *</span>
                <select
                  value={formState.tipo_mantenimiento}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      tipo_mantenimiento: event.target.value as MantenimientoFormState['tipo_mantenimiento'],
                    }))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(mantenimientoTipos).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Inicio *</span>
                <input
                  type="datetime-local"
                  required
                  value={formState.hora_inicio}
                  onChange={(event) => setFormState((prev) => ({ ...prev, hora_inicio: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Fin *</span>
                <input
                  type="datetime-local"
                  required
                  value={formState.hora_fin}
                  onChange={(event) => setFormState((prev) => ({ ...prev, hora_fin: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Descripción de tareas *</span>
                <textarea
                  required
                  value={formState.descripcion}
                  onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Detalle de la actividad realizada, repuestos utilizados, mediciones, etc."
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formState.tiene_anomalias}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      tiene_anomalias: event.target.checked,
                      descripcion_anomalias: event.target.checked ? prev.descripcion_anomalias : '',
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                ¿Se detectaron anomalías?
              </label>

              {formState.tiene_anomalias && (
                <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                  <span className="font-medium text-gray-700">Descripción de anomalías *</span>
                  <textarea
                    required
                    value={formState.descripcion_anomalias}
                    onChange={(event) => setFormState((prev) => ({ ...prev, descripcion_anomalias: event.target.value }))}
                    rows={2}
                    className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Describe la anomalía encontrada y su impacto"
                  />
                </label>
              )}

              <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Observaciones</span>
                <textarea
                  value={formState.observaciones}
                  onChange={(event) => setFormState((prev) => ({ ...prev, observaciones: event.target.value }))}
                  rows={2}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Notas complementarias, responsables, seguimiento futuro"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSubmitting ? 'Guardando…' : 'Registrar mantenimiento'}
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
            <CardTitle className="text-lg font-semibold">Historial de intervenciones</CardTitle>
          </CardHeader>
          <CardContent>
            <DataState
              loading={loading}
              error={hasError ? error : null}
              empty={isEmpty}
              emptyMessage="No hay intervenciones registradas."
            >
              {!hasError && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-gray-100/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <th className="px-4 py-3">Máquina</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Inicio</th>
                        <th className="px-4 py-3">Fin</th>
                        <th className="px-4 py-3">Anomalías</th>
                        <th className="px-4 py-3">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((registro) => {
                        const maquina = maquinaMap.get(registro.maquina)
                        return (
                          <tr key={registro.id} className="border-b border-gray-100/80 hover:bg-blue-50/60">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {maquina ? `${maquina.codigo} — ${maquina.nombre}` : registro.maquina}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {mantenimientoTipos[registro.tipo_mantenimiento] ?? registro.tipo_mantenimiento}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTime(registro.hora_inicio)}</td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTime(registro.hora_fin)}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {registro.tiene_anomalias
                                ? registro.descripcion_anomalias || 'Sí'
                                : 'No'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">{registro.observaciones || '—'}</td>
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

export default MantenimientoPage
