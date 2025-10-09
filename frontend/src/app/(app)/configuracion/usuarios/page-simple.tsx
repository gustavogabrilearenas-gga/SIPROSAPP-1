'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Plus, RefreshCw, Search } from 'lucide-react'
import { UsuarioDetalle } from '@/types/models'

export default function UsuariosPageSimple() {
  const [usuarios, setUsuarios] = useState<UsuarioDetalle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios
  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Intentando cargar usuarios...')
      
      const response = await api.getUsuarios()
      console.log('✅ Respuesta de la API:', response)
      
      const users = response.results || response
      console.log('👥 Usuarios extraídos:', users)
      
      setUsuarios(Array.isArray(users) ? users : [])
    } catch (error: any) {
      console.error('❌ Error al cargar usuarios:', error)
      setError(`Error: ${error.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios (Simple)</h1>
          <p className="text-gray-600 mt-2">Administra los usuarios del sistema</p>
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Loading: {loading ? 'Sí' : 'No'}</p>
        <p>Usuarios cargados: {usuarios.length}</p>
        <p>Usuarios filtrados: {filteredUsuarios.length}</p>
        <p>Token disponible: {api.getAccessToken() ? 'Sí' : 'No'}</p>
      </div>

      {/* Lista de usuarios */}
      <div className="grid gap-4">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando usuarios...</span>
          </div>
        )}
        
        {!loading && filteredUsuarios.length === 0 && !error && (
          <div className="text-center p-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
            <p className="text-gray-600">No hay usuarios que coincidan con tu búsqueda.</p>
          </div>
        )}
        
        {!loading && filteredUsuarios.map((usuario) => (
          <Card key={usuario.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {usuario.first_name} {usuario.last_name}
                    </h3>
                    <p className="text-gray-600">@{usuario.username}</p>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {usuario.is_superuser && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          SUPERUSER
                        </span>
                      )}
                      {usuario.is_staff && !usuario.is_superuser && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          STAFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
