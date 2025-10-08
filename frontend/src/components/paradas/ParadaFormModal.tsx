"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";
import { api } from "@/lib/api";

type ParadaTipo = "PLANIFICADA" | "NO_PLANIFICADA";
type ParadaCategoria =
  | "FALLA_EQUIPO"
  | "FALTA_INSUMO"
  | "CAMBIO_FORMATO"
  | "LIMPIEZA"
  | "CALIDAD"
  | "OTROS";

interface ParadaFormValues {
  id?: number;
  loteEtapa: number | "";
  tipo: ParadaTipo;
  categoria: ParadaCategoria;
  fechaInicio: string;
  descripcion: string;
  solucion: string;
}

interface ParadaFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ParadaFormValues | null;
  onSuccess?: () => void;
  currentUserId?: number | null;
}

interface LoteEtapaOption {
  id: number;
  label: string;
}

const toDateTimeLocal = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const emptyForm: ParadaFormValues = {
  loteEtapa: "",
  tipo: "PLANIFICADA",
  categoria: "FALLA_EQUIPO",
  fechaInicio: toDateTimeLocal(new Date()),
  descripcion: "",
  solucion: "",
};

const tipoOptions: Array<{ value: ParadaTipo; label: string }> = [
  { value: "PLANIFICADA", label: "Planificada" },
  { value: "NO_PLANIFICADA", label: "No planificada" },
];

const categoriaOptions: Array<{ value: ParadaCategoria; label: string }> = [
  { value: "FALLA_EQUIPO", label: "Falla de equipo" },
  { value: "FALTA_INSUMO", label: "Falta de insumo" },
  { value: "CAMBIO_FORMATO", label: "Cambio de formato" },
  { value: "LIMPIEZA", label: "Limpieza" },
  { value: "CALIDAD", label: "Problema de calidad" },
  { value: "OTROS", label: "Otros" },
];

export default function ParadaFormModal({
  open,
  onClose,
  initialData,
  onSuccess,
  currentUserId,
}: ParadaFormModalProps) {
  const [form, setForm] = useState<ParadaFormValues>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loteEtapas, setLoteEtapas] = useState<LoteEtapaOption[]>([]);
  const [isLoadingLoteEtapas, setIsLoadingLoteEtapas] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              ...initialData,
              fechaInicio: toDateTimeLocal(initialData.fechaInicio),
            }
          : { ...emptyForm, fechaInicio: toDateTimeLocal(new Date()) },
      );
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchLoteEtapas = async () => {
      setIsLoadingLoteEtapas(true);
      try {
        const response = await api.getLotesEtapas({ ordering: "-fecha_inicio", page_size: 100 });
        const results = (response as any).results ?? response;

        const options = (results as Array<Record<string, any>>).map((item) => ({
          id: item.id,
          label: `${item.lote_codigo ?? item.lote} - ${item.etapa_nombre ?? item.etapa}`,
        }));

        setLoteEtapas(options);
      } catch (error: any) {
        const message = error?.message || "No se pudieron cargar las etapas de lote";
        showError("Error al cargar etapas", message);
      } finally {
        setIsLoadingLoteEtapas(false);
      }
    };

    fetchLoteEtapas();
  }, [open]);

  const isEditMode = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const handleSubmit = async () => {
    if (!form.loteEtapa) {
      showError("Datos incompletos", "Debe seleccionar la etapa del lote");
      return;
    }

    if (!form.descripcion.trim()) {
      showError("Datos incompletos", "La descripción de la parada es obligatoria");
      return;
    }

    if (!currentUserId && !isEditMode) {
      showError("Sesión inválida", "No se pudo determinar el usuario registrado");
      return;
    }

    const fechaInicioIso = form.fechaInicio
      ? new Date(form.fechaInicio).toISOString()
      : new Date().toISOString();

    const payload: Record<string, unknown> = {
      lote_etapa: form.loteEtapa,
      tipo: form.tipo,
      categoria: form.categoria,
      fecha_inicio: fechaInicioIso,
      descripcion: form.descripcion.trim(),
      solucion: form.solucion.trim(),
    };

    if (!isEditMode && currentUserId) {
      payload.registrado_por = currentUserId;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && form.id) {
        await api.updateParada(form.id, payload);
        showSuccess("Parada actualizada correctamente");
      } else {
        await api.createParada(payload);
        showSuccess("Parada registrada correctamente");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error?.message || "No se pudo guardar la parada";
      showError("Error al guardar", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Parada" : "Nueva Parada"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Etapa del lote <span className="text-red-500">*</span>
            </label>
            <select
              value={form.loteEtapa}
              onChange={(e) =>
                setForm({ ...form, loteEtapa: e.target.value ? Number(e.target.value) : "" })
              }
              disabled={isEditMode}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>
                {isLoadingLoteEtapas ? "Cargando etapas..." : "Seleccione una etapa"}
              </option>
              {loteEtapas.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as ParadaTipo })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as ParadaCategoria })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoriaOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Inicio de la parada <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalle el motivo de la parada"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Solución aplicada</label>
            <textarea
              value={form.solucion}
              onChange={(e) => setForm({ ...form, solucion: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalle la solución aplicada (opcional)"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isEditMode ? "Guardar cambios" : "Registrar parada"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
