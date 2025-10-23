'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'version', label: 'Versión' },
  { key: 'producto_nombre', label: 'Producto' },
  { key: 'activa', label: 'Activa' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'version', label: 'Versión', required: true },
  { name: 'producto', label: 'Producto (ID opcional)' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  { name: 'activa', label: 'Activa', type: 'checkbox' },
]

const initialValues = {
  activa: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  version: item.version ?? '',
  producto: item.producto ?? '',
  descripcion: item.descripcion ?? '',
  activa: Boolean(item.activa),
})

const toRequest = (values: Record<string, any>) => ({
  ...values,
  activa: Boolean(values.activa),
  producto: values.producto === '' ? null : values.producto,
})

export default function FormulasPage() {
  return (
    <ResourceCrud
      resource="catalogos/formulas"
      title="Formulaciones registradas"
      description="Gestiona las fórmulas utilizadas en producción."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toFormValues={toFormValues}
      toRequest={toRequest}
    />
  )
}
