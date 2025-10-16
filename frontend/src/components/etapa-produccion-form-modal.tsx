'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { Settings, Save, X } from 'lucide-react'

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
  orden_tipico: number | ''
  requiere_registro_parametros: boolean
  parametros_esperados: string
  activa: boolean
}

const defaultState: FormState = {
  codigo: '',
  nombre: '',
  descripcion: '',
  orden_tipico: 1,
  requiere_registro_parametros: false,
  parametros_esperados: '[]',
  activa: true,
}

export default function EtapaProduccionFormModal({ isOpen, etapaId, onClose, onSuccess }: EtapaProduccionFormModalProps) {
  const [formState, setFormState] = useState<FormState>(defaultState)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (etapaId) {
      void loadEtapa(etapaId)
    } else {
      setFormState(defaultState)
      setError(null)
    }
  }, [isOpen, etapaId])

  const loadEtapa = async (id: number) => {
    try {
      const data = await api.get(`/etapas-produccion/${id}/`)
      setFormState({
        codigo: data.codigo ?? '',
        nombre: data.nombre ?? '',
        descripcion: data.descripcion ?? '',
        orden_tipico: data.orden_tipico ?? 1,
        requiere_registro_parametros: Boolean(data.requiere_registro_parametros),
        parametros_esperados: JSON.stringify(data.parametros_esperados ?? [], null, 2),
        activa: Boolean(data.activa),
      })
      setError(null)
    } catch (err) {
      const { message } = handleApiError(err)
      const errorMessage = message || 'No se pudieron cargar los datos de la etapa'
      setError(errorMessage)
      showError('Error al cargar etapa', errorMessage)
    }
  }

  const handleChange = (field: keyof FormState, value: FormState[typeof field]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (!formState.codigo.trim()) {
        throw new Error('El código es obligatorio')
      }
      if (!formState.nombre.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      if (!formState.orden_tipico || Number(formState.orden_tipico) <= 0) {
        throw new Error('El orden típico debe ser mayor a cero')
      }

      let parametros: unknown = []
      if (formState.parametros_esperados.trim()) {
        try {
          const parsed = JSON.parse(formState.parametros_esperados)
          if (!Array.isArray(parsed)) {
            throw new Error('El campo parámetros debe ser un arreglo JSON')
          }
          parametros = parsed
        } catch (parseError) {
          throw new Error('El campo parámetros debe contener un JSON válido')
        }
      }

      const payload = {
        codigo: formState.codigo.trim(),
        nombre: formState.nombre.trim(),
        descripcion: formState.descripcion.trim(),
        orden_tipico: Number(formState.orden_tipico),
        requiere_registro_parametros: formState.requiere_registro_parametros,
        parametros_esperados: parametros,
        activa: formState.activa,
      }

      if (etapaId) {
        await api.put(`/etapas-produccion/${etapaId}/`, payload)
        showSuccess('Etapa actualizada correctamente')
      } else {
        await api.post('/etapas-produccion/', payload)
        showSuccess('Etapa creada correctamente')
      }

      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la etapa'
      setError(message)
      showError('Error al guardar etapa', message)
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {etapaId ? 'Editar Etapa de Producción' : 'Nueva Etapa de Producción'}
                </h2>
                <p className="text-sm text-blue-100">Define o ajusta la etapa del flujo de trabajo productivo</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CardContent className="p-6">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="codigo">
                      Código <span className="text-red-500">*</span>
                    </label>
                  <input
                    id="codigo"
                    value={formState.codigo}
                    onChange={(event) => handleChange('codigo', event.target.value)}
                    placeholder="ETP-001"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="orden">
                      Orden típico <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="orden"
                      type="number"
                      min={1}
                      value={formState.orden_tipico}
                      onChange={(event) => handleChange('orden_tipico', Number(event.target.value))}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="nombre">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nombre"
                    value={formState.nombre}
                    onChange={(event) => handleChange('nombre', event.target.value)}
                    placeholder="Granulación"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="descripcion">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    value={formState.descripcion}
                    onChange={(event) => handleChange('descripcion', event.target.value)}
                    placeholder="Detalle el objetivo de la etapa y actividades principales"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="parametros">
                    Parámetros esperados (JSON)
                  </label>
                  <textarea
                    id="parametros"
                    rows={4}
                    value={formState.parametros_esperados}
                    onChange={(event) => handleChange('parametros_esperados', event.target.value)}
                    placeholder='[
  { "nombre": "Temperatura", "unidad": "°C", "min": 20, "max": 25 }
]'
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Utiliza un arreglo JSON con objetos que describan cada parámetro (nombre, unidad y límites).
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formState.requiere_registro_parametros}
                      onChange={(event) => handleChange('requiere_registro_parametros', event.target.checked)}
                    />
                    Requiere registro de parámetros
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formState.activa}
                      onChange={(event) => handleChange('activa', event.target.checked)}
                    />
                    Etapa activa
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : etapaId ? 'Actualizar Etapa' : 'Crear Etapa'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
