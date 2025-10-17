"""Señales Django para auditoría automática.

Sistema de trazabilidad completa de cambios en SIPROSA MES.
"""

import json
from threading import local

from django.apps import apps
from django.conf import settings
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from backend.auditoria.models import LogAuditoria
from backend.incidencias.models import Incidente
from backend.mantenimiento.models import OrdenTrabajo
from backend.produccion.models import Lote, LoteEtapa
from backend.usuarios.models import UserProfile


# Variable por hilo para almacenar el estado anterior del objeto antes de modificarlo
_lote_thread_state = local()

def _get_lote_state_storage():
    """Obtiene el contenedor por hilo para el estado previo de los lotes."""
    if not hasattr(_lote_thread_state, "data"):
        _lote_thread_state.data = {}
    return _lote_thread_state.data


@receiver(pre_save, sender=Lote)
def lote_pre_save(sender, instance, **kwargs):
    """
    Captura el estado ANTES de guardar para comparar cambios
    """
    if instance.pk:  # Solo si ya existe (edicion)
        storage = _get_lote_state_storage()
        try:
            anterior = Lote.objects.get(pk=instance.pk)
            storage[instance.pk] = {
                'codigo_lote': anterior.codigo_lote,
                'producto': anterior.producto.nombre if anterior.producto else None,
                'formula': str(anterior.formula) if anterior.formula else None,
                'cantidad_planificada': anterior.cantidad_planificada,
                'cantidad_producida': anterior.cantidad_producida,
                'cantidad_rechazada': anterior.cantidad_rechazada,
                'unidad': anterior.unidad,
                'estado': anterior.estado,
                'prioridad': anterior.prioridad,
                'fecha_planificada_inicio': anterior.fecha_planificada_inicio.isoformat() if anterior.fecha_planificada_inicio else None,
                'fecha_real_inicio': anterior.fecha_real_inicio.isoformat() if anterior.fecha_real_inicio else None,
                'fecha_planificada_fin': anterior.fecha_planificada_fin.isoformat() if anterior.fecha_planificada_fin else None,
                'fecha_real_fin': anterior.fecha_real_fin.isoformat() if anterior.fecha_real_fin else None,
                'turno': anterior.turno.nombre if anterior.turno else None,
                'supervisor': anterior.supervisor.username if anterior.supervisor else None,
                'observaciones': anterior.observaciones,
                'cancelado_por': anterior.cancelado_por.username if anterior.cancelado_por else None,
                'fecha_cancelacion': anterior.fecha_cancelacion.isoformat() if anterior.fecha_cancelacion else None,
                'motivo_cancelacion': anterior.motivo_cancelacion,
            }
        except Lote.DoesNotExist:
            pass


@receiver(post_save, sender=Lote)
def lote_post_save(sender, instance, created, **kwargs):
    """
    Registra en LogAuditoria después de crear o modificar un Lote
    """
    # Obtener el usuario actual del request (si está disponible)
    # En producción, esto se obtiene del middleware
    usuario = None
    if hasattr(instance, '_usuario_actual'):
        usuario = instance._usuario_actual
    elif instance.creado_por:
        usuario = instance.creado_por
    
    if created:
        # CREACIÓN de nuevo lote
        LogAuditoria.objects.create(
            usuario=usuario,
            accion='CREAR',
            modelo='Lote',
            objeto_id=instance.pk,
            objeto_str=str(instance),
            cambios={
                'estado_nuevo': {
                    'codigo_lote': instance.codigo_lote,
                    'producto': instance.producto.nombre if instance.producto else None,
                    'cantidad_planificada': instance.cantidad_planificada,
                    'estado': instance.estado,
                    'prioridad': instance.prioridad,
                    'supervisor': instance.supervisor.username if instance.supervisor else None,
                }
            },
            ip_address=getattr(instance, '_ip_address', None),
            user_agent=getattr(instance, '_user_agent', ''),
        )
    else:
        # MODIFICACIÓN de lote existente
        estado_anterior = _get_lote_state_storage().get(instance.pk, {})
        if estado_anterior:
            cambios = {}
            
            # Comparar cada campo
            estado_actual = {
                'codigo_lote': instance.codigo_lote,
                'producto': instance.producto.nombre if instance.producto else None,
                'formula': str(instance.formula) if instance.formula else None,
                'cantidad_planificada': instance.cantidad_planificada,
                'cantidad_producida': instance.cantidad_producida,
                'cantidad_rechazada': instance.cantidad_rechazada,
                'unidad': instance.unidad,
                'estado': instance.estado,
                'prioridad': instance.prioridad,
                'fecha_planificada_inicio': instance.fecha_planificada_inicio.isoformat() if instance.fecha_planificada_inicio else None,
                'fecha_real_inicio': instance.fecha_real_inicio.isoformat() if instance.fecha_real_inicio else None,
                'fecha_planificada_fin': instance.fecha_planificada_fin.isoformat() if instance.fecha_planificada_fin else None,
                'fecha_real_fin': instance.fecha_real_fin.isoformat() if instance.fecha_real_fin else None,
                'turno': instance.turno.nombre if instance.turno else None,
                'supervisor': instance.supervisor.username if instance.supervisor else None,
                'observaciones': instance.observaciones,
                'cancelado_por': instance.cancelado_por.username if instance.cancelado_por else None,
                'fecha_cancelacion': instance.fecha_cancelacion.isoformat() if instance.fecha_cancelacion else None,
                'motivo_cancelacion': instance.motivo_cancelacion,
            }
            
            # Detectar cambios
            for campo, valor_nuevo in estado_actual.items():
                valor_anterior = estado_anterior.get(campo)
                if valor_anterior != valor_nuevo:
                    cambios[campo] = {
                        'antes': valor_anterior,
                        'despues': valor_nuevo
                    }
            
            # Si hubo cambios, registrar en auditoría
            if cambios:
                # Determinar si fue una CANCELACIÓN
                accion = 'MODIFICAR'
                if 'estado' in cambios and cambios['estado']['despues'] == 'CANCELADO':
                    accion = 'CANCELAR'
                    usuario = instance.cancelado_por or usuario
                
                LogAuditoria.objects.create(
                    usuario=usuario,
                    accion=accion,
                    modelo='Lote',
                    objeto_id=instance.pk,
                    objeto_str=str(instance),
                    cambios=cambios,
                    ip_address=getattr(instance, '_ip_address', None),
                    user_agent=getattr(instance, '_user_agent', ''),
                )
            
            # Limpiar el estado anterior
            _get_lote_state_storage().pop(instance.pk, None)


@receiver(post_delete, sender=Lote)
def lote_post_delete(sender, instance, **kwargs):
    """
    Registra en LogAuditoria cuando se ELIMINA un Lote
    (Esto NO debería pasar en producción, pero lo registramos por si acaso)
    """
    usuario = getattr(instance, '_usuario_actual', None)
    
    LogAuditoria.objects.create(
        usuario=usuario,
        accion='ELIMINAR',
        modelo='Lote',
        objeto_id=instance.pk,
        objeto_str=str(instance),
        cambios={
            'estado_eliminado': {
                'codigo_lote': instance.codigo_lote,
                'producto': instance.producto.nombre if instance.producto else None,
                'estado': instance.estado,
            }
        },
        ip_address=getattr(instance, '_ip_address', None),
        user_agent=getattr(instance, '_user_agent', ''),
    )


UserModel = apps.get_model(settings.AUTH_USER_MODEL)


@receiver(post_save, sender=UserModel)
def update_existing_user_profile(sender, instance, created, **kwargs):
    """Actualiza el perfil del usuario solo si ya existe."""
    try:
        profile = instance.user_profile
    except UserProfile.DoesNotExist:
        # La creación del perfil se delega al serializer de usuarios
        return

    if not created:
        profile.save()




