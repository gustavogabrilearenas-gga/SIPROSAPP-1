'use client'

import { useMemo, useState, type ComponentProps } from 'react'
import { ResourceCrud } from '@/components/crud/resource-crud'

type Section = {
  key: string
  label: string
  props: ComponentProps<typeof ResourceCrud>
}

const sections: Section[] = [
  {
    key: 'parametros',
    label: 'Parámetros',
    props: {
      resource: 'catalogos/parametros',
      title: 'Parámetros de proceso',
      description: 'Define parámetros clave para la operación diaria.',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'unidad', label: 'Unidad' },
        { key: 'activo', label: 'Activo' },
      ],
      fields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'unidad', label: 'Unidad', required: true },
        { name: 'activo', label: 'Activo', type: 'checkbox' },
      ],
      initialValues: { activo: true },
    },
  },
  {
    key: 'productos',
    label: 'Productos',
    props: {
      resource: 'catalogos/productos',
      title: 'Productos',
      description: 'Gestiona los productos fabricados.',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo_display', label: 'Tipo' },
        { key: 'activo', label: 'Activo' },
      ],
      fields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'tipo', label: 'Tipo' },
        { name: 'presentacion', label: 'Presentación' },
        { name: 'concentracion', label: 'Concentración' },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'activo', label: 'Activo', type: 'checkbox' },
      ],
      initialValues: { activo: true },
    },
  },
  {
    key: 'etapas',
    label: 'Etapas',
    props: {
      resource: 'catalogos/etapas-produccion',
      title: 'Etapas de producción',
      description: 'Organiza las etapas del flujo de producción.',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'activa', label: 'Activa' },
      ],
      fields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'activa', label: 'Activa', type: 'checkbox' },
      ],
      initialValues: { activa: true },
    },
  },
  {
    key: 'turnos',
    label: 'Turnos',
    props: {
      resource: 'catalogos/turnos',
      title: 'Turnos de trabajo',
      description: 'Define turnos y horarios de operación.',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'hora_inicio', label: 'Inicio' },
        { key: 'hora_fin', label: 'Fin' },
        { key: 'activo', label: 'Activo' },
      ],
      fields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'hora_inicio', label: 'Hora de inicio', required: true },
        { name: 'hora_fin', label: 'Hora de fin', required: true },
        { name: 'activo', label: 'Activo', type: 'checkbox' },
      ],
      initialValues: { activo: true },
    },
  },
  {
    key: 'ubicaciones',
    label: 'Ubicaciones',
    props: {
      resource: 'catalogos/ubicaciones',
      title: 'Ubicaciones',
      description: 'Registra las ubicaciones disponibles.',
      columns: [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'descripcion', label: 'Descripción' },
        { key: 'activa', label: 'Activa' },
      ],
      fields: [
        { name: 'codigo', label: 'Código', required: true },
        { name: 'nombre', label: 'Nombre', required: true },
        { name: 'descripcion', label: 'Descripción', type: 'textarea' },
        { name: 'activa', label: 'Activa', type: 'checkbox' },
      ],
      initialValues: { activa: true },
    },
  },
]

export default function ConfiguracionesMaestrasPage() {
  const [activeKey, setActiveKey] = useState(sections[0].key)
  const activeSection = useMemo(
    () => sections.find((section) => section.key === activeKey) ?? sections[0],
    [activeKey],
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-800">Configuraciones maestras</h1>
        <p className="text-sm text-slate-500">
          Mantén actualizados los catálogos fundamentales para la operación del MES.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveKey(section.key)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeKey === section.key
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      <ResourceCrud {...activeSection.props} />
    </div>
  )
}

