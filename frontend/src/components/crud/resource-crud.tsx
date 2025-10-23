'use client'

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { handleApiError, type CrudId } from '@/lib/api'
import { createCrudHooks } from '@/lib/queries'

type ColumnConfig = {
  key: string
  label: string
  render?: (item: Record<string, any>) => ReactNode
}

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'password'

type FieldConfig = {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  placeholder?: string
  hideOnCreate?: boolean
  hideOnEdit?: boolean
}

type EditorVariant = 'form' | 'json'

type ResourceCrudProps = {
  resource: string
  title: string
  description?: string
  columns: ColumnConfig[]
  fields?: FieldConfig[]
  editor?: EditorVariant
  idField?: string
  initialValues?: Record<string, unknown>
  toRequest?: (
    values: Record<string, any>,
    current: Record<string, any> | null,
  ) => Record<string, any>
  toFormValues?: (item: Record<string, any>) => Record<string, any>
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  if (typeof value === 'string') {
    return value.length > 120 ? `${value.slice(0, 117)}…` : value
  }

  return String(value)
}

export function ResourceCrud({
  resource,
  title,
  description,
  columns,
  fields = [],
  editor = 'form',
  idField = 'id',
  initialValues,
  toRequest,
  toFormValues,
}: ResourceCrudProps) {
  const hooks = useMemo(() => createCrudHooks<Record<string, any>>(resource), [resource])
  const listQuery = hooks.useList()
  const createMutation = hooks.useCreate()
  const updateMutation = hooks.useUpdate()
  const removeMutation = hooks.useRemove()

  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [formItem, setFormItem] = useState<Record<string, any> | null>(null)
  const [detailItem, setDetailItem] = useState<Record<string, any> | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [jsonValue, setJsonValue] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const items = listQuery.data ?? []

  const emptyFormValues = () => {
    if (editor === 'json') {
      return {}
    }

    const result: Record<string, any> = {}
    fields.forEach((field) => {
      if (initialValues && field.name in initialValues) {
        result[field.name] = initialValues[field.name]
        return
      }
      result[field.name] = field.type === 'checkbox' ? false : ''
    })
    return result
  }

  const prepareValuesForItem = (item: Record<string, any> | null) => {
    if (editor === 'json') {
      const payload = item ?? initialValues ?? {}
      return JSON.stringify(payload, null, 2)
    }

    const base = emptyFormValues()
    if (item) {
      if (toFormValues) {
        return { ...base, ...toFormValues(item) }
      }

      fields.forEach((field) => {
        const value = item[field.name]
        base[field.name] = field.type === 'checkbox' ? Boolean(value) : value ?? ''
      })
    }

    return base
  }

  const resetForm = () => {
    setFormMode(null)
    setFormItem(null)
    setFormError(null)
    setSuccessMessage(null)
    if (editor === 'json') {
      setJsonValue('')
    } else {
      setFormValues(emptyFormValues())
    }
  }

  const handleCreate = () => {
    setFormItem(null)
    setFormMode('create')
    setDetailItem(null)
    setFormError(null)
    setSuccessMessage(null)
    if (editor === 'json') {
      const base = initialValues ?? {}
      setJsonValue(JSON.stringify(base, null, 2))
    } else {
      setFormValues(emptyFormValues())
    }
  }

  const handleEdit = (item: Record<string, any>) => {
    setFormItem(item)
    setFormMode('edit')
    setFormError(null)
    setSuccessMessage(null)
    if (editor === 'json') {
      setJsonValue(prepareValuesForItem(item))
    } else {
      const values = prepareValuesForItem(item) as Record<string, any>
      setFormValues(values)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    try {
      let payload: Record<string, any>
      if (editor === 'json') {
        const parsed = jsonValue.trim() ? JSON.parse(jsonValue) : {}
        payload = parsed
      } else {
        payload = { ...formValues }
      }

      if (toRequest) {
        payload = toRequest(payload, formItem)
      }

      if (formMode === 'edit') {
        if (!formItem) {
          throw new Error('No hay un registro seleccionado')
        }

        const id = formItem[idField] as CrudId
        await updateMutation.mutateAsync({ id, data: payload })
        setSuccessMessage('Registro actualizado correctamente')
      } else {
        await createMutation.mutateAsync(payload)
        setSuccessMessage('Registro creado correctamente')
      }

      resetForm()
    } catch (error) {
      const { message } = handleApiError(error)
      setFormError(message)
    }
  }

  const handleDelete = async (item: Record<string, any>) => {
    const id = item[idField] as CrudId | undefined
    if (id === undefined || id === null) {
      return
    }

    const confirmed = window.confirm('¿Eliminar este registro?')
    if (!confirmed) {
      return
    }

    setFormError(null)
    setSuccessMessage(null)

    try {
      await removeMutation.mutateAsync(id)
      if (detailItem && detailItem[idField] === id) {
        setDetailItem(null)
      }
      if (formItem && formItem[idField] === id) {
        resetForm()
      }
    } catch (error) {
      const { message } = handleApiError(error)
      setFormError(message)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = removeMutation.isPending
  const isLoading = listQuery.isLoading
  const listError = listQuery.error ? handleApiError(listQuery.error).message : null

  const filteredItems = useMemo(() => {
    if (!search) {
      return items
    }
    const term = search.toLowerCase()
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(term))
  }, [items, search])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            Nuevo registro
          </button>
        </div>
        <div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar en los registros"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
          />
        </div>
      </header>

      {listError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-slate-500">
                  Cargando registros…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-slate-500">
                  No se encontraron datos
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={String(item[idField] ?? JSON.stringify(item))} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.render ? column.render(item) : formatValue(item[column.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="rounded border border-slate-300 px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="rounded border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(formMode || formError || successMessage) && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">
                {formMode === 'edit' ? 'Editar registro' : 'Crear registro'}
              </h3>
              {formItem && formMode === 'edit' && (
                <p className="text-xs text-slate-500">ID: {String(formItem[idField] ?? '—')}</p>
              )}
            </div>
            {formMode && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>

          {formError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMessage}
            </div>
          )}

          {formMode && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {editor === 'json' ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600">Datos (JSON)</label>
                  <textarea
                    value={jsonValue}
                    onChange={(event) => setJsonValue(event.target.value)}
                    className="min-h-[200px] w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs focus:border-blue-500 focus:outline-none focus:ring"
                  />
                  <p className="text-xs text-slate-500">
                    Edita los datos en formato JSON. Se enviarán tal como aparecen aquí.
                  </p>
                </div>
              ) : (
                fields.map((field) => {
                  if ((formMode === 'create' && field.hideOnCreate) || (formMode === 'edit' && field.hideOnEdit)) {
                    return null
                  }

                  const value = formValues[field.name]
                  const onChange = (
                    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                  ) => {
                    const input = event.target
                    setFormValues((previous) => ({
                      ...previous,
                      [field.name]: field.type === 'checkbox'
                        ? (input as HTMLInputElement).checked
                        : input.value,
                    }))
                  }

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.name} className="space-y-1">
                        <label htmlFor={field.name} className="text-xs font-semibold text-slate-600">
                          {field.label}
                        </label>
                        <textarea
                          id={field.name}
                          name={field.name}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={value ?? ''}
                          onChange={onChange}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                        />
                      </div>
                    )
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <div key={field.name} className="flex items-center gap-2">
                        <input
                          id={field.name}
                          name={field.name}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={onChange}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor={field.name} className="text-xs text-slate-600">
                          {field.label}
                        </label>
                      </div>
                    )
                  }

                  return (
                    <div key={field.name} className="space-y-1">
                      <label htmlFor={field.name} className="text-xs font-semibold text-slate-600">
                        {field.label}
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type === 'password' ? 'password' : field.type ?? 'text'}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={value ?? ''}
                        onChange={onChange}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring"
                      />
                    </div>
                  )
                })
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {detailItem && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Detalle del registro</h3>
            <button
              type="button"
              onClick={() => setDetailItem(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(detailItem, null, 2)}
          </pre>
        </div>
      )}
    </section>
  )
}

export default ResourceCrud

