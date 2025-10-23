'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'activa', label: 'Activa' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  { name: 'activa', label: 'Activa', type: 'checkbox' },
]

const initialValues = {
  activa: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  nombre: item.nombre ?? '',
  descripcion: item.descripcion ?? '',
  activa: Boolean(item.activa),
})

const toRequest = (values: Record<string, any>) => ({
  ...values,
  activa: Boolean(values.activa),
})

export default function UbicacionesPage() {
  return (
    <ResourceCrud
      resource="catalogos/ubicaciones"
      title="Ubicaciones registradas"
      description="Administra las ubicaciones disponibles para equipos y procesos."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toFormValues={toFormValues}
      toRequest={toRequest}
    />
  )
}
