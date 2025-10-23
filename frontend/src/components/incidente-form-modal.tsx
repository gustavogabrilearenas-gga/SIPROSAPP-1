'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Save } from 'lucide-react'
import { motion, AnimatePresence } from '@/lib/motion'
import { stopClickPropagation } from '@/lib/dom'
import { Incidente, Ubicacion, Maquina, LoteListItem, User } from '@/types/models'
import { api } from '@/lib/api'

interface IncidenteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  incidente?: Incidente | null
}

interface TipoIncidente {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
}

export default function IncidenteFormModal({ isOpen, onClose, onSuccess, incidente }: IncidenteFormModalProps) {
  const [formData, setFormData] = useState({
    tipo: '',
    severidad: 'MODERADA',
    estado: 'ABIERTO',
    titulo: '',
    descripcion: '',
    fecha_ocurrencia: '',
    ubicacion: '',
    maquina: '',
    lote_afectado: '',
    asignado_a: '',
    impacto_produccion: '',
    impacto_calidad: '',
    impacto_seguridad: '',
    requiere_notificacion_anmat: false,
  })

  const [tipos, setTipos] = useState<TipoIncidente[]>([])
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [lotes, setLotes] = useState<LoteListItem[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadCatalogData()
      if (incidente) {
        // Modo edición
        setFormData({
          tipo: incidente.tipo?.toString() || '',
          severidad: incidente.severidad || 'MODERADA',
          estado: incidente.estado || 'ABIERTO',
          titulo: incidente.titulo || '',
          descripcion: incidente.descripcion || '',
          fecha_ocurrencia: incidente.fecha_ocurrencia ? formatDateTimeForInput(incidente.fecha_ocurrencia) : '',
          ubicacion: incidente.ubicacion?.toString() || '',
          maquina: incidente.maquina?.toString() || '',
          lote_afectado: incidente.lote_afectado?.toString() || '',
          asignado_a: incidente.asignado_a?.toString() || '',
          impacto_produccion: incidente.impacto_produccion || '',
          impacto_calidad: incidente.impacto_calidad || '',
          impacto_seguridad: incidente.impacto_seguridad || '',
          requiere_notificacion_anmat: incidente.requiere_notificacion_anmat || false,
        })
      } else {
        // Modo creación - resetear formulario
        const now = new Date()
        setFormData({
          tipo: '',
          severidad: 'MODERADA',
          estado: 'ABIERTO',
          titulo: '',
          descripcion: '',
          fecha_ocurrencia: formatDateTimeForInput(now.toISOString()),
          ubicacion: '',
          maquina: '',
          lote_afectado: '',
          asignado_a: '',
          impacto_produccion: '',
          impacto_calidad: '',
          impacto_seguridad: '',
          requiere_notificacion_anmat: false,
        })
      }
    }
  }, [isOpen, incidente])

  const formatDateTimeForInput = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const loadCatalogData = async () => {
    setCatalogLoading(true)
    try {
      const [tiposData, ubicacionesData, maquinasData, lotesData, usuariosData] = await Promise.all([
        api.get('/incidencias/tipos-incidente/'),
        api.getUbicaciones(),
        api.getMaquinas(),
        api.getLotes(),
        api.getUsuarios(),
      ])

      if (Array.isArray((tiposData as any)?.results)) {
        setTipos((tiposData as any).results)
      } else if (Array.isArray(tiposData as any)) {
        setTipos(tiposData as any)
      } else {
        setTipos([])
      }
      setUbicaciones(Array.isArray(ubicacionesData?.results) ? ubicacionesData.results : [])
      setMaquinas(Array.isArray(maquinasData?.results) ? maquinasData.results : [])
      setLotes(Array.isArray(lotesData?.results) ? lotesData.results : [])
      setUsuarios(Array.isArray(usuariosData?.results) ? usuariosData.results : [])
    } catch (err) {
      console.error('Error loading catalog data:', err)
    } finally {
      setCatalogLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!formData.tipo) {
        throw new Error('Debe seleccionar un tipo de incidente')
      }
      if (!formData.titulo.trim()) {
        throw new Error('El título es obligatorio')
      }
      if (!formData.descripcion.trim()) {
        throw new Error('La descripción es obligatoria')
      }
      if (!formData.fecha_ocurrencia) {
        throw new Error('La fecha de ocurrencia es obligatoria')
      }
      if (!formData.ubicacion) {
        throw new Error('La ubicación es obligatoria')
      }

      // Preparar datos para enviar
      const dataToSend: any = {
        tipo: parseInt(formData.tipo),
        severidad: formData.severidad,
        estado: formData.estado,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_ocurrencia: formData.fecha_ocurrencia + ':00',
        ubicacion: parseInt(formData.ubicacion),
        requiere_notificacion_anmat: formData.requiere_notificacion_anmat,
      }

      // Campos opcionales
      if (formData.maquina) {
        dataToSend.maquina = parseInt(formData.maquina)
      }
      if (formData.lote_afectado) {
        dataToSend.lote_afectado = parseInt(formData.lote_afectado)
      }
      if (formData.asignado_a) {
        dataToSend.asignado_a = parseInt(formData.asignado_a)
      }
      if (formData.impacto_produccion.trim()) {
        dataToSend.impacto_produccion = formData.impacto_produccion.trim()
      }
      if (formData.impacto_calidad.trim()) {
        dataToSend.impacto_calidad = formData.impacto_calidad.trim()
      }
      if (formData.impacto_seguridad.trim()) {
        dataToSend.impacto_seguridad = formData.impacto_seguridad.trim()
      }

      if (incidente) {
        // Actualizar incidente existente
        await api.updateIncidente(incidente.id, dataToSend)
      } else {
        // Crear nuevo incidente
        await api.createIncidente(dataToSend)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving incidente:', err)
      setError(err.message || err.response?.data?.detail || 'Error al guardar el incidente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={stopClickPropagation}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-7 h-7" />
                {incidente ? 'Editar Incidente' : 'Nuevo Incidente'}
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Incidente <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar tipo...</option>
                      {tipos.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severidad <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.severidad}
                      onChange={(e) => setFormData({ ...formData, severidad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="MENOR">Menor</option>
                      <option value="MODERADA">Moderada</option>
                      <option value="MAYOR">Mayor</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="ABIERTO">Abierto</option>
                      <option value="EN_INVESTIGACION">En Investigación</option>
                      <option value="ACCION_CORRECTIVA">Acción Correctiva</option>
                      <option value="CERRADO">Cerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Ocurrencia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_ocurrencia}
                      onChange={(e) => setFormData({ ...formData, fecha_ocurrencia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Título breve del incidente"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                    placeholder="Descripción detallada del incidente"
                    required
                  />
                </div>

                {/* Ubicación y Relaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar ubicación...</option>
                      {ubicaciones.map((ub) => (
                        <option key={ub.id} value={ub.id}>
                          {ub.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máquina (opcional)
                    </label>
                    <select
                      value={formData.maquina}
                      onChange={(e) => setFormData({ ...formData, maquina: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Ninguna</option>
                      {maquinas.map((maq) => (
                        <option key={maq.id} value={maq.id}>
                          {maq.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lote Afectado (opcional)
                    </label>
                    <select
                      value={formData.lote_afectado}
                      onChange={(e) => setFormData({ ...formData, lote_afectado: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Ninguno</option>
                      {lotes.map((lote) => (
                        <option key={lote.id} value={lote.id}>
                          {lote.codigo_lote}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asignado A (opcional)
                    </label>
                    <select
                      value={formData.asignado_a}
                      onChange={(e) => setFormData({ ...formData, asignado_a: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Sin asignar</option>
                      {usuarios.map((usuario) => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.full_name || usuario.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Impactos */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Análisis de Impactos</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impacto en Producción
                    </label>
                    <textarea
                      value={formData.impacto_produccion}
                      onChange={(e) => setFormData({ ...formData, impacto_produccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describir el impacto en la producción..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impacto en Calidad
                    </label>
                    <textarea
                      value={formData.impacto_calidad}
                      onChange={(e) => setFormData({ ...formData, impacto_calidad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describir el impacto en la calidad..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impacto en Seguridad
                    </label>
                    <textarea
                      value={formData.impacto_seguridad}
                      onChange={(e) => setFormData({ ...formData, impacto_seguridad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={2}
                      placeholder="Describir el impacto en la seguridad..."
                    />
                  </div>
                </div>

                {/* ANMAT */}
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <input
                    type="checkbox"
                    id="requiere_anmat"
                    checked={formData.requiere_notificacion_anmat}
                    onChange={(e) => setFormData({ ...formData, requiere_notificacion_anmat: e.target.checked })}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="requiere_anmat" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Requiere Notificación a ANMAT
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {incidente ? 'Actualizar' : 'Crear'} Incidente
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
