'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Search } from 'lucide-react'
import DataState from '@/components/common/data-state'
import { api, handleApiError } from '@/lib/api'
import { showError } from '@/components/common/toast-utils'
import type { Producto } from '@/types/models'

const ProductosPage = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchProductos()
  }, [])

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getProductos({ page_size: 100 })
      setProductos(response.results ?? [])
    } catch (err) {
      const { message } = handleApiError(err)
      const detail = message || 'No se pudieron obtener los productos'
      setError(detail)
      showError('Error al cargar productos', detail)
    } finally {
      setLoading(false)
    }
  }

  const filtered = productos.filter((producto) => {
    const term = searchTerm.toLowerCase()
    return (
      producto.codigo.toLowerCase().includes(term) ||
      producto.nombre.toLowerCase().includes(term) ||
      producto.descripcion.toLowerCase().includes(term)
    )
  })

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          Catálogo de Productos
        </h1>
        <p className="text-gray-600">
          Datos servidos desde{' '}
          <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">/api/catalogos/productos/</code>
        </p>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por código, nombre o descripción"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <DataState
        loading={loading}
        error={hasError ? error : null}
        empty={isEmpty}
        emptyMessage={
          <div className="text-center py-12">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
        }
      >
        {!hasError && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((producto, index) => (
              <motion.div
                key={producto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="h-full border border-gray-100 shadow-sm transition hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {producto.codigo}
                        </CardTitle>
                        <CardDescription className="text-base text-gray-700">
                          {producto.nombre}
                        </CardDescription>
                      </div>
                      <Badge className={producto.activo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-gray-700">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-50 text-blue-700">{producto.tipo_display}</Badge>
                      <Badge className="bg-purple-50 text-purple-700">{producto.presentacion_display}</Badge>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Concentración</p>
                      <p className="font-medium text-gray-900">{producto.concentracion || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Descripción</p>
                      <p className="text-gray-700">
                        {producto.descripcion ? producto.descripcion : 'Sin descripción registrada'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </DataState>
    </div>
  )
}

export default ProductosPage
