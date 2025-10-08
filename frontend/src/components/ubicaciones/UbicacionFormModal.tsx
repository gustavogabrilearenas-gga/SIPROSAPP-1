"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";

interface UbicacionFormValues {
  nombre: string;
  descripcion: string;
}

interface UbicacionFormModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  initialData?: UbicacionFormValues | null;
}

const emptyForm: UbicacionFormValues = {
  nombre: "",
  descripcion: "",
};

export default function UbicacionFormModal({ open, onClose, initialData }: UbicacionFormModalProps) {
  const [form, setForm] = useState<UbicacionFormValues>(initialData ?? emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData, open]);

  const handleSubmit = async () => {
    try {
      // TODO: conectar con api.createUbicacion o api.updateUbicacion
      showSuccess("Ubicación guardada correctamente");
      onClose(false);
    } catch (err) {
      showError("Error al guardar la ubicación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Ubicación" : "Nueva Ubicación"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
          />
          <Input
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción"
          />
          <Button onClick={handleSubmit}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
