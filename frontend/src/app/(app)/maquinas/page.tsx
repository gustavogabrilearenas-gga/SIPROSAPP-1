'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'ubicacion_nombre', label: 'Ubicación' },
  { key: 'activa', label: 'Activa' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'tipo', label: 'Tipo' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  { name: 'ubicacion', label: 'Ubicación (ID opcional)' },
  { name: 'activa', label: 'Activa', type: 'checkbox' },
]

const initialValues = {
  activa: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  nombre: item.nombre ?? '',
  tipo: item.tipo ?? '',
  descripcion: item.descripcion ?? '',
  ubicacion: item.ubicacion ?? '',
  activa: Boolean(item.activa),
})

const toRequest = (values: Record<string, any>) => ({
  ...values,
  activa: Boolean(values.activa),
  ubicacion: values.ubicacion === '' ? null : values.ubicacion,
})

export default function MaquinasPage() {
  return (
    <ResourceCrud
      resource="catalogos/maquinas"
      title="Máquinas registradas"
      description="Administra la información básica de las máquinas de planta."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toRequest={toRequest}
      toFormValues={toFormValues}
    />
  )
}

