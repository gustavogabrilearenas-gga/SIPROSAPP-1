'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Key, Mail, Calendar, Shield, Save, Eye, EyeOff, Edit2 } from 'lucide-react'
import { UsuarioDetalle, CambiarPasswordRequest } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Función auxiliar para formatear fechas de manera segura
const formatFecha = (fecha: string | null | undefined, formato: string = 'dd/MM/yyyy') => {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', fecha, 'Tipo:', typeof fecha)
      return '-'
    }
    return format(date, formato, { locale: es })
  } catch (error) {
    console.error('Error formateando fecha:', fecha, error)
    return '-'
  }
}

export default function PerfilPage() {
  const { user: authUser } = useAuth()
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [passwordData, setPasswordData] = useState<CambiarPasswordRequest>({
    password_actual: '',
    password_nueva: '',
    password_confirmacion: '',
  })
  const [showPassword, setShowPassword] = useState({
    actual: false,
    nueva: false,
    confirmacion: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    legajo: '',
    area: '',
    turno_habitual: '',
    telefono: '',
  })

  useEffect(() => {
    fetchMiPerfil()
  }, [])

  const fetchMiPerfil = async () => {
    try {
      setLoading(true)
      const usuario = await api.getMiPerfil()
      console.log('Datos del usuario recibidos:', usuario)
      console.log('date_joined:', usuario.date_joined, 'Tipo:', typeof usuario.date_joined)
      console.log('last_login:', usuario.last_login, 'Tipo:', typeof usuario.last_login)
      setUsuario(usuario)
      // Cargar datos iniciales en el formulario de edición
      setProfileData({
        first_name: usuario.first_name || '',
        last_name: usuario.last_name || '',
        email: usuario.email || '',
        legajo: usuario.legajo || '',
        area: usuario.area || '',
        turno_habitual: usuario.turno_habitual || '',
        telefono: usuario.telefono || '',
      })
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSavingProfile(true)
      const updatedUsuario = await api.updateMiPerfil(profileData)
      setUsuario(updatedUsuario)
      setEditingProfile(false)
      alert('Perfil actualizado exitosamente')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al actualizar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleEditProfile = () => {
    setEditingProfile(true)
  }

  const handleCancelEdit = () => {
    // Restaurar datos originales
    if (usuario) {
      setProfileData({
        first_name: usuario.first_name || '',
        last_name: usuario.last_name || '',
        email: usuario.email || '',
        legajo: usuario.legajo || '',
        area: usuario.area || '',
        turno_habitual: usuario.turno_habitual || '',
        telefono: usuario.telefono || '',
      })
    }
    setEditingProfile(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.password_nueva !== passwordData.password_confirmacion) {
      alert('Las contraseñas nuevas no coinciden')
      return
    }

    if (passwordData.password_nueva.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres')
      return
    }

    try {
      setChangingPassword(true)
      await api.cambiarMiPassword(passwordData)
      alert('Contraseña cambiada exitosamente')
      setShowPasswordForm(false)
      setPasswordData({
        password_actual: '',
        password_nueva: '',
        password_confirmacion: '',
      })
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Error al cargar perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600 mt-1">Información personal y configuración</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Información Personal</span>
              </CardTitle>
              {!editingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditProfile}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <p className="text-gray-900 font-medium">{usuario.full_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <p className="text-gray-900 font-medium">@{usuario.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{usuario.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legajo</label>
                  <p className="text-gray-900">{usuario.legajo || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                  <p className="text-gray-900">{usuario.area || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <p className="text-gray-900">{usuario.telefono || '-'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legajo
                    </label>
                    <input
                      type="text"
                      value={profileData.legajo}
                      onChange={(e) => setProfileData({...profileData, legajo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Área
                    </label>
                    <select
                      value={profileData.area}
                      onChange={(e) => setProfileData({...profileData, area: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar área...</option>
                      <option value="PRODUCCION">Producción</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="ALMACEN">Almacén</option>
                      <option value="CALIDAD">Calidad</option>
                      <option value="ADMINISTRACION">Administración</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profileData.telefono}
                      onChange={(e) => setProfileData({...profileData, telefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span>Permisos y Rol</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Tipo de Usuario</span>
                <span className="font-semibold">
                  {usuario.is_superuser ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded">SUPERUSER</span>
                  ) : usuario.is_staff ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">ADMINISTRADOR</span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded">USUARIO</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Estado</span>
                <span className={`px-3 py-1 rounded ${usuario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {usuario.is_active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Fecha de Registro</span>
                <span className="text-gray-900">
                  {formatFecha(usuario.date_joined, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Último Acceso</span>
                <span className="text-gray-900">
                  {formatFecha(usuario.last_login, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-green-600" />
              <span>Seguridad</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Cambia tu contraseña regularmente para mantener tu cuenta segura.
                </p>
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.actual ? 'text' : 'password'}
                      value={passwordData.password_actual}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, password_actual: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, actual: !showPassword.actual })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword.actual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.nueva ? 'text' : 'password'}
                      value={passwordData.password_nueva}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, password_nueva: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, nueva: !showPassword.nueva })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword.nueva ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo 4 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.confirmacion ? 'text' : 'password'}
                      value={passwordData.password_confirmacion}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, password_confirmacion: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, confirmacion: !showPassword.confirmacion })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword.confirmacion ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {changingPassword ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Contraseña
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({
                        password_actual: '',
                        password_nueva: '',
                        password_confirmacion: '',
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

