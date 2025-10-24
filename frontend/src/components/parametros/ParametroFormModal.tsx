'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/components/common/toast-utils';
import { api, handleApiError } from '@/lib/api';

interface ParametroFormValues {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  activo: boolean;
}

interface ParametroFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ParametroFormValues | null;
  onSuccess?: () => void;
}

const emptyForm: ParametroFormValues = {
  codigo: '',
  nombre: '',
  descripcion: '',
  unidad: '',
  activo: true,
};

export default function ParametroFormModal({ open, onClose, initialData, onSuccess }: ParametroFormModalProps) {
  const [form, setForm] = useState<ParametroFormValues>(emptyForm);
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
      unidad: form.unidad.trim(),
      activo: form.activo,
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
        await api.updateParametro(form.id, payload);
        showSuccess('Parámetro actualizado');
      } else {
        await api.createParametro(payload);
        showSuccess('Parámetro creado');
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
          <DialogTitle>{isEditMode ? 'Editar Parámetro' : 'Nuevo Parámetro'}</DialogTitle>
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
          <Input
            placeholder="Unidad"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            <span>Activo</span>
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
