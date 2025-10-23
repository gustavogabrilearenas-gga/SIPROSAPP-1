'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'activa', label: 'Activa' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  { name: 'maquinas_permitidas', label: 'Máquinas permitidas (IDs separados por coma)' },
  { name: 'parametros', label: 'Parámetros (IDs separados por coma)' },
  { name: 'activa', label: 'Activa', type: 'checkbox' },
]

const initialValues = {
  activa: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  nombre: item.nombre ?? '',
  descripcion: item.descripcion ?? '',
  maquinas_permitidas: Array.isArray(item.maquinas_permitidas)
    ? item.maquinas_permitidas.join(', ')
    : '',
  parametros: Array.isArray(item.parametros) ? item.parametros.join(', ') : '',
  activa: Boolean(item.activa),
})

const parseIds = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => !Number.isNaN(item))
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => Number(part))
      .filter((item) => !Number.isNaN(item))
  }

  return []
}

const toRequest = (values: Record<string, any>) => ({
  codigo: values.codigo,
  nombre: values.nombre,
  descripcion: values.descripcion,
  maquinas_permitidas: parseIds(values.maquinas_permitidas),
  parametros: parseIds(values.parametros),
  activa: Boolean(values.activa),
})

export default function EtapasProduccionPage() {
  return (
    <ResourceCrud
      resource="catalogos/etapas-produccion"
      title="Etapas de producción"
      description="Registra las etapas que componen los procesos productivos."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toFormValues={toFormValues}
      toRequest={toRequest}
    />
  )
}
