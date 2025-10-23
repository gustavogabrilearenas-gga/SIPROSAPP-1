'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from '@/lib/motion'
import { api, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import UsuarioFormModal from '@/components/usuario-form-modal'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/stores/auth-store'
import { toast } from '@/hooks/use-toast'
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Ban,
  CheckCircle,
  Key,
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Contact2
} from 'lucide-react'
import type { UsuarioDetalle } from '@/types/models'
import type { ComponentProps, MouseEventHandler } from 'react'

type MotionDivProps = ComponentProps<typeof motion.div> & {
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

const MotionDiv = motion.div as React.ComponentType<MotionDivProps>

function UsuariosPageContent() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const deniedRef = useRef(false)

  const handlePasswordModalClick: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
  }

  const canManageUsers = Boolean(currentUser?.is_superuser)

  // Redirigir si el usuario no es superusuario
  useEffect(() => {
    if (!currentUser) {
      return
    }

    if (!canManageUsers && !deniedRef.current) {
      deniedRef.current = true
      toast({
        title: 'Acceso denegado',
        description: 'No tienes permisos para acceder a esta página',
        variant: 'destructive',
      })
      router.replace('/dashboard')
    }
  }, [canManageUsers, currentUser, router])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioDetalle | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Cargar usuarios
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getUsuarios({ page_size: 100 })
      setUsuarios(response.results ?? [])
    } catch (error: any) {
      const { message } = handleApiError(error)
      const detail = message || 'No se pudieron cargar los usuarios'
      toast({
        title: 'Error al cargar usuarios',
        description: detail,
        variant: 'destructive',
      })
      setError(`Error: ${detail}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canManageUsers) {
      setUsuarios([])
      setLoading(false)
      return
    }

    void fetchUsuarios()
  }, [canManageUsers, fetchUsuarios])

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter((usuario) => {
    const term = searchTerm.toLowerCase()
    return (
      usuario.username.toLowerCase().includes(term) ||
      usuario.email.toLowerCase().includes(term) ||
      usuario.first_name.toLowerCase().includes(term) ||
      usuario.last_name.toLowerCase().includes(term) ||
      (usuario.funcion_nombre || '').toLowerCase().includes(term) ||
      (usuario.legajo || '').toLowerCase().includes(term) ||
      (usuario.dni || '').toLowerCase().includes(term)
    )
  })

  const handleCreateUsuario = () => {
    if (!canManageUsers) {
      return
    }
    setSelectedUsuario(null)
    setIsFormModalOpen(true)
  }

  const handleEditUsuario = (usuario: UsuarioDetalle) => {
    if (!canManageUsers) {
      return
    }
    setSelectedUsuario(usuario)
    setIsFormModalOpen(true)
  }

  const handleToggleActive = async (usuario: UsuarioDetalle) => {
    if (!canManageUsers) {
      return
    }
    if (!confirm(`¿Está seguro que desea ${usuario.is_active ? 'desactivar' : 'reactivar'} al usuario ${usuario.username}?`)) {
      return
    }

    try {
      if (usuario.is_active) {
        await api.desactivarUsuario(usuario.id)
        toast({
          title: 'Usuario desactivado',
          description: `${usuario.username} pasó a estado inactivo`,
        })
      } else {
        await api.reactivarUsuario(usuario.id)
        toast({
          title: 'Usuario reactivado',
          description: `${usuario.username} volvió a estar activo`,
        })
      }
      fetchUsuarios()
    } catch (error: any) {
      const { message } = handleApiError(error)
      const detail = message || 'No se pudo actualizar el estado del usuario'
      toast({
        title: 'Error al actualizar usuario',
        description: detail,
        variant: 'destructive',
      })
    }
  }

  const handleChangePassword = (usuario: UsuarioDetalle) => {
    if (!canManageUsers) {
      return
    }
    setSelectedUsuario(usuario)
    setNewPassword('')
    setConfirmPassword('')
    setIsPasswordModalOpen(true)
  }

  const handleSubmitPasswordChange = async () => {
    if (!selectedUsuario) return

    if (newPassword.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    try {
      await api.cambiarPasswordUsuario(selectedUsuario.id, {
        password_nueva: newPassword,
        password_confirmacion: confirmPassword,
      })
      toast({
        title: 'Contraseña actualizada',
        description: `Se cambió la contraseña de ${selectedUsuario.username}`,
      })
      setIsPasswordModalOpen(false)
      setSelectedUsuario(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const { message } = handleApiError(error)
      const detail = message || 'No se pudo cambiar la contraseña'
      toast({
        title: 'Error al cambiar contraseña',
        description: detail,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-sm text-gray-600">Administra los usuarios del sistema</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={fetchUsuarios}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                onClick={handleCreateUsuario}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={!canManageUsers}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error */}
        {error && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
          >
            <p>{error}</p>
          </MotionDiv>
        )}

        {/* Búsqueda y Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Barra de Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Estadísticas */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {usuarios.filter(u => u.is_active).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {usuarios.filter(u => !u.is_active).length}
                  </p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de usuarios */}
        <div className="grid gap-4">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Cargando usuarios...</span>
            </div>
          )}
          
          {!loading && filteredUsuarios.length === 0 && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                <p className="text-gray-600">No hay usuarios que coincidan con tu búsqueda.</p>
              </CardContent>
            </Card>
          )}
          
          {!loading && filteredUsuarios.map((usuario, index) => (
            <MotionDiv
              key={usuario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`hover:shadow-lg transition-all ${!usuario.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Información del usuario */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        usuario.is_superuser ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                        usuario.is_staff ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 truncate">
                            {usuario.first_name} {usuario.last_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {usuario.is_superuser && (
                              <Badge className="bg-red-100 text-red-800 border-red-200">
                                <Shield className="h-3 w-3 mr-1" />
                                SUPERUSER
                              </Badge>
                            )}
                            {usuario.is_staff && !usuario.is_superuser && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <Shield className="h-3 w-3 mr-1" />
                                ADMIN
                              </Badge>
                            )}
                            <Badge className={usuario.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                              {usuario.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">@{usuario.username}</span>
                          </div>
                          {usuario.email && (
                            <div className="flex items-center space-x-2 text-gray-600 truncate">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{usuario.email}</span>
                            </div>
                          )}
                          {usuario.dni && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Contact2 className="h-4 w-4" />
                              <span>{usuario.dni}</span>
                            </div>
                          )}
                          {usuario.telefono && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{usuario.telefono}</span>
                            </div>
                          )}
                          {usuario.funcion_nombre && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Briefcase className="h-4 w-4" />
                              <span>{usuario.funcion_nombre}</span>
                            </div>
                          )}
                          {usuario.turno_nombre && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{usuario.turno_nombre}</span>
                            </div>
                          )}
                          {usuario.legajo && (
                            <div className="flex items-center space-x-2 text-gray-600">
                              <span className="font-medium">Legajo:</span>
                              <span>{usuario.legajo}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUsuario(usuario)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        disabled={!canManageUsers}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChangePassword(usuario)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        disabled={!canManageUsers}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Contraseña
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(usuario)}
                        disabled={usuario.id === currentUser?.id || !canManageUsers}
                        className={usuario.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                        }
                      >
                        {usuario.is_active ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          ))}
        </div>
      </div>

      {/* Modal de Formulario */}
      <UsuarioFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedUsuario(null)
        }}
        onSuccess={() => {
          fetchUsuarios()
        }}
        usuario={selectedUsuario}
      />

      {/* Modal de Cambio de Contraseña */}
      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={handlePasswordModalClick}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cambiar Contraseña - {selectedUsuario?.username}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Mínimo 4 caracteres"
                  minLength={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Repetir contraseña"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitPasswordChange}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Cambiar Contraseña
              </Button>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  )
}

export default function UsuariosPage() {
  return (
    <ProtectedRoute>
      <UsuariosPageContent />
    </ProtectedRoute>
  )
}
