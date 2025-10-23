'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'maquina', label: 'Máquina' },
  { key: 'tipo_mantenimiento', label: 'Tipo' },
  { key: 'tiene_anomalias', label: 'Anomalías' },
  { key: 'fecha_registro', label: 'Fecha' },
]

export default function OrdenesPage() {
  return (
    <ResourceCrud
      resource="mantenimiento/registros"
      title="Órdenes de trabajo"
      description="Visualiza y modifica órdenes utilizando el mismo registro operativo de mantenimiento."
      columns={columns}
      editor="json"
    />
  )
}

