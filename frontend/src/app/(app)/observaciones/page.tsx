'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardList, Loader2, RefreshCcw, Send } from 'lucide-react'

import DataState from '@/components/common/data-state'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/stores/auth-store'
import { api, handleApiError } from '@/lib/api'
import type { ObservacionGeneral } from '@/types/models'

const OBSERVACIONES_PAGE_SIZE = 50

const formatFecha = (value: string): string => {
  try {
    return format(new Date(value), "dd 'de' MMMM yyyy 'a las' HH:mm'h'", { locale: es })
  } catch (error) {
    return value
  }
}

export default function ObservacionesPage() {
  const { user } = useAuth()
  const [observaciones, setObservaciones] = useState<ObservacionGeneral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadObservaciones = useCallback(async (showFullLoader = false) => {
    if (showFullLoader) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const response = await api.getObservacionesGenerales({ page_size: OBSERVACIONES_PAGE_SIZE })
      setObservaciones(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener las observaciones registradas.'
      setError(detail)
      showError('Error al cargar observaciones', detail)
    } finally {
      if (showFullLoader) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadObservaciones(true)
  }, [loadObservaciones])

  const handleRefresh = () => {
    void loadObservaciones(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = texto.trim()

    if (!trimmed) {
      showError('Observación vacía', 'Escribe una observación antes de enviarla.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.createObservacionGeneral({ texto: trimmed })
      showSuccess('Observación registrada correctamente')
      setTexto('')
      await loadObservaciones(observaciones.length === 0)
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudo registrar la observación. Intenta nuevamente.'
      showError('Error al registrar observación', detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEmpty = !loading && !error && observaciones.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100/40 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              Observaciones Generales
            </h1>
            <p className="max-w-2xl text-sm text-gray-600">
              Consulta y registra hallazgos o novedades transversales a las operaciones.
            </p>
            <p className="text-xs text-gray-500">
              Fuente de datos:{' '}
              <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                /api/observaciones/observaciones/
              </code>
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Actualizar
          </Button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm"
        >
          <div className="border-b border-blue-50 bg-blue-50/60 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Registrar observación</h2>
            <p className="text-sm text-gray-600">
              Describe hallazgos, acciones preventivas o información relevante para todo el equipo.
            </p>
          </div>
          <div className="space-y-4 px-6 py-5">
            <label htmlFor="observacion" className="text-sm font-medium text-gray-700">
              Observaciones generales
            </label>
            <textarea
              id="observacion"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              className="min-h-[140px] w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Escribe aquí las observaciones generales sobre la operación..."
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTexto('')}
                disabled={isSubmitting || texto.trim().length === 0}
              >
                Limpiar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Registrar observación
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <section className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Historial de observaciones</h2>
              <p className="text-sm text-gray-600">
                Se muestran las últimas {Math.min(observaciones.length, OBSERVACIONES_PAGE_SIZE)} observaciones registradas.
              </p>
            </div>
          </header>

          <DataState
            loading={loading}
            error={error}
            empty={isEmpty}
            loadingMessage="Cargando observaciones registradas..."
            emptyMessage="Aún no hay observaciones registradas."
          >
            <div className="space-y-4">
              {observaciones.map((observacion) => {
                const esDelUsuarioActual = user?.id != null && observacion.creado_por === user.id
                const autorLabel = esDelUsuarioActual
                  ? user?.full_name || 'Tú'
                  : `Usuario #${observacion.creado_por}`

                return (
                  <Card key={observacion.id} className="border border-gray-100 shadow-sm">
                    <CardHeader className="space-y-1 pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className="text-base font-semibold text-gray-900">
                          Observación #{observacion.id}
                        </CardTitle>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          {formatFecha(observacion.fecha_hora)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Registrado por{' '}
                        <span className={esDelUsuarioActual ? 'font-medium text-blue-600' : 'font-medium'}>
                          {autorLabel}
                        </span>
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                        {observacion.texto}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </DataState>
        </section>
      </div>
    </div>
  )
}
