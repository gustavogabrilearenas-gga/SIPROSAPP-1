'use client'

import { ResourceCrud } from '@/components/crud/resource-crud'

const columns = [
  { key: 'username', label: 'Usuario' },
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Nombre completo' },
  { key: 'is_active', label: 'Activo' },
  { key: 'groups', label: 'Grupos', render: (item: Record<string, any>) => (item.groups || []).join(', ') || '—' },
]

const fields = [
  { name: 'username', label: 'Usuario', required: true },
  { name: 'email', label: 'Email' },
  { name: 'first_name', label: 'Nombre' },
  { name: 'last_name', label: 'Apellido' },
  { name: 'password', label: 'Contraseña', type: 'password', hideOnEdit: true },
  { name: 'groups', label: 'Grupos (separa por coma)' },
  { name: 'is_active', label: 'Activo', type: 'checkbox' },
]

const initialValues = {
  is_active: true,
}

const toFormValues = (item: Record<string, any>) => ({
  username: item.username ?? '',
  email: item.email ?? '',
  first_name: item.first_name ?? '',
  last_name: item.last_name ?? '',
  groups: Array.isArray(item.groups) ? item.groups.join(', ') : '',
  is_active: Boolean(item.is_active),
})

const toRequest = (values: Record<string, any>, current: Record<string, any> | null) => {
  const payload = { ...values }
  payload.is_active = Boolean(values.is_active)

  if (typeof values.groups === 'string') {
    payload.groups = values.groups
      .split(',')
      .map((group: string) => group.trim())
      .filter(Boolean)
  }

  if (!payload.password) {
    delete payload.password
  }

  if (current && !payload.password) {
    delete payload.password
  }

  return payload
}

export default function UsuariosPage() {
  return (
    <ResourceCrud
      resource="usuarios"
      title="Gestión de usuarios"
      description="Crea, consulta y actualiza usuarios del sistema."
      columns={columns}
      fields={fields}
      initialValues={initialValues}
      toRequest={toRequest}
      toFormValues={toFormValues}
    />
  )
}

