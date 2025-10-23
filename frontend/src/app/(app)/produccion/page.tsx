'use client'

import { useEffect, useMemo, useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import type {
  Formula,
  Maquina,
  Producto,
  RegistroProduccion,
  Turno,
} from '@/types/models'

interface RegistroFormState {
  producto: string
  formula: string
  maquina: string
  turno: string
  hora_inicio: string
  hora_fin: string
  cantidad_producida: string
  unidad_medida: string
  observaciones: string
}

const emptyForm: RegistroFormState = {
  producto: '',
  formula: '',
  maquina: '',
  turno: '',
  hora_inicio: '',
  hora_fin: '',
  cantidad_producida: '',
  unidad_medida: 'unidades',
  observaciones: '',
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const ProduccionPage = () => {
  const [registros, setRegistros] = useState<RegistroProduccion[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<RegistroFormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [registrosResp, productosResp, formulasResp, maquinasResp, turnosResp] = await Promise.all([
        api.getProduccionRegistros({ ordering: '-fecha_registro', page_size: 50 }),
        api.getProductos({ page_size: 100 }),
        api.getFormulas({ page_size: 100 }),
        api.getMaquinas({ page_size: 100 }),
        api.getTurnos({ page_size: 100 }),
      ])

      setRegistros(registrosResp.results ?? [])
      setProductos(productosResp.results ?? [])
      setFormulas(formulasResp.results ?? [])
      setMaquinas(maquinasResp.results ?? [])
      setTurnos(turnosResp.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo obtener la información de producción')
    } finally {
      setLoading(false)
    }
  }

  const productoMap = useMemo(() => new Map(productos.map((item) => [item.id, item])), [productos])
  const formulaMap = useMemo(() => new Map(formulas.map((item) => [item.id, item])), [formulas])
  const maquinaMap = useMemo(() => new Map(maquinas.map((item) => [item.id, item])), [maquinas])
  const turnoMap = useMemo(() => new Map(turnos.map((item) => [item.id, item])), [turnos])

  const availableFormulas = useMemo(() => {
    if (!formState.producto) {
      return formulas
    }
    const productoId = Number(formState.producto)
    return formulas.filter((formula) => formula.producto === productoId)
  }, [formulas, formState.producto])

  const resetForm = () => setFormState(emptyForm)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.producto || !formState.formula) {
      setError('Seleccioná al menos un producto y una fórmula para registrar la producción')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        producto: Number(formState.producto),
        formula: Number(formState.formula),
        unidad_medida: formState.unidad_medida || 'unidades',
        observaciones: formState.observaciones.trim(),
      }

      if (formState.maquina) {
        payload.maquina = Number(formState.maquina)
      }
      if (formState.turno) {
        payload.turno = Number(formState.turno)
      }
      if (formState.cantidad_producida) {
        payload.cantidad_producida = formState.cantidad_producida
      }
      if (formState.hora_inicio) {
        payload.hora_inicio = new Date(formState.hora_inicio).toISOString()
      }
      if (formState.hora_fin) {
        payload.hora_fin = new Date(formState.hora_fin).toISOString()
      }

      await api.createProduccionRegistro(payload)
      resetForm()
      await fetchData()
    } catch (err) {
      const { message } = handleApiError(err)
      setError(message || 'No se pudo registrar la producción')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && registros.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600/10 p-3 text-blue-700">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Registros de Producción</h1>
              <p className="text-sm text-gray-600">
                Visualizá y registrá la producción diaria coordinada con el backend oficial.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                <Plus className="h-4 w-4" />
              </span>
              Carga de registros en línea
            </span>
          </div>
        </header>

        <Card className="bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Registrar producción</CardTitle>
            <p className="text-sm text-gray-600">
              Los datos se envían directamente al endpoint <code>/api/produccion/registros/</code> del backend.
            </p>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Producto *</span>
                <select
                  required
                  value={formState.producto}
                  onChange={(event) => {
                    setFormState((prev) => ({
                      ...prev,
                      producto: event.target.value,
                      formula: '',
                    }))
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccioná un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.codigo} — {producto.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Fórmula *</span>
                <select
                  required
                  value={formState.formula}
                  onChange={(event) => setFormState((prev) => ({ ...prev, formula: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccioná una fórmula</option>
                  {availableFormulas.map((formula) => (
                    <option key={formula.id} value={formula.id}>
                      {formula.codigo} — {formula.version}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Máquina</span>
                <select
                  value={formState.maquina}
                  onChange={(event) => setFormState((prev) => ({ ...prev, maquina: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sin asignar</option>
                  {maquinas.map((maquina) => (
                    <option key={maquina.id} value={maquina.id}>
                      {maquina.codigo} — {maquina.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Turno</span>
                <select
                  value={formState.turno}
                  onChange={(event) => setFormState((prev) => ({ ...prev, turno: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Sin turno</option>
                  {turnos.map((turno) => (
                    <option key={turno.id} value={turno.id}>
                      {turno.nombre} ({turno.hora_inicio} - {turno.hora_fin})
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Inicio real</span>
                <input
                  type="datetime-local"
                  value={formState.hora_inicio}
                  onChange={(event) => setFormState((prev) => ({ ...prev, hora_inicio: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Fin real</span>
                <input
                  type="datetime-local"
                  value={formState.hora_fin}
                  onChange={(event) => setFormState((prev) => ({ ...prev, hora_fin: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Cantidad producida</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formState.cantidad_producida}
                  onChange={(event) => setFormState((prev) => ({ ...prev, cantidad_producida: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Unidad</span>
                <input
                  type="text"
                  value={formState.unidad_medida}
                  onChange={(event) => setFormState((prev) => ({ ...prev, unidad_medida: event.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                <span className="font-medium text-gray-700">Observaciones</span>
                <textarea
                  value={formState.observaciones}
                  onChange={(event) => setFormState((prev) => ({ ...prev, observaciones: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Notas relevantes del proceso, desvíos o ajustes realizados"
                />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSubmitting ? 'Guardando…' : 'Registrar producción'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Limpiar formulario
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-white/90 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <DataState
              loading={loading}
              error={hasError ? error : null}
              empty={isEmpty}
              emptyMessage="Todavía no hay registros de producción guardados."
            >
              {!hasError && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b bg-gray-100/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3">Fórmula</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Cantidad</th>
                        <th className="px-4 py-3">Inicio</th>
                        <th className="px-4 py-3">Fin</th>
                        <th className="px-4 py-3">Turno</th>
                        <th className="px-4 py-3">Máquina</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registros.map((registro) => {
                        const producto = productoMap.get(registro.producto)
                        const formula = formulaMap.get(registro.formula)
                        const turno = registro.turno ? turnoMap.get(registro.turno) : undefined
                        const maquina = registro.maquina ? maquinaMap.get(registro.maquina) : undefined
                        const cantidad = registro.cantidad_producida ?? '-'
                        return (
                          <tr key={registro.id} className="border-b border-gray-100/80 hover:bg-blue-50/60">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {producto ? `${producto.codigo} — ${producto.nombre}` : registro.producto}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {formula ? `${formula.codigo} ${formula.version}` : registro.formula}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                              >
                                {registro.estado.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {cantidad} {registro.unidad_medida || ''}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTime(registro.hora_inicio)}</td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTime(registro.hora_fin)}</td>
                            <td className="px-4 py-3 text-gray-600">{turno ? turno.nombre : '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{maquina ? maquina.nombre : '-'}</td>
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

export default ProduccionPage
