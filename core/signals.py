"""
Señales Django para auditoría automática
Sistema de trazabilidad completa de cambios en SIPROSA MES
"""

from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from threading import local
from .models import LogAuditoria, Notificacion, Incidente, OrdenTrabajo
from backend.produccion.models import Lote, LoteEtapa
from backend.usuarios.models import UserProfile
import json


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


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Crea o actualiza automáticamente un UserProfile cuando se crea/guarda un User.
    """
    if created:
        UserProfile.objects.create(user=instance)
    instance.profile.save() # Guarda el perfil si ya existe y hay cambios


# ============================================
# SEÑALES PARA NOTIFICACIONES
# ============================================

def _crear_notificacion(usuarios, tipo, titulo, mensaje, referencia_modelo=None, referencia_id=None):
    """Función auxiliar para crear notificaciones para múltiples usuarios"""
    if not isinstance(usuarios, list):
        usuarios = [usuarios]
    
    for usuario in usuarios:
        if usuario:
            Notificacion.objects.create(
                usuario=usuario,
                tipo=tipo,
                titulo=titulo,
                mensaje=mensaje,
                referencia_modelo=referencia_modelo,
                referencia_id=referencia_id
            )


@receiver(post_save, sender=LoteEtapa)
def notificar_pausa_etapa(sender, instance, created, **kwargs):
    """Notificar cuando se pausa una etapa"""
    if not created and instance.estado == 'PAUSADO':
        # Notificar al supervisor del lote
        _crear_notificacion(
            usuarios=instance.lote.supervisor,
            tipo='ADVERTENCIA',
            titulo=f'Etapa pausada: {instance.etapa.nombre}',
            mensaje=f'La etapa {instance.etapa.nombre} del lote {instance.lote.codigo_lote} ha sido pausada.',
            referencia_modelo='LoteEtapa',
            referencia_id=instance.id
        )


@receiver(post_save, sender=Incidente)
def notificar_incidente_critico(sender, instance, created, **kwargs):
    """Notificar cuando se crea un incidente crítico"""
    if created and instance.severidad == 'CRITICA':
        # Obtener usuarios del área de Calidad y Mantenimiento
        usuarios_calidad = User.objects.filter(
            profile__area='CALIDAD',
            is_active=True
        )
        
        _crear_notificacion(
            usuarios=list(usuarios_calidad),
            tipo='URGENTE',
            titulo=f'Incidente CRÍTICO: {instance.codigo}',
            mensaje=f'Se ha reportado un incidente crítico: {instance.titulo}. Requiere atención inmediata.',
            referencia_modelo='Incidente',
            referencia_id=instance.id
        )
    
    # Notificar al asignado cuando cambia el estado a CERRADO
    if not created and instance.estado == 'CERRADO' and instance.asignado_a:
        _crear_notificacion(
            usuarios=instance.asignado_a,
            tipo='INFO',
            titulo=f'Incidente cerrado: {instance.codigo}',
            mensaje=f'El incidente {instance.codigo} - {instance.titulo} ha sido cerrado.',
            referencia_modelo='Incidente',
            referencia_id=instance.id
        )


@receiver(post_save, sender=OrdenTrabajo)
def notificar_orden_trabajo_urgente(sender, instance, created, **kwargs):
    """Notificar cuando se crea una OT urgente"""
    if created and instance.prioridad == 'URGENTE':
        # Notificar a usuarios del área de Mantenimiento
        usuarios_mantenimiento = User.objects.filter(
            profile__area='MANTENIMIENTO',
            is_active=True
        )
        
        _crear_notificacion(
            usuarios=list(usuarios_mantenimiento),
            tipo='URGENTE',
            titulo=f'OT URGENTE: {instance.codigo}',
            mensaje=f'Nueva orden de trabajo urgente: {instance.titulo} - Máquina: {instance.maquina.nombre}',
            referencia_modelo='OrdenTrabajo',
            referencia_id=instance.id
        )
    
    # Notificar al técnico asignado
    if not created and instance.asignada_a:
        # Verificar si cambió la asignación
        try:
            anterior = OrdenTrabajo.objects.get(pk=instance.pk)
            if anterior.asignada_a != instance.asignada_a:
                _crear_notificacion(
                    usuarios=instance.asignada_a,
                    tipo='INFO',
                    titulo=f'OT asignada: {instance.codigo}',
                    mensaje=f'Se te ha asignado la orden de trabajo: {instance.titulo}',
                    referencia_modelo='OrdenTrabajo',
                    referencia_id=instance.id
                )
        except OrdenTrabajo.DoesNotExist:
            pass

