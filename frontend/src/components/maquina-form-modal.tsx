'use client'

import { useState, useEffect } from 'react'
import { motion } from '@/lib/motion'
import { X, Save, Settings } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { stopClickPropagation } from '@/lib/dom'
import type { Maquina, Ubicacion } from '@/types/models'

interface MaquinaFormModalProps {
  isOpen: boolean
  onClose: () => void
  maquinaId?: number | null
  onSuccess: () => void
}

export default function MaquinaFormModal({ isOpen, onClose, maquinaId, onSuccess }: MaquinaFormModalProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'COMPRESION',
    fabricante: '',
    modelo: '',
    numero_serie: '',
    año_fabricacion: new Date().getFullYear(),
    ubicacion: null as number | null,
    descripcion: '',
    capacidad_nominal: '',
    unidad_capacidad: '',
    activa: true,
    requiere_calificacion: false,
    fecha_instalacion: '',
  })
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUbicaciones()
      if (maquinaId) {
        fetchMaquina()
      } else {
        resetForm()
      }
    }
  }, [maquinaId, isOpen])

  const fetchUbicaciones = async () => {
    try {
      const response = await api.getUbicaciones()
      setUbicaciones(Array.isArray(response?.results) ? response.results : [])
    } catch (err) {
      console.error('Error fetching ubicaciones:', err)
    }
  }

  const fetchMaquina = async () => {
    try {
      if (!maquinaId) return
      const data: Maquina = await api.getMaquina(maquinaId)
      setFormData(prev => ({
        ...prev,
        codigo: data.codigo ?? '',
        nombre: data.nombre ?? '',
        tipo: data.tipo ?? 'COMPRESION',
        fabricante: data.fabricante ?? '',
        modelo: data.modelo ?? '',
        numero_serie: data.numero_serie ?? '',
        año_fabricacion: data.año_fabricacion ?? new Date().getFullYear(),
        ubicacion: data.ubicacion,
        descripcion: data.descripcion ?? '',
        capacidad_nominal: data.capacidad_nominal ?? '',
        unidad_capacidad: data.unidad_capacidad ?? '',
        activa: data.activa ?? true,
        requiere_calificacion: data.requiere_calificacion ?? false,
        fecha_instalacion: data.fecha_instalacion ?? '',
      }))
    } catch (err) {
      console.error('Error fetching maquina:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'COMPRESION',
      fabricante: '',
      modelo: '',
      numero_serie: '',
      año_fabricacion: new Date().getFullYear(),
      ubicacion: null,
      descripcion: '',
      capacidad_nominal: '',
      unidad_capacidad: '',
      activa: true,
      requiere_calificacion: false,
      fecha_instalacion: '',
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
        capacidad_nominal: formData.capacidad_nominal ? parseFloat(formData.capacidad_nominal) : null,
      }

      if (maquinaId) {
        await api.updateMaquina(maquinaId, payload)
      } else {
        await api.createMaquina(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar la máquina')
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
        onClick={stopClickPropagation}
      >
        <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                {maquinaId ? 'Editar Máquina' : 'Nueva Máquina'}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              >
                <option value="COMPRESION">Compresión</option>
                <option value="MEZCLADO">Mezclado</option>
                <option value="GRANULACION">Granulación</option>
                <option value="EMBLISTADO">Emblistado</option>
                <option value="SERVICIOS">Servicios</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              >
                <option value="">Seleccione...</option>
                {ubicaciones.map(ub => (
                  <option key={ub.id} value={ub.id}>{ub.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fabricante</label>
              <input
                type="text"
                value={formData.fabricante}
                onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de Serie</label>
              <input
                type="text"
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Año de Fabricación</label>
              <input
                type="number"
                value={formData.año_fabricacion}
                onChange={(e) => setFormData({ ...formData, año_fabricacion: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad Nominal</label>
              <input
                type="number"
                step="0.01"
                value={formData.capacidad_nominal}
                onChange={(e) => setFormData({ ...formData, capacidad_nominal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unidad de Capacidad</label>
              <input
                type="text"
                value={formData.unidad_capacidad}
                onChange={(e) => setFormData({ ...formData, unidad_capacidad: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
                placeholder="ej: kg/hora"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Instalación</label>
              <input
                type="date"
                value={formData.fecha_instalacion}
                onChange={(e) => setFormData({ ...formData, fecha_instalacion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiere_calificacion}
                  onChange={(e) => setFormData({ ...formData, requiere_calificacion: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Requiere Calificación</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Activa</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Máquina'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

