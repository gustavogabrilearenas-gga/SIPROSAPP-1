"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";
import { api } from "@/lib/api";

interface TurnoFormValues {
  id?: number;
  nombre: string;
  codigo: string;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

interface TurnoFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: TurnoFormValues | null;
  onSuccess?: () => void;
}

const emptyForm: TurnoFormValues = {
  nombre: "",
  codigo: "",
  horaInicio: "",
  horaFin: "",
  activo: true,
};

export default function TurnoFormModal({ open, onClose, initialData, onSuccess }: TurnoFormModalProps) {
  const [form, setForm] = useState<TurnoFormValues>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...initialData } : emptyForm);
    }
  }, [initialData, open]);

  const isEditMode = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const handleSubmit = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    const nombre = form.nombre.trim();

    if (!codigo) {
      showError("Datos incompletos", "El código del turno es obligatorio");
      return;
    }

    if (codigo.length !== 1) {
      showError("Código inválido", "El código debe ser de un solo caracter (ej: M, T, N)");
      return;
    }

    if (!nombre) {
      showError("Datos incompletos", "El nombre del turno es obligatorio");
      return;
    }

    if (!form.horaInicio || !form.horaFin) {
      showError("Datos incompletos", "Debe especificar las horas de inicio y fin");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      codigo,
      nombre,
      hora_inicio: form.horaInicio,
      hora_fin: form.horaFin,
      activo: form.activo,
    };

    try {
      if (isEditMode && form.id) {
        await api.updateTurno(form.id, payload);
        showSuccess("Turno actualizado correctamente");
      } else {
        await api.createTurno(payload);
        showSuccess("Turno creado correctamente");
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error?.message || "No se pudo guardar el turno";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Código <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="M"
              maxLength={1}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Turno Mañana"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Hora de inicio <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Hora de fin <span className="text-red-500">*</span>
              </label>
              <Input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="turno-activo"
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="turno-activo" className="text-sm text-gray-700">
              Turno activo
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isEditMode ? "Guardar cambios" : "Crear turno"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
