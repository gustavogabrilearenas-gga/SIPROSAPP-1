"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";

interface ParadaFormValues {
  tipo: string;
  categoria: string;
  motivo: string;
  descripcion: string;
}

interface ParadaFormModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  initialData?: ParadaFormValues | null;
}

const emptyForm: ParadaFormValues = {
  tipo: "",
  categoria: "",
  motivo: "",
  descripcion: "",
};

export default function ParadaFormModal({ open, onClose, initialData }: ParadaFormModalProps) {
  const [form, setForm] = useState<ParadaFormValues>(initialData ?? emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData, open]);

  const handleSubmit = async () => {
    try {
      // TODO: conectar con api.createParada o api.updateParada
      showSuccess("Parada guardada correctamente");
      onClose(false);
    } catch (err) {
      showError("Error al guardar la parada");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Parada" : "Nueva Parada"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            placeholder="Tipo de parada"
          />
          <Input
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Categoría"
          />
          <Input
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            placeholder="Motivo"
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
