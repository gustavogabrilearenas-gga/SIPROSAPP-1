'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, FileTextIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FormulaFormModalProps {
  isOpen: boolean
  onClose: () => void
  formulaId?: number | null
  onSuccess: () => void
}

export default function FormulaFormModal({ isOpen, onClose, formulaId, onSuccess }: FormulaFormModalProps) {
  const [formData, setFormData] = useState({
    producto: null as number | null,
    version: '',
    descripcion: '',
    instrucciones: '',
    tiempo_total_minutos: 0,
    temperatura_objetivo: null as number | null,
    humedad_objetivo: null as number | null,
    aprobada: false,
    activa: true,
  })
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadProductos()
      if (formulaId) {
        fetchFormula()
      } else {
        resetForm()
      }
    }
  }, [formulaId, isOpen])

  const loadProductos = async () => {
    try {
      const response = await api.getProductos({ activo: true })
      setProductos(response.results || [])
    } catch (err) {
      console.error('Error loading productos:', err)
    }
  }

  const fetchFormula = async () => {
    try {
      const data = await api.get(`/formulas/${formulaId}/`)
      setFormData({
        producto: data.producto ?? null,
        version: data.version ?? '',
        descripcion: data.descripcion ?? '',
        instrucciones: data.instrucciones ?? '',
        tiempo_total_minutos: data.tiempo_total_minutos ?? 0,
        temperatura_objetivo: data.temperatura_objetivo ?? null,
        humedad_objetivo: data.humedad_objetivo ?? null,
        aprobada: data.aprobada ?? false,
        activa: data.activa ?? true,
      })
    } catch (err) {
      console.error('Error fetching formula:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      producto: null,
      version: '',
      descripcion: '',
      instrucciones: '',
      tiempo_total_minutos: 0,
      temperatura_objetivo: null,
      humedad_objetivo: null,
      aprobada: false,
      activa: true,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        temperatura_objetivo: formData.temperatura_objetivo || null,
        humedad_objetivo: formData.humedad_objetivo || null,
      }

      if (formulaId) {
        await api.put(`/formulas/${formulaId}/`, payload)
      } else {
        await api.post('/formulas/', payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar la fórmula')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FileTextIcon className="w-6 h-6" />
                {formulaId ? 'Editar Fórmula' : 'Nueva Fórmula'}
              </h2>
              <p className="text-purple-100">Complete los datos de la fórmula de producción</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.producto || ''}
                onChange={(e) => setFormData({ ...formData, producto: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.codigo} - {producto.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Versión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versión <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="v1.0"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Descripción de la fórmula"
              />
            </div>

            {/* Instrucciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrucciones <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.instrucciones}
                onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={4}
                placeholder="Instrucciones detalladas de producción"
              />
            </div>

            {/* Tiempo Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo Total (minutos) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.tiempo_total_minutos}
                onChange={(e) => setFormData({ ...formData, tiempo_total_minutos: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Temperatura Objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperatura Objetivo (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperatura_objetivo || ''}
                onChange={(e) => setFormData({ ...formData, temperatura_objetivo: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="25.0"
              />
            </div>

            {/* Humedad Objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Humedad Objetivo (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.humedad_objetivo || ''}
                onChange={(e) => setFormData({ ...formData, humedad_objetivo: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="60.0"
              />
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.aprobada}
                  onChange={(e) => setFormData({ ...formData, aprobada: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-700">Aprobada</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="text-sm font-medium text-gray-700">Activa</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Fórmula'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
