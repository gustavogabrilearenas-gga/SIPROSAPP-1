'use client'

import { useEffect, useState } from 'react'
import { motion } from '@/lib/motion'
import { FileText, Save, X } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Producto } from '@/types/models'
import { stopClickPropagation } from '@/lib/dom'

interface FormulaFormModalProps {
  isOpen: boolean
  onClose: () => void
  formulaId?: number | null
  onSuccess: () => void
}

interface FormState {
  codigo: string
  version: string
  producto: number | ''
  descripcion: string
  activa: boolean
}

const emptyForm: FormState = {
  codigo: '',
  version: '',
  producto: '',
  descripcion: '',
  activa: true,
}

const FormulaFormModal = ({ isOpen, onClose, formulaId, onSuccess }: FormulaFormModalProps) => {
  const [formState, setFormState] = useState<FormState>(emptyForm)
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    void loadProductos()

    if (formulaId) {
      void loadFormula(formulaId)
    } else {
      setFormState(emptyForm)
    }
  }, [formulaId, isOpen])

  const loadProductos = async () => {
    try {
      const response = await api.getProductos({ page_size: 200, activo: true })
      setProductos(response.results ?? [])
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudieron cargar los productos', message)
    }
  }

  const loadFormula = async (id: number) => {
    setIsLoading(true)
    try {
      const data = await api.getFormula(id)
      setFormState({
        codigo: data.codigo ?? '',
        version: data.version ?? '',
        producto: data.producto ?? '',
        descripcion: data.descripcion ?? '',
        activa: Boolean(data.activa),
      })
    } catch (error) {
      const { message } = handleApiError(error)
      showError('Error al cargar la fórmula', message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formState.codigo.trim() || !formState.version.trim() || !formState.producto) {
      showError('Datos incompletos', 'Debe completar código, versión y producto asociado')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        codigo: formState.codigo.trim().toUpperCase(),
        version: formState.version.trim(),
        producto: formState.producto,
        descripcion: formState.descripcion.trim(),
        activa: formState.activa,
      }

      if (formulaId) {
        await api.updateFormula(formulaId, payload)
        showSuccess('Fórmula actualizada correctamente')
      } else {
        await api.createFormula(payload)
        showSuccess('Fórmula creada correctamente')
      }

      onSuccess()
      onClose()
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudo guardar la fórmula', message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={stopClickPropagation}
      >
        <div className="flex items-start justify-between bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              {formulaId ? 'Editar fórmula' : 'Nueva fórmula'}
            </h2>
            <p className="text-sm text-purple-100">Defina la receta maestra vinculada al producto</p>
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

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.codigo}
                onChange={(event) => handleChange('codigo', event.target.value.toUpperCase())}
                placeholder="FML-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Versión <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.version}
                onChange={(event) => handleChange('version', event.target.value)}
                placeholder="1.0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Producto asociado <span className="text-red-500">*</span>
              </label>
              <select
                value={formState.producto}
                onChange={(event) => handleChange('producto', Number(event.target.value) || '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading || isSaving}
              >
                <option value="">Seleccione un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.codigo} — {producto.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={formState.descripcion}
                onChange={(event) => handleChange('descripcion', event.target.value)}
                rows={4}
                placeholder="Notas o alcance de la formulación"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="formula-activa"
                type="checkbox"
                checked={formState.activa}
                onChange={(event) => handleChange('activa', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                disabled={isLoading || isSaving}
              />
              <label htmlFor="formula-activa" className="text-sm text-gray-700">
                Fórmula activa
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isLoading} className="bg-purple-600 text-white hover:bg-purple-700">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : formulaId ? 'Actualizar fórmula' : 'Crear fórmula'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default FormulaFormModal
