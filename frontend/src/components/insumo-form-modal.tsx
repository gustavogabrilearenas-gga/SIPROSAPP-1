'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface InsumoFormModalProps {
  isOpen: boolean
  onClose: () => void
  insumoId?: number | null
  onSuccess: () => void
}

export default function InsumoFormModal({ isOpen, onClose, insumoId, onSuccess }: InsumoFormModalProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: null as number | null,
    unidad_medida: 'kg',
    stock_minimo: 100,
    stock_maximo: 1000,
    punto_reorden: 200,
    requiere_cadena_frio: false,
    requiere_control_lote: true,
    tiempo_vida_util_meses: 12,
    proveedor_principal: '',
    codigo_proveedor: '',
    precio_unitario: '',
    activo: true,
    ficha_tecnica_url: '',
  })
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCategorias()
      if (insumoId) {
        fetchInsumo()
      } else {
        resetForm()
      }
    }
  }, [insumoId, isOpen])

  const fetchCategorias = async () => {
    try {
      const response = await api.get('/categorias-insumo/')
      setCategorias(response.results || response)
    } catch (err) {
      console.error('Error fetching categorias:', err)
    }
  }

  const fetchInsumo = async () => {
    try {
      const data = await api.get(`/insumos/${insumoId}/`)
      setFormData({
        ...data,
        precio_unitario: data.precio_unitario || '',
      })
    } catch (err) {
      console.error('Error fetching insumo:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: null,
      unidad_medida: 'kg',
      stock_minimo: 100,
      stock_maximo: 1000,
      punto_reorden: 200,
      requiere_cadena_frio: false,
      requiere_control_lote: true,
      tiempo_vida_util_meses: 12,
      proveedor_principal: '',
      codigo_proveedor: '',
      precio_unitario: '',
      activo: true,
      ficha_tecnica_url: '',
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
        precio_unitario: formData.precio_unitario ? parseFloat(formData.precio_unitario) : null,
      }

      if (insumoId) {
        await api.updateInsumo(insumoId, payload)
      } else {
        await api.createInsumo(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el insumo')
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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Package className="w-6 h-6" />
                {insumoId ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h2>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.categoria || ''}
                onChange={(e) => setFormData({ ...formData, categoria: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleccione...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="kg, L, unidades"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Máximo</label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_maximo}
                onChange={(e) => setFormData({ ...formData, stock_maximo: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punto de Reorden</label>
              <input
                type="number"
                step="0.01"
                value={formData.punto_reorden}
                onChange={(e) => setFormData({ ...formData, punto_reorden: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vida Útil (meses)</label>
              <input
                type="number"
                value={formData.tiempo_vida_util_meses}
                onChange={(e) => setFormData({ ...formData, tiempo_vida_util_meses: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor Principal</label>
              <input
                type="text"
                value={formData.proveedor_principal}
                onChange={(e) => setFormData({ ...formData, proveedor_principal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código Proveedor</label>
              <input
                type="text"
                value={formData.codigo_proveedor}
                onChange={(e) => setFormData({ ...formData, codigo_proveedor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_unitario}
                onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Ficha Técnica</label>
              <input
                type="url"
                value={formData.ficha_tecnica_url}
                onChange={(e) => setFormData({ ...formData, ficha_tecnica_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_cadena_frio}
                  onChange={(e) => setFormData({ ...formData, requiere_cadena_frio: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Requiere Cadena de Frío</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_control_lote}
                  onChange={(e) => setFormData({ ...formData, requiere_control_lote: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Requiere Control de Lote</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Insumo'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

