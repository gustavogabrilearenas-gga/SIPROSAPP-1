'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError, showSuccess } from '@/components/common/toast-utils';
import { api, handleApiError, unpackResults } from '@/lib/api';
import type { Maquina, Ubicacion } from '@/types/models';

interface MaquinaFormValues {
  id?: number;
  codigo: string;
  nombre: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  descripcion: string;
  ubicacion: number | null;
  activa: boolean;
}

interface MaquinaFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Maquina | null;
  onSuccess?: () => void;
}

const emptyForm: MaquinaFormValues = {
  codigo: '',
  nombre: '',
  tipo: '',
  fabricante: '',
  modelo: '',
  descripcion: '',
  ubicacion: null,
  activa: true,
};

const TIPO_CHOICES = [
  { value: 'COMPRESION', label: 'Compresión' },
  { value: 'MEZCLADO', label: 'Mezclado' },
  { value: 'GRANULACION', label: 'Granulación' },
  { value: 'EMBLISTADO', label: 'Emblistado' },
  { value: 'SERVICIOS', label: 'Servicios' },
];

export default function MaquinaFormModal({ open, onClose, initialData, onSuccess }: MaquinaFormModalProps) {
  const [form, setForm] = useState<MaquinaFormValues>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              id: initialData.id,
              codigo: initialData.codigo,
              nombre: initialData.nombre,
              tipo: initialData.tipo,
              fabricante: initialData.fabricante ?? '',
              modelo: initialData.modelo ?? '',
              descripcion: initialData.descripcion ?? '',
              ubicacion: initialData.ubicacion ?? null,
              activa: initialData.activa,
            }
          : emptyForm,
      );

      // cargar ubicaciones solo una vez
      void fetchUbicaciones();
    }
  }, [initialData, open]);

  const fetchUbicaciones = async () => {
    try {
      const response = await api.getUbicaciones({ page_size: 200 });
      setUbicaciones(unpackResults(response));
    } catch (err) {
      // silencioso
    }
  };

  const isEditMode = useMemo(() => Boolean(initialData?.id), [initialData?.id]);

  const handleSubmit = async () => {
    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      fabricante: form.fabricante.trim(),
      modelo: form.modelo.trim(),
      descripcion: form.descripcion.trim(),
      ubicacion: form.ubicacion,
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

    if (!payload.tipo) {
      showError('Datos incompletos', 'Debe seleccionar un tipo de máquina');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode && form.id) {
        await api.updateMaquina(form.id, payload);
        showSuccess('Máquina actualizada');
      } else {
        await api.createMaquina(payload);
        showSuccess('Máquina creada');
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Máquina' : 'Nueva Máquina'}</DialogTitle>
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
          <Select value={form.tipo} onValueChange={(value) => setForm({ ...form, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de máquina" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_CHOICES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={form.ubicacion ? String(form.ubicacion) : ''}
            onValueChange={(value) => setForm({ ...form, ubicacion: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              {ubicaciones.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Fabricante"
            value={form.fabricante}
            onChange={(e) => setForm({ ...form, fabricante: e.target.value })}
          />
          <Input
            placeholder="Modelo"
            value={form.modelo}
            onChange={(e) => setForm({ ...form, modelo: e.target.value })}
          />
          <Input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            <span>Máquina activa</span>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
