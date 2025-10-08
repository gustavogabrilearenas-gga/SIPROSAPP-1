"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { showError, showSuccess } from "@/components/common/toast-utils"
import { api, handleApiError, type CreateParadaPayload, type UpdateParadaPayload } from "@/lib/api"
import { useAuth } from "@/stores/auth-store"

interface ParadaFormValues {
  id?: number
  loteEtapa: string
  tipo: string
  categoria: string
  descripcion: string
  fechaInicio: string
  solucion: string
}

interface ParadaFormModalProps {
  open: boolean
  onClose: (open: boolean) => void
  onSubmitSuccess?: () => void
  initialData?: ParadaFormValues | null
}

const getNowLocal = () => {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString().slice(0, 16)
}

const emptyForm: ParadaFormValues = {
  loteEtapa: "",
  tipo: "PLANIFICADA",
  categoria: "FALLA_EQUIPO",
  descripcion: "",
  fechaInicio: getNowLocal(),
  solucion: "",
}

const tipoOptions = [
  { value: "PLANIFICADA", label: "Planificada" },
  { value: "NO_PLANIFICADA", label: "No planificada" },
]

const categoriaOptions = [
  { value: "FALLA_EQUIPO", label: "Falla de equipo" },
  { value: "FALTA_INSUMO", label: "Falta de insumo" },
  { value: "CAMBIO_FORMATO", label: "Cambio de formato" },
  { value: "LIMPIEZA", label: "Limpieza" },
  { value: "CALIDAD", label: "Calidad" },
  { value: "OTROS", label: "Otros" },
]

export default function ParadaFormModal({
  open,
  onClose,
  onSubmitSuccess,
  initialData,
}: ParadaFormModalProps) {
  const [form, setForm] = useState<ParadaFormValues>(initialData ?? emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm)
    }
  }, [initialData, open])

  const tipos = useMemo(() => tipoOptions, [])
  const categorias = useMemo(() => categoriaOptions, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialData ?? emptyForm)
    }
    onClose(nextOpen)
  }

  const validate = () => {
    if (!form.loteEtapa.trim()) {
      showError("Lote/Etapa requerido", "Debe indicar el identificador de la etapa del lote")
      return false
    }

    const loteId = Number(form.loteEtapa)
    if (Number.isNaN(loteId) || loteId <= 0) {
      showError("Identificador inválido", "El ID de lote/etapa debe ser un número válido")
      return false
    }

    if (!form.descripcion.trim()) {
      showError("Descripción requerida", "Agregue un detalle de la parada")
      return false
    }

    if (!user?.id) {
      showError("Sesión no válida", "No se pudo identificar al usuario actual")
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

    const loteId = Number(form.loteEtapa)

    const payload: CreateParadaPayload | UpdateParadaPayload = {
      lote_etapa: loteId,
      tipo: form.tipo,
      categoria: form.categoria,
      descripcion: form.descripcion.trim(),
      fecha_inicio: new Date(form.fechaInicio).toISOString(),
      solucion: form.solucion.trim() || undefined,
      registrado_por: user?.id,
    }

    try {
      if (form.id) {
        await api.updateParada(form.id, payload)
        showSuccess("Parada actualizada", "Los cambios se guardaron correctamente")
      } else {
        await api.createParada(payload as CreateParadaPayload)
        showSuccess("Parada registrada", "La parada se creó correctamente")
      }

      onSubmitSuccess?.()
      onClose(false)
      setForm(emptyForm)
    } catch (error) {
      const { message } = handleApiError(error)
      showError("Error al guardar la parada", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar Parada" : "Nueva Parada"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="parada-lote-etapa">
              ID Lote/Etapa
            </label>
            <Input
              id="parada-lote-etapa"
              value={form.loteEtapa}
              onChange={(e) => setForm((prev) => ({ ...prev, loteEtapa: e.target.value }))}
              placeholder="Ej: 102"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="parada-tipo">
                Tipo
              </label>
              <select
                id="parada-tipo"
                value={form.tipo}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {tipos.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="parada-categoria">
                Categoría
              </label>
              <select
                id="parada-categoria"
                value={form.categoria}
                onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categorias.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="parada-fecha-inicio">
              Inicio de la parada
            </label>
            <Input
              id="parada-fecha-inicio"
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="parada-descripcion">
              Descripción
            </label>
            <textarea
              id="parada-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Detalle de la incidencia"
              className="h-24 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="parada-solucion">
              Solución (opcional)
            </label>
            <textarea
              id="parada-solucion"
              value={form.solucion}
              onChange={(e) => setForm((prev) => ({ ...prev, solucion: e.target.value }))}
              placeholder="Acción tomada"
              className="h-20 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
