'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/stores/auth-store'
import { api, handleApiError } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Key, Mail, Calendar, Shield, Save, Eye, EyeOff, Edit2, Loader2 } from 'lucide-react'
import { UsuarioDetalle, CambiarPasswordRequest, Funcion, Turno } from '@/types/models'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Función auxiliar para formatear fechas de manera segura
const formatFecha = (fecha: string | null | undefined, formato: string = 'dd/MM/yyyy') => {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return '-'
    }
    return format(date, formato, { locale: es })
  } catch (error) {
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
    dni: '',
    funcion_id: '',
    turno_id: '',
    telefono: '',
  })
  const [funciones, setFunciones] = useState<Funcion[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)

  useEffect(() => {
    fetchMiPerfil()
    fetchCatalogos()
  }, [])

  const fetchCatalogos = async () => {
    try {
      setCatalogLoading(true)
      const [funcionesResponse, turnosResponse] = await Promise.all([
        api.getFunciones({ page_size: 100 }),
        api.getTurnos({ page_size: 100 }),
      ])

      setFunciones(funcionesResponse.results ?? [])
      setTurnos(turnosResponse.results ?? [])
    } catch (error) {
      const { message } = handleApiError(error)
      toast({
        title: 'Error al cargar catálogos',
        description: message || 'No se pudieron obtener las funciones y turnos.',
        variant: 'destructive',
      })
    } finally {
      setCatalogLoading(false)
    }
  }

  const fetchMiPerfil = async () => {
    try {
      setLoading(true)
      const usuario = await api.getMiPerfil()
      setUsuario(usuario)
      setProfileData({
        first_name: usuario.first_name || '',
        last_name: usuario.last_name || '',
        email: usuario.email || '',
        legajo: usuario.legajo || '',
        dni: usuario.dni || '',
        funcion_id: usuario.funcion_id ? String(usuario.funcion_id) : '',
        turno_id: usuario.turno_id ? String(usuario.turno_id) : '',
        telefono: usuario.telefono || '',
      })
    } catch (error) {
      const { message } = handleApiError(error)
      toast({
        title: 'Error al cargar perfil',
        description: message || 'No se pudo obtener la información del usuario',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSavingProfile(true)
      const payload: Record<string, unknown> = {
        first_name: profileData.first_name.trim(),
        last_name: profileData.last_name.trim(),
        email: profileData.email.trim(),
        legajo: profileData.legajo.trim(),
        telefono: profileData.telefono.trim(),
        dni: profileData.dni.trim(),
      }

      payload.funcion_id = profileData.funcion_id ? Number(profileData.funcion_id) : null
      payload.turno_id = profileData.turno_id ? Number(profileData.turno_id) : null

      const updatedUsuario = await api.updateMiPerfil(payload)
      setUsuario(updatedUsuario)
      setProfileData({
        first_name: updatedUsuario.first_name || '',
        last_name: updatedUsuario.last_name || '',
        email: updatedUsuario.email || '',
        legajo: updatedUsuario.legajo || '',
        dni: updatedUsuario.dni || '',
        funcion_id: updatedUsuario.funcion_id ? String(updatedUsuario.funcion_id) : '',
        turno_id: updatedUsuario.turno_id ? String(updatedUsuario.turno_id) : '',
        telefono: updatedUsuario.telefono || '',
      })
      setEditingProfile(false)
      toast({
        title: 'Perfil actualizado',
        description: 'Los cambios se guardaron correctamente.',
      })
    } catch (error) {
      const { message, details } = handleApiError(error)
      toast({
        title: 'Error al actualizar perfil',
        description: message || (typeof details === 'string' ? details : 'No se pudo guardar el perfil'),
        variant: 'destructive',
      })
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
        dni: usuario.dni || '',
        funcion_id: usuario.funcion_id ? String(usuario.funcion_id) : '',
        turno_id: usuario.turno_id ? String(usuario.turno_id) : '',
        telefono: usuario.telefono || '',
      })
    }
    setEditingProfile(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.password_nueva !== passwordData.password_confirmacion) {
      toast({
        title: 'Contraseña no coincide',
        description: 'Las contraseñas nuevas deben coincidir.',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.password_nueva.length < 4) {
      toast({
        title: 'Contraseña muy corta',
        description: 'Debe tener al menos 4 caracteres.',
        variant: 'destructive',
      })
      return
    }

    try {
      setChangingPassword(true)
      await api.cambiarMiPassword(passwordData)
      toast({
        title: 'Contraseña actualizada',
        description: 'La contraseña se cambió correctamente.',
      })
      setShowPasswordForm(false)
      setPasswordData({
        password_actual: '',
        password_nueva: '',
        password_confirmacion: '',
      })
    } catch (error) {
      const { message, details } = handleApiError(error)
      toast({
        title: 'Error al cambiar contraseña',
        description: message || (typeof details === 'string' ? details : 'No se pudo cambiar la contraseña'),
        variant: 'destructive',
      })
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                  <p className="text-gray-900">{usuario.dni || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Función</label>
                  <p className="text-gray-900">{usuario.funcion_nombre || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <p className="text-gray-900">{usuario.telefono || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Turno habitual</label>
                  <p className="text-gray-900">{usuario.turno_nombre || '-'}</p>
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
                      DNI
                    </label>
                    <input
                      type="text"
                      value={profileData.dni}
                      onChange={(e) => setProfileData({...profileData, dni: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Documento sin puntos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Función
                    </label>
                    <select
                      value={profileData.funcion_id}
                      onChange={(e) => setProfileData({...profileData, funcion_id: e.target.value})}
                      disabled={catalogLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Sin asignar</option>
                      {funciones.map((funcion) => (
                        <option key={funcion.id} value={funcion.id}>
                          {funcion.codigo} — {funcion.nombre}
                        </option>
                      ))}
                    </select>
                    {catalogLoading && funciones.length === 0 && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Cargando funciones...
                      </p>
                    )}
                    {!catalogLoading && funciones.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">No hay funciones configuradas.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Turno habitual
                    </label>
                    <select
                      value={profileData.turno_id}
                      onChange={(e) => setProfileData({...profileData, turno_id: e.target.value})}
                      disabled={catalogLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="">Sin asignar</option>
                      {turnos.map((turno) => (
                        <option key={turno.id} value={turno.id}>
                          {turno.nombre_display} ({turno.hora_inicio} - {turno.hora_fin})
                        </option>
                      ))}
                    </select>
                    {catalogLoading && turnos.length === 0 && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Cargando turnos...
                      </p>
                    )}
                    {!catalogLoading && turnos.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500">No hay turnos configurados.</p>
                    )}
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
                    {savingProfile ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="h-4 w-4" /> Guardar Cambios
                      </span>
                    )}
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

