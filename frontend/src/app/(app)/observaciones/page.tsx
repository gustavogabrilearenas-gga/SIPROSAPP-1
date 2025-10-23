'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'texto', label: 'Observación' },
  { key: 'creado_en', label: 'Creado' },
]

const fields = [
  { name: 'texto', label: 'Observación', type: 'textarea', required: true },
]

export default function ObservacionesPage() {
  return (
    <ResourceCrud
      resource="observaciones/observaciones"
      title="Observaciones generales"
      description="Crea notas rápidas para compartir con el equipo."
      columns={columns}
      fields={fields}
    />
  )
}

