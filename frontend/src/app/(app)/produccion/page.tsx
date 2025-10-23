'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'estado', label: 'Estado' },
  { key: 'producto', label: 'Producto' },
  { key: 'cantidad_producida', label: 'Cantidad' },
  { key: 'hora_inicio', label: 'Inicio' },
  { key: 'hora_fin', label: 'Fin' },
]

export default function ProduccionPage() {
  return (
    <ResourceCrud
      resource="produccion/registros"
      title="Registros de producción"
      description="Consulta y edita registros de producción en un formato flexible."
      columns={columns}
      editor="json"
      initialValues={{ estado: 'CREADO' }}
    />
  )
}

