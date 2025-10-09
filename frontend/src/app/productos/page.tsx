'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/stores/auth-store'
import { ProtectedRoute } from '@/components/protected-route'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Activity,
  ArrowLeft,
} from 'lucide-react'
import { api } from '@/lib/api'
import { featureFlags } from '@/lib/feature-flags'
import ProductoFormModal from '@/components/producto-form-modal'
import DataState from '@/components/common/data-state'
import { showError } from '@/components/common/toast-utils'

interface Producto {
  id: number
  codigo: string
  nombre: string
  forma_farmaceutica: string
  principio_activo: string
  concentracion: string
  unidad_medida: string
  lote_minimo: number
  lote_optimo: number
  tiempo_vida_util_meses: number
  requiere_cadena_frio: boolean
  registro_anmat: string
  activo: boolean
}

export default function ProductosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null)

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/productos/')
      setProductos(response.results || response)
    } catch (error: any) {
      const message = error?.message || 'No se pudieron obtener los productos'
      setError(message)
      showError('Error al cargar productos', message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProductos = productos.filter(p =>
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.principio_activo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFormaColor = (forma: string) => {
    const colors: Record<string, string> = {
      COMPRIMIDO: 'bg-blue-100 text-blue-800',
      CREMA: 'bg-green-100 text-green-800',
      SOLUCION: 'bg-purple-100 text-purple-800',
    }
    return colors[forma] || 'bg-gray-100 text-gray-800'
  }

  const hasError = Boolean(error)
  const dataStateError = hasError ? `Error al cargar productos${error ? `: ${error}` : ''}` : null
  const isEmptyState = !loading && !hasError && filteredProductos.length === 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-8 h-8 text-blue-600" />
                    Catálogo de Productos
                  </h1>
                  <p className="text-gray-600">Gestión de productos farmacéuticos</p>
                </div>
              </div>
              {(user?.is_superuser || user?.is_staff) && (
                <Button
                  onClick={() => {
                    setSelectedProductoId(null)
                    setIsFormOpen(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o principio activo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          <DataState
            loading={loading}
            error={dataStateError}
            empty={isEmptyState}
            emptyMessage={
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProductos.map((producto, index) => (
                <motion.div
                  key={producto.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold mb-1">
                            {producto.codigo}
                          </CardTitle>
                          <CardDescription className="font-medium text-gray-900">
                            {producto.nombre}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {producto.requiere_cadena_frio && (
                            <Badge className="bg-blue-100 text-blue-800">❄️ Frío</Badge>
                          )}
                          {!producto.activo && (
                            <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Badge className={getFormaColor(producto.forma_farmaceutica)}>
                            {producto.forma_farmaceutica}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Principio Activo</p>
                            <p className="font-medium">{producto.principio_activo}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Concentración</p>
                            <p className="font-medium">{producto.concentracion}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Lote Óptimo</p>
                            <p className="font-medium">{producto.lote_optimo.toLocaleString()} {producto.unidad_medida}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Vida Útil</p>
                            <p className="font-medium">{producto.tiempo_vida_util_meses} meses</p>
                          </div>
                        </div>
                        {producto.registro_anmat && (
                          <div className="text-xs text-gray-500 border-t pt-2">
                            <p>ANMAT: {producto.registro_anmat}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {featureFlags.productosAsociaciones && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                console.warn('Asociación de fórmulas a productos deshabilitada sin soporte backend')
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Fórmulas
                            </Button>
                          )}
                          {(user?.is_superuser || user?.is_staff) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProductoId(producto.id)
                                setIsFormOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </DataState>
        </main>

        {/* Modals */}
        <ProductoFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedProductoId(null)
          }}
          productoId={selectedProductoId}
          onSuccess={() => {
            fetchProductos()
          }}
        />
      </div>
    </ProtectedRoute>
  )
}

