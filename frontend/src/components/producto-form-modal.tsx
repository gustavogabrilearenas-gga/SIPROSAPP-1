'use client'

import { useState, useEffect } from 'react'
import { motion } from '@/lib/motion'
import { X, Save, Package } from '@/lib/icons'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProductoFormModalProps {
  isOpen: boolean
  onClose: () => void
  productoId?: number | null
  onSuccess: () => void
}

export default function ProductoFormModal({ isOpen, onClose, productoId, onSuccess }: ProductoFormModalProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    forma_farmaceutica: 'COMPRIMIDO',
    principio_activo: '',
    concentracion: '',
    unidad_medida: 'comprimidos',
    lote_minimo: 1000,
    lote_optimo: 5000,
    tiempo_vida_util_meses: 24,
    requiere_cadena_frio: false,
    registro_anmat: '',
    activo: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (productoId) {
      fetchProducto()
    } else {
      resetForm()
    }
  }, [productoId, isOpen])

  const fetchProducto = async () => {
    try {
      const data = await api.get(`/productos/${productoId}/`)
      setFormData(data)
    } catch (err) {
      console.error('Error fetching producto:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      forma_farmaceutica: 'COMPRIMIDO',
      principio_activo: '',
      concentracion: '',
      unidad_medida: 'comprimidos',
      lote_minimo: 1000,
      lote_optimo: 5000,
      tiempo_vida_util_meses: 24,
      requiere_cadena_frio: false,
      registro_anmat: '',
      activo: true,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (productoId) {
        await api.updateProducto(productoId, formData)
      } else {
        await api.createProducto(formData)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el producto')
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Package className="w-6 h-6" />
                {productoId ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-blue-100">Complete los datos del producto farmacéutico</p>
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
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="PROD-001"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ibuprofeno 600mg"
              />
            </div>

            {/* Forma Farmacéutica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma Farmacéutica <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.forma_farmaceutica}
                onChange={(e) => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="COMPRIMIDO">Comprimido</option>
                <option value="CREMA">Crema</option>
                <option value="SOLUCION">Solución</option>
              </select>
            </div>

            {/* Principio Activo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principio Activo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.principio_activo}
                onChange={(e) => setFormData({ ...formData, principio_activo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ibuprofeno"
              />
            </div>

            {/* Concentración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concentración <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.concentracion}
                onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="600mg"
              />
            </div>

            {/* Unidad de Medida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="comprimidos, gramos, ml"
              />
            </div>

            {/* Lote Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.lote_minimo}
                onChange={(e) => setFormData({ ...formData, lote_minimo: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Lote Óptimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lote Óptimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.lote_optimo}
                onChange={(e) => setFormData({ ...formData, lote_optimo: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vida Útil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vida Útil (meses) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.tiempo_vida_util_meses}
                onChange={(e) => setFormData({ ...formData, tiempo_vida_util_meses: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Registro ANMAT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registro ANMAT
              </label>
              <input
                type="text"
                value={formData.registro_anmat}
                onChange={(e) => setFormData({ ...formData, registro_anmat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 12345"
              />
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_cadena_frio}
                  onChange={(e) => setFormData({ ...formData, requiere_cadena_frio: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Requiere Cadena de Frío</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

