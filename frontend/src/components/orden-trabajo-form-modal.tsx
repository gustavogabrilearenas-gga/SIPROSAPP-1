'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Wrench, 
  Save, 
  Loader2,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth-store'
import type { OrdenTrabajo, OrdenTrabajoListItem, TipoMantenimiento, Maquina } from '@/types/models'

interface OrdenTrabajoFormModalProps {
  orden: OrdenTrabajoListItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function OrdenTrabajoFormModal({ 
  orden, 
  isOpen, 
  onClose, 
  onUpdate 
}: OrdenTrabajoFormModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: '',
    maquina: '',
    prioridad: 'NORMAL' as 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE',
    estado: 'ABIERTA' as 'ABIERTA' | 'ASIGNADA' | 'EN_PROCESO' | 'PAUSADA' | 'COMPLETADA' | 'CANCELADA',
    titulo: '',
    descripcion: '',
    fecha_planificada: '',
    asignada_a: '',
    trabajo_realizado: '',
    observaciones: '',
    requiere_parada_produccion: false,
    costo_estimado: '',
    costo_real: ''
  })

  // Datos de catálogos
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      loadCatalogData()
      if (orden) {
        // Modo edición - cargar datos completos de la orden
        loadOrdenData(orden.id)
      } else {
        // Modo creación
        setFormData({
          codigo: '',
          tipo: '',
          maquina: '',
          prioridad: 'NORMAL',
          estado: 'ABIERTA',
          titulo: '',
          descripcion: '',
          fecha_planificada: '',
          asignada_a: '',
          trabajo_realizado: '',
          observaciones: '',
          requiere_parada_produccion: false,
          costo_estimado: '',
          costo_real: ''
        })
      }
    }
  }, [isOpen, orden])

  const loadOrdenData = async (ordenId: number) => {
    try {
      const ordenCompleta = await api.getOrdenTrabajo(ordenId)
      setFormData({
        codigo: ordenCompleta.codigo,
        tipo: ordenCompleta.tipo.toString(),
        maquina: ordenCompleta.maquina.toString(),
        prioridad: ordenCompleta.prioridad,
        estado: ordenCompleta.estado,
        titulo: ordenCompleta.titulo,
        descripcion: ordenCompleta.descripcion || '',
        fecha_planificada: ordenCompleta.fecha_planificada ? new Date(ordenCompleta.fecha_planificada).toISOString().slice(0, 16) : '',
        asignada_a: ordenCompleta.asignada_a ? ordenCompleta.asignada_a.toString() : '',
        trabajo_realizado: ordenCompleta.trabajo_realizado || '',
        observaciones: ordenCompleta.observaciones || '',
        requiere_parada_produccion: ordenCompleta.requiere_parada_produccion,
        costo_estimado: ordenCompleta.costo_estimado ? ordenCompleta.costo_estimado.toString() : '',
        costo_real: ordenCompleta.costo_real ? ordenCompleta.costo_real.toString() : ''
      })
    } catch (err: any) {
      console.error('Error al cargar datos de la orden:', err)
      setError('Error al cargar los datos de la orden')
    }
  }

  const loadCatalogData = async () => {
    setIsLoading(true)
    try {
      const [tiposData, maquinasData, usuariosData] = await Promise.all([
        api.getTiposMantenimiento(),
        api.getMaquinas(),
        api.getUsuarios()
      ])
      
      // Asegurar que los datos sean arrays
      setTiposMantenimiento(Array.isArray(tiposData) ? tiposData : [])
      setMaquinas(Array.isArray(maquinasData?.results) ? maquinasData.results : [])
      setUsuarios(Array.isArray(usuariosData?.results) ? usuariosData.results : [])
    } catch (err: any) {
      console.error('Error al cargar datos de catálogos:', err)
      setError('Error al cargar los datos necesarios')
      // Inicializar arrays vacíos en caso de error
      setTiposMantenimiento([])
      setMaquinas([])
      setUsuarios([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const dataToSend: any = {
        ...formData,
        tipo: parseInt(formData.tipo),
        maquina: parseInt(formData.maquina),
        asignada_a: formData.asignada_a ? parseInt(formData.asignada_a) : null,
        fecha_planificada: formData.fecha_planificada ? new Date(formData.fecha_planificada).toISOString() : null,
        costo_estimado: formData.costo_estimado ? parseFloat(formData.costo_estimado) : null,
        costo_real: formData.costo_real ? parseFloat(formData.costo_real) : null,
      }

      // No enviar el código cuando estamos editando (es único y no se puede cambiar)
      if (isEditMode) {
        delete dataToSend.codigo
      }

      if (orden) {
        // Editar orden existente
        await api.updateOrdenTrabajo(orden.id, dataToSend)
      } else {
        // Crear nueva orden
        await api.createOrdenTrabajo(dataToSend)
      }

      onUpdate()
      onClose()
    } catch (err: any) {
      console.error('Error al guardar orden de trabajo:', err)
      setError(err.response?.data?.error || 'Error al guardar la orden de trabajo')
    } finally {
      setIsSaving(false)
    }
  }

  const isEditMode = !!orden

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wrench className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isEditMode ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
                    </h2>
                    <p className="text-blue-100">
                      {isEditMode ? orden.codigo : 'Crear nueva orden de mantenimiento'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Cargando datos...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadCatalogData}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Básica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Información Básica</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código *
                          </label>
                          <input
                            type="text"
                            value={formData.codigo}
                            onChange={(e) => handleInputChange('codigo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                            required
                            disabled={isEditMode}
                            readOnly={isEditMode}
                          />
                          {isEditMode && (
                            <p className="text-xs text-gray-500 mt-1">
                              El código no se puede modificar en órdenes existentes
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título *
                          </label>
                          <input
                            type="text"
                            value={formData.titulo}
                            onChange={(e) => handleInputChange('titulo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Mantenimiento *
                          </label>
                          <select
                            value={formData.tipo}
                            onChange={(e) => handleInputChange('tipo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Seleccionar tipo</option>
                            {tiposMantenimiento.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.codigo} - {tipo.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Máquina *
                          </label>
                          <select
                            value={formData.maquina}
                            onChange={(e) => handleInputChange('maquina', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Seleccionar máquina</option>
                            {maquinas.map((maquina) => (
                              <option key={maquina.id} value={maquina.id}>
                                {maquina.codigo} - {maquina.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prioridad
                          </label>
                          <select
                            value={formData.prioridad}
                            onChange={(e) => handleInputChange('prioridad', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="BAJA">Baja</option>
                            <option value="NORMAL">Normal</option>
                            <option value="ALTA">Alta</option>
                            <option value="URGENTE">Urgente</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <select
                            value={formData.estado}
                            onChange={(e) => handleInputChange('estado', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="ABIERTA">Abierta</option>
                            <option value="ASIGNADA">Asignada</option>
                            <option value="EN_PROCESO">En Proceso</option>
                            <option value="PAUSADA">Pausada</option>
                            <option value="COMPLETADA">Completada</option>
                            <option value="CANCELADA">Cancelada</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción *
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange('descripcion', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fechas y Asignación */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Fechas y Asignación</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha Planificada
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.fecha_planificada}
                            onChange={(e) => handleInputChange('fecha_planificada', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Asignada a
                          </label>
                          <select
                            value={formData.asignada_a}
                            onChange={(e) => handleInputChange('asignada_a', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Sin asignar</option>
                            {usuarios.map((usuario) => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.first_name} {usuario.last_name} ({usuario.username})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Costos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>Costos</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo Estimado
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.costo_estimado}
                            onChange={(e) => handleInputChange('costo_estimado', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo Real
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.costo_real}
                            onChange={(e) => handleInputChange('costo_real', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="requiere_parada"
                          checked={formData.requiere_parada_produccion}
                          onChange={(e) => handleInputChange('requiere_parada_produccion', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requiere_parada" className="text-sm font-medium text-gray-700">
                          Requiere parada de producción
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trabajo Realizado y Observaciones */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Detalles Adicionales</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Trabajo Realizado
                        </label>
                        <textarea
                          value={formData.trabajo_realizado}
                          onChange={(e) => handleInputChange('trabajo_realizado', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descripción del trabajo realizado..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observaciones
                        </label>
                        <textarea
                          value={formData.observaciones}
                          onChange={(e) => handleInputChange('observaciones', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Observaciones adicionales..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 border-t flex-shrink-0">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Actualizar' : 'Crear'} Orden
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
