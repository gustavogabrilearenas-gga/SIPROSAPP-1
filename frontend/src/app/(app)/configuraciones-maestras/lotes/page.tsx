'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'estado', label: 'Estado' },
  { key: 'producto', label: 'Producto' },
  { key: 'maquina', label: 'Máquina' },
  { key: 'turno', label: 'Turno' },
  { key: 'hora_inicio', label: 'Inicio' },
  { key: 'hora_fin', label: 'Fin' },
]

export default function LotesPage() {
  return (
    <ResourceCrud
      resource="produccion/registros"
      title="Lotes de producción"
      description="Consulta y edita los lotes registrados utilizando el editor JSON."
      columns={columns}
      editor="json"
      initialValues={{ estado: 'CREADO' }}
    />
  )
}
