"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";
import { api, handleApiError } from "@/lib/api";

interface UbicacionFormValues {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

interface UbicacionFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: UbicacionFormValues | null;
  onSuccess?: () => void;
}

const emptyForm: UbicacionFormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  activa: true,
};

export default function UbicacionFormModal({ open, onClose, initialData, onSuccess }: UbicacionFormModalProps) {
  const [form, setForm] = useState<UbicacionFormValues>(emptyForm);
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
      showError("Datos incompletos", "El código de la ubicación es obligatorio");
      return;
    }

    if (!nombre) {
      showError("Datos incompletos", "El nombre de la ubicación es obligatorio");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      codigo,
      nombre,
      descripcion: form.descripcion?.trim() ?? "",
      activa: form.activa,
    };

    try {
      if (isEditMode && form.id) {
        await api.updateUbicacion(form.id, payload);
        showSuccess("Ubicación actualizada correctamente");
      } else {
        await api.createUbicacion(payload);
        showSuccess("Ubicación creada correctamente");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      const { message } = handleApiError(error);
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
          <DialogTitle>{isEditMode ? "Editar Ubicación" : "Nueva Ubicación"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Código <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              placeholder="UBC-001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Sala de Compresión"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción breve de la ubicación"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="ubicacion-activa"
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="ubicacion-activa" className="text-sm text-gray-700">
              Ubicación activa
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isEditMode ? "Guardar cambios" : "Crear ubicación"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
