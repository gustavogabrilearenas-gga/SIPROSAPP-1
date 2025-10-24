
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Save, X } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Parametro } from '@/types/models'

interface ParametroFormModalProps {
  isOpen: boolean
  onClose: () => void
  parametroId?: number | null
  onSuccess: () => void
}

interface FormState {
  codigo: string
  nombre: string
  descripcion: string
  unidad: string
  activo: boolean
}

export default function ParametroFormModal ({
  isOpen,
  onClose,
  parametroId = null,
  onSuccess,
}: ParametroFormModalProps) {
  const [form, setForm] = useState<FormState>({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad: '',
    activo: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (parametroId) {
        setLoading(true)
        try {
          const { data } = await api.getParametro(parametroId)
          setForm({
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion,
            unidad: data.unidad,
            activo: data.activo,
          })
        } catch (err) {
          showError('Error', handleApiError(err).message)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [parametroId])

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      parametroId
        ? await api.updateParametro(parametroId, form)
        : await api.createParametro(form)
      showSuccess('Éxito', 'El parámetro se ha guardado correctamente.')
      onSuccess()
      onClose()
    } catch (err) {
      showError('Error', handleApiError(err).message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            <SlidersHorizontal className="mr-2 inline-block h-5 w-5" />
            {parametroId ? 'Editar Parámetro' : 'Nuevo Parámetro'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Código"
            value={form.codigo}
            onChange={(e) => handleChange('codigo', e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            className="input input-bordered w-full"
          />
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            className="textarea textarea-bordered w-full"
          />
          <input
            type="text"
            placeholder="Unidad (ej: °C)"
            value={form.unidad}
            onChange={(e) => handleChange('unidad', e.target.value)}
            className="input input-bordered w-full"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => handleChange('activo', e.target.checked)}
              className="checkbox"
            />
            <span>Activo</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Save className="animate-spin" /> : <Save />}
            Guardar
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
