'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { Loader2, Save, Settings, X } from 'lucide-react'
import type { Maquina, Parametro } from '@/types/models'

interface EtapaProduccionFormModalProps {
  isOpen: boolean
  etapaId: number | null
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  codigo: string
  nombre: string
  descripcion: string
  activa: boolean
  maquinas_permitidas: number[]
  parametros: number[]
}

const defaultState: FormState = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activa: true,
  maquinas_permitidas: [],
  parametros: [],
}

const EtapaProduccionFormModal = ({ isOpen, etapaId, onClose, onSuccess }: EtapaProduccionFormModalProps) => {
  const [formState, setFormState] = useState<FormState>(defaultState)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [parametros, setParametros] = useState<Parametro[]>([])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadCatalogData()

    if (etapaId) {
      void loadEtapa(etapaId)
    } else {
      setFormState(defaultState)
    }
  }, [isOpen, etapaId])

  const loadCatalogData = async () => {
    try {
      const [maquinasResponse, parametrosResponse] = await Promise.all([
        api.getMaquinas({ page_size: 200, activa: true }),
        api.getParametros({ page_size: 200, activo: true }),
      ])
      setMaquinas(maquinasResponse.results ?? [])
      setParametros(parametrosResponse.results ?? [])
    } catch (error) {
      const { message } = handleApiError(error)
      showError('Error al cargar catálogos', message)
    }
  }

  const loadEtapa = async (id: number) => {
    setIsLoading(true)
    try {
      const data = await api.getEtapaProduccion(id)
      setFormState({
        codigo: data.codigo ?? '',
        nombre: data.nombre ?? '',
        descripcion: data.descripcion ?? '',
        activa: Boolean(data.activa),
        maquinas_permitidas: (data.maquinas_permitidas as number[]) ?? [],
        parametros: (data.parametros as number[]) ?? [],
      })
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudieron cargar los datos de la etapa', message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleMultiSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    field: 'maquinas_permitidas' | 'parametros',
  ) => {
    const values = Array.from(event.target.selectedOptions).map((option) => Number(option.value))
    setFormState((prev) => ({ ...prev, [field]: values }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.codigo.trim() || !formState.nombre.trim()) {
      showError('Datos incompletos', 'Debe completar código y nombre de la etapa')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        codigo: formState.codigo.trim().toUpperCase(),
        nombre: formState.nombre.trim(),
        descripcion: formState.descripcion.trim(),
        activa: formState.activa,
        maquinas_permitidas: formState.maquinas_permitidas,
        parametros: formState.parametros,
      }

      if (etapaId) {
        await api.updateEtapaProduccion(etapaId, payload)
        showSuccess('Etapa actualizada correctamente')
      } else {
        await api.createEtapaProduccion(payload)
        showSuccess('Etapa creada correctamente')
      }

      onSuccess()
      onClose()
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudo guardar la etapa', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="w-full max-w-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Settings className="h-5 w-5" />
                  {etapaId ? 'Editar etapa de producción' : 'Nueva etapa de producción'}
                </h2>
                <p className="text-sm text-blue-100">Defina el flujo maestro del proceso productivo</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex min-h-[200px] items-center justify-center text-blue-600">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando etapa...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Código <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={formState.codigo}
                        onChange={(event) => handleChange('codigo', event.target.value.toUpperCase())}
                        placeholder="ETP-001"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={formState.nombre}
                        onChange={(event) => handleChange('nombre', event.target.value)}
                        placeholder="Granulación"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <textarea
                      value={formState.descripcion}
                      onChange={(event) => handleChange('descripcion', event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Detalle la finalidad y alcance de la etapa"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Máquinas permitidas</label>
                      <select
                        multiple
                        value={formState.maquinas_permitidas.map(String)}
                        onChange={(event) => handleMultiSelectChange(event, 'maquinas_permitidas')}
                        className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        {maquinas.map((maquina) => (
                          <option key={maquina.id} value={maquina.id}>
                            {maquina.codigo} — {maquina.nombre}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Mantenga presionada la tecla Ctrl o Cmd para seleccionar múltiples opciones.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Parámetros asociados</label>
                      <select
                        multiple
                        value={formState.parametros.map(String)}
                        onChange={(event) => handleMultiSelectChange(event, 'parametros')}
                        className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        {parametros.map((parametro) => (
                          <option key={parametro.id} value={parametro.id}>
                            {parametro.codigo} — {parametro.nombre}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Seleccione los parámetros de proceso que se deben registrar.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="etapa-activa"
                      type="checkbox"
                      checked={formState.activa}
                      onChange={(event) => handleChange('activa', event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSaving}
                    />
                    <label htmlFor="etapa-activa" className="text-sm text-gray-700">
                      Etapa activa
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Guardando...' : etapaId ? 'Actualizar etapa' : 'Crear etapa'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EtapaProduccionFormModal
