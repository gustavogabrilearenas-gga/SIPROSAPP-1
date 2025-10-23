'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from '@/lib/motion'
import { Package, Pencil, Plus, Search, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/common/data-state'
import { AccessDenied } from '@/components/access-denied'
import ProductoFormModal from '@/components/producto-form-modal'
import { api, handleApiError } from '@/lib/api'
import { showError, showSuccess } from '@/components/common/toast-utils'
import type { Producto } from '@/types/models'
import { useMasterConfigAccess } from '@/hooks/use-master-config-access'

const ProductosPage = () => {
  const { status, canEdit } = useMasterConfigAccess()
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'ready') {
      void fetchProductos()
    }
  }, [status])

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getProductos({ page_size: 200 })
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

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) {
      return productos
    }
    return productos.filter((producto) => {
      const descripcion = producto.descripcion ? producto.descripcion.toLowerCase() : ''
      return (
        producto.codigo.toLowerCase().includes(term) ||
        producto.nombre.toLowerCase().includes(term) ||
        descripcion.includes(term)
      )
    })
  }, [productos, searchTerm])

  const hasError = Boolean(error)
  const isEmpty = !loading && !hasError && filtered.length === 0

  const openCreateModal = () => {
    setSelectedId(null)
    setModalOpen(true)
  }

  const openEditModal = (id: number) => {
    setSelectedId(id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedId(null)
  }

  const handleDelete = async (id: number) => {
    const target = productos.find((item) => item.id === id)
    const confirmation = window.confirm(
      `¿Está seguro de eliminar el producto ${target?.codigo ?? ''}? Esta acción no se puede deshacer.`,
    )
    if (!confirmation) {
      return
    }

    try {
      await api.deleteProducto(id)
      showSuccess('Producto eliminado correctamente')
      void fetchProductos()
    } catch (err) {
      const { message } = handleApiError(err)
      showError('No se pudo eliminar el producto', message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-blue-600">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verificando permisos...
      </div>
    )
  }

  if (status === 'forbidden') {
    return <AccessDenied description="Solicite a un supervisor acceso a las configuraciones maestras." />
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
            <Package className="h-8 w-8 text-blue-600" />
            Catálogo de Productos
          </h1>
          <p className="text-sm text-gray-600">
            Datos servidos desde{' '}
            <code className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">/api/catalogos/productos/</code>
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateModal} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nuevo producto
          </Button>
        )}
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-lg text-gray-500">No se encontraron productos</p>
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{producto.codigo}</CardTitle>
                        <CardDescription className="text-base text-gray-700">{producto.nombre}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={producto.activo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditModal(producto.id)}
                              aria-label="Editar producto"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(producto.id)}
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
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

      <ProductoFormModal
        isOpen={modalOpen}
        productoId={selectedId}
        onClose={closeModal}
        onSuccess={fetchProductos}
      />
    </div>
  )
}

export default ProductosPage
