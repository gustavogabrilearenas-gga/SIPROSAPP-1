'use client'

import { useEffect, useState } from 'react'
import { motion } from '@/lib/motion'
import { Package, Save, X } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/components/common/toast-utils'
import { stopClickPropagation } from '@/lib/dom'

interface ProductoFormModalProps {
  isOpen: boolean
  onClose: () => void
  productoId?: number | null
  onSuccess: () => void
}

interface FormState {
  codigo: string
  nombre: string
  tipo: string
  presentacion: string
  concentracion: string
  descripcion: string
  activo: boolean
}

const tipoOptions: Array<{ value: string; label: string }> = [
  { value: 'COMPRIMIDO', label: 'Comprimido' },
  { value: 'CAPSULA', label: 'Cápsula' },
  { value: 'JARABE', label: 'Jarabe' },
  { value: 'INYECTABLE', label: 'Inyectable' },
  { value: 'CREMA', label: 'Crema' },
]

const presentacionOptions: Array<{ value: string; label: string }> = [
  { value: 'BLISTER', label: 'Blíster' },
  { value: 'FRASCO', label: 'Frasco' },
  { value: 'POMO', label: 'Pomo' },
  { value: 'AMPOLLA', label: 'Ampolla' },
  { value: 'SOBRE', label: 'Sobre' },
]

const emptyForm: FormState = {
  codigo: '',
  nombre: '',
  tipo: 'COMPRIMIDO',
  presentacion: 'BLISTER',
  concentracion: '',
  descripcion: '',
  activo: true,
}

const ProductoFormModal = ({ isOpen, onClose, productoId, onSuccess }: ProductoFormModalProps) => {
  const [formState, setFormState] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (productoId) {
      void loadProducto(productoId)
    } else {
      setFormState(emptyForm)
    }
  }, [isOpen, productoId])

  const loadProducto = async (id: number) => {
    setIsLoading(true)
    try {
      const data = await api.getProducto(id)
      setFormState({
        codigo: data.codigo ?? '',
        nombre: data.nombre ?? '',
        tipo: data.tipo ?? 'COMPRIMIDO',
        presentacion: data.presentacion ?? 'BLISTER',
        concentracion: data.concentracion ?? '',
        descripcion: data.descripcion ?? '',
        activo: Boolean(data.activo),
      })
    } catch (error) {
      const { message } = handleApiError(error)
      showError('Error al cargar producto', message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.codigo.trim() || !formState.nombre.trim()) {
      showError('Datos incompletos', 'Debe completar el código y el nombre del producto')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        codigo: formState.codigo.trim().toUpperCase(),
        nombre: formState.nombre.trim(),
        tipo: formState.tipo,
        presentacion: formState.presentacion,
        concentracion: formState.concentracion.trim(),
        descripcion: formState.descripcion.trim(),
        activo: formState.activo,
      }

      if (productoId) {
        await api.updateProducto(productoId, payload)
        showSuccess('Producto actualizado correctamente')
      } else {
        await api.createProducto(payload)
        showSuccess('Producto creado correctamente')
      }

      onSuccess()
      onClose()
    } catch (error) {
      const { message } = handleApiError(error)
      showError('No se pudo guardar el producto', message)
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
        <div className="flex items-start justify-between bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-4 text-white">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5" />
              {productoId ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-sm text-blue-100">Complete la información básica del catálogo</p>
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
                placeholder="PRD-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.nombre}
                onChange={(event) => handleChange('nombre', event.target.value)}
                placeholder="Ibuprofeno 600mg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo farmacéutico</label>
              <select
                value={formState.tipo}
                onChange={(event) => handleChange('tipo', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Presentación</label>
              <select
                value={formState.presentacion}
                onChange={(event) => handleChange('presentacion', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              >
                {presentacionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Concentración <span className="text-red-500">*</span>
              </label>
              <input
                value={formState.concentracion}
                onChange={(event) => handleChange('concentracion', event.target.value)}
                placeholder="600 mg"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={formState.descripcion}
                onChange={(event) => handleChange('descripcion', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales sobre el producto"
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="producto-activo"
                type="checkbox"
                checked={formState.activo}
                onChange={(event) => handleChange('activo', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading || isSaving}
              />
              <label htmlFor="producto-activo" className="text-sm text-gray-700">
                Producto activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : productoId ? 'Actualizar producto' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ProductoFormModal
