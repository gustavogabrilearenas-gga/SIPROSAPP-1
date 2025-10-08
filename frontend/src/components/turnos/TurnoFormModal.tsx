"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/components/common/toast-utils"
import { api, handleApiError, type CreateTurnoPayload, type UpdateTurnoPayload } from "@/lib/api"

interface TurnoFormValues {
  id?: number
  nombre: string
  codigo: string
  horaInicio: string
  horaFin: string
  activo: boolean
}

interface TurnoFormModalProps {
  open: boolean
  onClose: (open: boolean) => void
  onSubmitSuccess?: () => void
  initialData?: TurnoFormValues | null
}

const emptyForm: TurnoFormValues = {
  nombre: "",
  codigo: "",
  horaInicio: "",
  horaFin: "",
  activo: true,
}

const codigoOptions = [
  { value: "M", label: "Mañana" },
  { value: "T", label: "Tarde" },
  { value: "N", label: "Noche" },
]

export default function TurnoFormModal({
  open,
  onClose,
  onSubmitSuccess,
  initialData,
}: TurnoFormModalProps) {
  const [form, setForm] = useState<TurnoFormValues>(initialData ?? emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm)
    }
  }, [initialData, open])

  const codigoDisponibles = useMemo(() => codigoOptions, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialData ?? emptyForm)
    }
    onClose(nextOpen)
  }

  const validate = () => {
    if (!form.nombre.trim() || !form.codigo.trim()) {
      showError("Campos obligatorios", "Nombre y código son requeridos")
      return false
    }

    if (!form.horaInicio || !form.horaFin) {
      showError("Horario incompleto", "Debe indicar hora de inicio y de fin")
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

    const payload: CreateTurnoPayload | UpdateTurnoPayload = {
      codigo: form.codigo.trim().toUpperCase().slice(0, 1),
      nombre: form.nombre.trim(),
      hora_inicio: form.horaInicio,
      hora_fin: form.horaFin,
      activo: form.activo,
    }

    try {
      if (form.id) {
        await api.updateTurno(form.id, payload)
        showSuccess("Turno actualizado", "Los cambios se guardaron correctamente")
      } else {
        await api.createTurno(payload as CreateTurnoPayload)
        showSuccess("Turno creado", "El turno fue registrado correctamente")
      }

      onSubmitSuccess?.()
      onClose(false)
      setForm(emptyForm)
    } catch (error) {
      const { message } = handleApiError(error)
      showError("Error al guardar el turno", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="turno-nombre">
              Nombre
            </label>
            <Input
              id="turno-nombre"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Turno Mañana"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="turno-codigo">
              Código
            </label>
            <select
              id="turno-codigo"
              value={form.codigo.toUpperCase()}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un código</option>
              {codigoDisponibles.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} - {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="turno-hora-inicio">
                Hora inicio
              </label>
              <Input
                id="turno-hora-inicio"
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm((prev) => ({ ...prev, horaInicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="turno-hora-fin">
                Hora fin
              </label>
              <Input
                id="turno-hora-fin"
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm((prev) => ({ ...prev, horaFin: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Turno activo
          </label>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
