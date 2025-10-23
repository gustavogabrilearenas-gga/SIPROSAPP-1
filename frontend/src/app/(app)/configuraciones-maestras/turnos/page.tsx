'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'hora_inicio', label: 'Inicio' },
  { key: 'hora_fin', label: 'Fin' },
  { key: 'activo', label: 'Activo' },
]

const fields = [
  { name: 'codigo', label: 'Código', required: true },
  { name: 'nombre', label: 'Nombre', required: true },
  { name: 'hora_inicio', label: 'Hora de inicio', required: true, placeholder: '08:00' },
  { name: 'hora_fin', label: 'Hora de fin', required: true, placeholder: '16:00' },
  { name: 'activo', label: 'Activo', type: 'checkbox' },
]

const initialValues = {
  activo: true,
}

const toFormValues = (item: Record<string, any>) => ({
  codigo: item.codigo ?? '',
  nombre: item.nombre ?? '',
  hora_inicio: item.hora_inicio ?? '',
  hora_fin: item.hora_fin ?? '',
  activo: Boolean(item.activo),
})

const toRequest = (values: Record<string, any>) => ({
  ...values,
  activo: Boolean(values.activo),
})

export default function TurnosPage() {
  return (
    <ResourceCrud
      resource="catalogos/turnos"
      title="Turnos operativos"
      description="Define los turnos y sus horarios de trabajo."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toFormValues={toFormValues}
      toRequest={toRequest}
    />
  )
}
