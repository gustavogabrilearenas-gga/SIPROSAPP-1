'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo_display', label: 'Tipo' },
  { key: 'activo', label: 'Activo' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'tipo', label: 'Tipo' },
  { name: 'presentacion', label: 'Presentación' },
  { name: 'concentracion', label: 'Concentración' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  { name: 'activo', label: 'Activo', type: 'checkbox' },
]

const initialValues = {
  activo: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  nombre: item.nombre ?? '',
  tipo: item.tipo ?? '',
  presentacion: item.presentacion ?? '',
  concentracion: item.concentracion ?? '',
  descripcion: item.descripcion ?? '',
  activo: Boolean(item.activo),
})

const toRequest = (values: Record<string, any>) => ({
  ...values,
  activo: Boolean(values.activo),
})

export default function ProductosPage() {
  return (
    <ResourceCrud
      resource="catalogos/productos"
      title="Productos"
      description="Gestiona los productos disponibles en el catálogo."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toFormValues={toFormValues}
      toRequest={toRequest}
    />
  )
}
