'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'titulo', label: 'Título' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha_registro', label: 'Fecha' },
]

export default function IncidentesPage() {
  return (
    <ResourceCrud
      resource="incidentes/incidentes"
      title="Incidentes"
      description="Registra y actualiza incidentes de planta."
      columns={columns}
      editor="json"
    />
  )
}

