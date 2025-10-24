
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users2, Save, X } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Funcion } from '@/types/models'

interface FuncionFormModalProps {
  isOpen: boolean
  onClose: () => void
  funcionId?: number | null
  onSuccess: () => void
}

interface FormState {
  codigo: string
  nombre: string
  descripcion: string
  activa: boolean
}

export default function FuncionFormModal ({
  isOpen,
  onClose,
  funcionId = null,
  onSuccess,
}: FuncionFormModalProps) {
  const [form, setForm] = useState<FormState>({
    codigo: '',
    nombre: '',
    descripcion: '',
    activa: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (funcionId) {
        setLoading(true)
        try {
          const { data } = await api.getFuncion(funcionId)
          setForm({
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion,
            activa: data.activa,
          })
        } catch (err) {
          showError('Error', handleApiError(err).message)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [funcionId])

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setForm({ ...form, [field]: value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      funcionId
        ? await api.updateFuncion(funcionId, form)
        : await api.createFuncion(form)
      showSuccess('Éxito', 'La función se ha guardado correctamente.')
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
            <Users2 className="mr-2 inline-block h-5 w-5" />
            {funcionId ? 'Editar Función' : 'Nueva Función'}
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
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => handleChange('activa', e.target.checked)}
              className="checkbox"
            />
            <span>Activa</span>
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
