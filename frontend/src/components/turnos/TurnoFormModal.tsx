"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/components/common/toast-utils";

interface TurnoFormValues {
  nombre: string;
  codigo: string;
  horaInicio: string;
  horaFin: string;
}

interface TurnoFormModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  initialData?: TurnoFormValues | null;
}

const emptyForm: TurnoFormValues = {
  nombre: "",
  codigo: "",
  horaInicio: "",
  horaFin: "",
};

export default function TurnoFormModal({ open, onClose, initialData }: TurnoFormModalProps) {
  const [form, setForm] = useState<TurnoFormValues>(initialData ?? emptyForm);

  useEffect(() => {
    setForm(initialData ?? emptyForm);
  }, [initialData, open]);

  const handleSubmit = async () => {
    try {
      // TODO: conectar con api.createTurno o api.updateTurno
      showSuccess("Turno guardado correctamente");
      onClose(false);
    } catch (err) {
      showError("Error al guardar el turno");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
          />
          <Input
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            placeholder="Código o tipo de turno"
          />
          <Input
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            placeholder="Hora de inicio"
          />
          <Input
            type="time"
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            placeholder="Hora de fin"
          />
          <Button onClick={handleSubmit}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
