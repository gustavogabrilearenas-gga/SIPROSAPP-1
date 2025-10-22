'use client'

import { useState, useEffect } from 'react'
import { X, User, Save, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { UsuarioDetalle } from '@/types/models'
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface UsuarioFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  usuario?: UsuarioDetalle | null
}

export default function UsuarioFormModal({ isOpen, onClose, onSuccess, usuario }: UsuarioFormModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirmacion: '',
    is_staff: false,
    is_superuser: false,
    legajo: '',
    area: '',
    turno_habitual: '',
    telefono: '',
    fecha_ingreso: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        // Modo edición
        setFormData({
          username: usuario.username || '',
          email: usuario.email || '',
          first_name: usuario.first_name || '',
          last_name: usuario.last_name || '',
          password: '',
          password_confirmacion: '',
          is_staff: usuario.is_staff || false,
          is_superuser: usuario.is_superuser || false,
          legajo: usuario.legajo || '',
          area: usuario.area || '',
          turno_habitual: usuario.turno_habitual || '',
          telefono: usuario.telefono || '',
          fecha_ingreso: usuario.fecha_ingreso || '',
        })
      } else {
        // Modo creación - resetear formulario
        setFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          password_confirmacion: '',
          is_staff: false,
          is_superuser: false,
          legajo: '',
          area: '',
          turno_habitual: '',
          telefono: '',
          fecha_ingreso: '',
        })
      }
      setError(null)
    }
  }, [isOpen, usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validaciones
      if (!formData.username.trim()) {
        throw new Error('El nombre de usuario es obligatorio')
      }
      if (!formData.email.trim()) {
        throw new Error('El email es obligatorio')
      }
      if (!formData.first_name.trim()) {
        throw new Error('El nombre es obligatorio')
      }
      if (!formData.last_name.trim()) {
        throw new Error('El apellido es obligatorio')
      }

      if (!usuario) {
        // En modo creación, la contraseña es obligatoria
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria')
        }
        if (formData.password.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres')
        }
        if (formData.password !== formData.password_confirmacion) {
          throw new Error('Las contraseñas no coinciden')
        }
      } else {
        // En modo edición, solo validar si se proporciona contraseña
        if (formData.password && formData.password.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres')
        }
        if (formData.password && formData.password !== formData.password_confirmacion) {
          throw new Error('Las contraseñas no coinciden')
        }
      }

      // Preparar datos para enviar
      const dataToSend: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        is_staff: formData.is_staff,
        is_superuser: formData.is_superuser,
        legajo: formData.legajo.trim(),
        area: formData.area,
        turno_habitual: formData.turno_habitual,
        telefono: formData.telefono.trim(),
      }

      if (formData.fecha_ingreso) {
        dataToSend.fecha_ingreso = formData.fecha_ingreso
      }

      if (!usuario) {
        // Solo enviar contraseña en modo creación
        dataToSend.password = formData.password
        dataToSend.password_confirmacion = formData.password_confirmacion
      }

      if (usuario) {
        await api.updateUsuario(usuario.id, dataToSend)
        toast({
          title: 'Usuario actualizado',
          description: `Se guardaron los cambios de ${usuario.username}`,
        })
      } else {
        await api.createUsuario(dataToSend)
        toast({
          title: 'Usuario creado',
          description: `Se creó el usuario ${dataToSend.username}`,
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      const message = err?.message || 'Error al guardar el usuario'
      toast({
        title: 'No se pudo guardar',
        description: message,
        variant: 'destructive',
      })
      setError(message)
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
          className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-7 h-7" />
                {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
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
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Información de Cuenta */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información de Cuenta</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de Usuario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="usuario123"
                      required
                      disabled={!!usuario} // No permitir cambiar username en edición
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Juan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                {/* Contraseña solo en creación o si se desea cambiar */}
                {!usuario && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Contraseña <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswordConfirm ? 'text' : 'password'}
                          value={formData.password_confirmacion}
                          onChange={(e) => setFormData({ ...formData, password_confirmacion: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Repetir contraseña"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Permisos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Permisos</h3>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_staff"
                      checked={formData.is_staff}
                      onChange={(e) => setFormData({ ...formData, is_staff: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_staff" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Administrador (puede acceder al panel de administración)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_superuser"
                      checked={formData.is_superuser}
                      onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_superuser" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Superusuario (todos los permisos sin restricciones)
                    </label>
                  </div>
                </div>
              </div>

              {/* Información del Perfil */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información del Perfil</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Legajo
                    </label>
                    <input
                      type="text"
                      value={formData.legajo}
                      onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área
                    </label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar área...</option>
                      <option value="PRODUCCION">Producción</option>
                      <option value="CALIDAD">Calidad</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="ALMACEN">Almacén</option>
                      <option value="ADMINISTRACION">Administración</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turno Habitual
                    </label>
                    <select
                      value={formData.turno_habitual}
                      onChange={(e) => setFormData({ ...formData, turno_habitual: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar turno...</option>
                      <option value="M">Mañana</option>
                      <option value="T">Tarde</option>
                      <option value="N">Noche</option>
                      <option value="R">Rotativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
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
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {usuario ? 'Actualizar' : 'Crear'} Usuario
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
