'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/components/common/toast-utils';
import { api, handleApiError } from '@/lib/api';

interface FuncionFormValues {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

interface FuncionFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: FuncionFormValues | null;
  onSuccess?: () => void;
}

const emptyForm: FuncionFormValues = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activa: true,
};

export default function FuncionFormModal({ open, onClose, initialData, onSuccess }: FuncionFormModalProps) {
  const [form, setForm] = useState<FuncionFormValues>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...initialData } : emptyForm);
    }
  }, [initialData, open]);

  const isEditMode = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const handleSubmit = async () => {
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() ?? '',
      activa: form.activa,
    };

    if (!payload.codigo) {
      showError('Datos incompletos', 'El código es obligatorio');
      return;
    }

    if (!payload.nombre) {
      showError('Datos incompletos', 'El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && form.id) {
        await api.updateFuncion(form.id, payload);
        showSuccess('Función actualizada');
      } else {
        await api.createFuncion(payload);
        showSuccess('Función creada');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      const { message } = handleApiError(error);
      showError('Error al guardar', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Función' : 'Nueva Función'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4">
          <Input
            placeholder="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />
          <Input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <Input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            <span>Activa</span>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
