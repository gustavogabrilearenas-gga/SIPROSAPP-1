'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { Lote } from '@/types/models'

interface LoteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lote?: Lote | null // Si es null, es modo crear; si tiene datos, es modo editar
}

interface FormData {
  codigo_lote: string
  producto: number | ''
  formula: number | ''
  cantidad_planificada: number | ''
  cantidad_rechazada: number | ''
  unidad: string
  prioridad: string
  fecha_planificada_inicio: string
  fecha_planificada_fin: string
  turno: number | ''
  supervisor: number | ''
  observaciones: string
}

interface Producto {
  id: number
  codigo: string
  nombre: string
  unidad_medida: string
}

interface Turno {
  id: number
  codigo: string
  nombre: string
}

interface Formula {
  id: number
  producto: number
  producto_nombre: string
  version: string
}

export default function LoteFormModal({ isOpen, onClose, onSuccess, lote }: LoteFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    codigo_lote: '',
    producto: '',
    formula: '',
    cantidad_planificada: '',
    cantidad_rechazada: '',
    unidad: '',
    prioridad: 'NORMAL',
    fecha_planificada_inicio: '',
    fecha_planificada_fin: '',
    turno: '',
    supervisor: '',
    observaciones: '',
  })

  const [productos, setProductos] = useState<Producto[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = !!lote

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Sin registro'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return parsed.toLocaleString()
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
      
      // Obtener el usuario actual del token
      let currentUserId: number | '' = ''
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          currentUserId = payload.user_id
        }
      } catch (err) {
        console.error('Error al obtener usuario del token:', err)
      }
      
      if (lote) {
        // Modo edición: cargar datos del lote
        setFormData({
          codigo_lote: lote.codigo_lote,
          producto: lote.producto,
          formula: lote.formula || '',
          cantidad_planificada: lote.cantidad_planificada,
          cantidad_rechazada: lote.cantidad_rechazada || '',
          unidad: lote.unidad,
          prioridad: lote.prioridad,
          // Formato datetime-local: YYYY-MM-DDTHH:mm
          fecha_planificada_inicio: lote.fecha_planificada_inicio ? lote.fecha_planificada_inicio.substring(0, 16) : '',
          fecha_planificada_fin: lote.fecha_planificada_fin ? lote.fecha_planificada_fin.substring(0, 16) : '',
          turno: lote.turno,
          supervisor: lote.supervisor || currentUserId,
          observaciones: lote.observaciones || '',
        })
      } else {
        // Modo creación: usar usuario actual como supervisor por defecto
        setFormData({
          codigo_lote: '',
          producto: '',
          formula: '',
          cantidad_planificada: '',
          cantidad_rechazada: '',
          unidad: '',
          prioridad: 'NORMAL',
          fecha_planificada_inicio: '',
          fecha_planificada_fin: '',
          turno: '',
          supervisor: currentUserId,
          observaciones: '',
        })
      }
      setError(null)
    }
  }, [isOpen, lote])


  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [productosResponse, turnosResponse, formulasResponse] = await Promise.all([
        api.getProductos(),
        api.getTurnos(),
        api.getFormulas(),
      ])
      setProductos(productosResponse.results)
      setTurnos(turnosResponse.results)
      setFormulas(formulasResponse.results)
    } catch (err: any) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar los datos del formulario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    
    // Si cambia el producto, actualizar la unidad y filtrar fórmulas
    if (field === 'producto') {
      const productoSeleccionado = productos.find(p => p.id === value)
      if (productoSeleccionado) {
        setFormData(prev => ({
          ...prev,
          producto: value,
          unidad: productoSeleccionado.unidad_medida || prev.unidad,
          formula: '', // Reset formula when product changes
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos requeridos
      if (!formData.producto || !formData.formula || !formData.turno || !formData.supervisor) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // Preparar datos para enviar
      const dataToSubmit: any = {
        codigo_lote: formData.codigo_lote,
        producto: Number(formData.producto),
        formula: Number(formData.formula),
        cantidad_planificada: Number(formData.cantidad_planificada),
        prioridad: formData.prioridad,
        turno: Number(formData.turno),
        supervisor: Number(formData.supervisor),
        observaciones: formData.observaciones,
        // Enviar fechas con hora exacta (formato: YYYY-MM-DDTHH:mm:ss)
        fecha_planificada_inicio: formData.fecha_planificada_inicio ? formData.fecha_planificada_inicio + ':00' : null,
        fecha_planificada_fin: formData.fecha_planificada_fin ? formData.fecha_planificada_fin + ':00' : null,
      }

      // Agregar cantidades rechazadas solo si tienen valor
      if (formData.cantidad_rechazada !== '') {
        dataToSubmit.cantidad_rechazada = Number(formData.cantidad_rechazada)
      }

      if (isEditMode && lote) {
        await api.updateLote(lote.id, dataToSubmit)
      } else {
        await api.createLote(dataToSubmit)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error al guardar lote:', err)
      
      // Mejorar el mensaje de error
      let errorMessage = 'Error al guardar el lote'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else {
          // Mostrar los errores de validación específicos
          const errores = Object.entries(err.response.data)
            .map(([campo, mensaje]) => `${campo}: ${mensaje}`)
            .join(', ')
          errorMessage = errores || errorMessage
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditMode ? 'Editar Lote' : 'Crear Nuevo Lote'}
                </h2>
                <p className="text-blue-100">
                  {isEditMode ? 'Modifica los datos del lote' : 'Completa la información del nuevo lote'}
                </p>
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
          <div className="p-6 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando datos del formulario...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchData}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información Básica */}
                <Card>
                  <CardHeader>
                    <CardTitle>Información Básica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código de Lote *
                        </label>
                        <input
                          type="text"
                          value={formData.codigo_lote}
                          onChange={(e) => handleInputChange('codigo_lote', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ej: LOTE-2025-001"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Producto *
                        </label>
                        <select
                          value={formData.producto}
                          onChange={(e) => handleInputChange('producto', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Seleccionar producto</option>
                          {productos.map((producto) => (
                            <option key={producto.id} value={producto.id}>
                              {producto.codigo} - {producto.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fórmula *
                        </label>
                        <select
                          value={formData.formula}
                          onChange={(e) => handleInputChange('formula', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={!formData.producto}
                        >
                          <option value="">Seleccionar fórmula</option>
                          {formulas
                            .filter(formula => formula.producto === Number(formData.producto))
                            .map((formula) => (
                              <option key={formula.id} value={formula.id}>
                                {formula.version} - {formula.producto_nombre}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Cantidades Planificadas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cantidad Planificada *
                        </label>
                        <input
                          type="number"
                          value={formData.cantidad_planificada}
                          onChange={(e) => handleInputChange('cantidad_planificada', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unidad
                        </label>
                        <input
                          type="text"
                          value={formData.unidad}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                          placeholder="comprimidos"
                        />
                        <p className="text-xs text-gray-500 mt-1">Definida automáticamente por el producto.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Turno *
                        </label>
                        <select
                          value={formData.turno}
                          onChange={(e) => handleInputChange('turno', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Seleccionar turno</option>
                          {turnos.map((turno) => (
                            <option key={turno.id} value={turno.id}>
                              {turno.codigo} - {turno.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Cantidades Reales (solo lectura excepto rechazos) */}
                    {isEditMode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad Producida
                          </label>
                          <input
                            type="number"
                            value={lote?.cantidad_producida ?? 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente desde las etapas.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad Rechazada
                          </label>
                          <input
                            type="number"
                            value={formData.cantidad_rechazada}
                            onChange={(e) => handleInputChange('cantidad_rechazada', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="0"
                            min="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">Registrar ajustes por calidad si aplica.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Estado y Prioridad */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estado y Prioridad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={isEditMode ? (lote?.estado_display || lote?.estado || 'PLANIFICADO') : 'PLANIFICADO'}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Modificable solo mediante acciones operativas.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridad *
                        </label>
                        <select
                          value={formData.prioridad}
                          onChange={(e) => handleInputChange('prioridad', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="BAJA">Baja</option>
                          <option value="NORMAL">Normal</option>
                          <option value="ALTA">Alta</option>
                          <option value="URGENTE">Urgente</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fechas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cronograma</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha y Hora de Inicio Planificada *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.fecha_planificada_inicio}
                          onChange={(e) => handleInputChange('fecha_planificada_inicio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha y Hora de Fin Planificada *
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.fecha_planificada_fin}
                          onChange={(e) => handleInputChange('fecha_planificada_fin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Fechas Reales (solo lectura) */}
                    {isEditMode && lote && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha y Hora Real de Inicio
                          </label>
                          <input
                            type="text"
                            value={formatDateTime(lote.fecha_real_inicio)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">Se fija al registrar las etapas.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha y Hora Real de Fin
                          </label>
                          <input
                            type="text"
                            value={formatDateTime(lote.fecha_real_fin)}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">Se completa automáticamente al finalizar las etapas.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Observaciones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => handleInputChange('observaciones', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Observaciones adicionales sobre el lote..."
                    />
                  </CardContent>
                </Card>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Actualizar' : 'Crear'} Lote
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
