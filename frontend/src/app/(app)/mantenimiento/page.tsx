'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'maquina', label: 'Máquina' },
  { key: 'tipo_mantenimiento', label: 'Tipo' },
  { key: 'hora_inicio', label: 'Inicio' },
  { key: 'hora_fin', label: 'Fin' },
]

export default function MantenimientoPage() {
  return (
    <ResourceCrud
      resource="mantenimiento/registros"
      title="Registros de mantenimiento"
      description="Gestiona los registros de mantenimiento utilizando un editor JSON sencillo."
      columns={columns}
      editor="json"
    />
  )
}

