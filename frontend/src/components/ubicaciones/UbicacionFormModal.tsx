"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/components/common/toast-utils"
import { api, handleApiError, type CreateUbicacionPayload, type UpdateUbicacionPayload } from "@/lib/api"

interface UbicacionFormValues {
  id?: number
  codigo: string
  nombre: string
  tipo: string
  descripcion: string
  activa: boolean
}

interface UbicacionFormModalProps {
  open: boolean
  onClose: (open: boolean) => void
  onSubmitSuccess?: () => void
  initialData?: UbicacionFormValues | null
}

const emptyForm: UbicacionFormValues = {
  codigo: "",
  nombre: "",
  tipo: "PRODUCCION",
  descripcion: "",
  activa: true,
}

export default function UbicacionFormModal({
  open,
  onClose,
  onSubmitSuccess,
  initialData,
}: UbicacionFormModalProps) {
  const [form, setForm] = useState<UbicacionFormValues>(initialData ?? emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm)
    }
  }, [initialData, open])

  const tipoOptions = useMemo(
    () => [
      { value: "PRODUCCION", label: "Producción" },
      { value: "ALMACEN", label: "Almacén" },
      { value: "MANTENIMIENTO", label: "Mantenimiento" },
      { value: "SERVICIOS", label: "Servicios" },
    ],
    [],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialData ?? emptyForm)
    }
    onClose(nextOpen)
  }

  const validate = () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      showError("Faltan datos obligatorios", "Código y nombre son campos requeridos")
      return false
    }

    if (!form.tipo) {
      showError("Tipo requerido", "Seleccione un tipo de ubicación")
      return false
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    const payload: CreateUbicacionPayload | UpdateUbicacionPayload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || undefined,
      activa: form.activa,
    }

    try {
      if (form.id) {
        await api.updateUbicacion(form.id, payload)
        showSuccess("Ubicación actualizada", "Los datos se guardaron correctamente")
      } else {
        await api.createUbicacion(payload as CreateUbicacionPayload)
        showSuccess("Ubicación creada", "La ubicación fue registrada correctamente")
      }

      onSubmitSuccess?.()
      onClose(false)
      setForm(emptyForm)
    } catch (error) {
      const { message } = handleApiError(error)
      showError("Error al guardar la ubicación", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar Ubicación" : "Nueva Ubicación"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="ubicacion-codigo">
              Código
            </label>
            <Input
              id="ubicacion-codigo"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              placeholder="Ej: ALM-01"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="ubicacion-nombre">
              Nombre
            </label>
            <Input
              id="ubicacion-nombre"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre descriptivo"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="ubicacion-tipo">
              Tipo
            </label>
            <select
              id="ubicacion-tipo"
              value={form.tipo}
              onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tipoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="ubicacion-descripcion">
              Descripción
            </label>
            <textarea
              id="ubicacion-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Detalle de la ubicación"
              className="h-24 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm((prev) => ({ ...prev, activa: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Ubicación activa
          </label>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
