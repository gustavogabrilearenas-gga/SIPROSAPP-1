"""
Modelos de datos para SIPROSA MES
Sistema de Gestión de Manufactura para Planta Farmacéutica
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import hashlib

from backend.usuarios.models import Rol, UserProfile, UsuarioRol
from backend.mantenimiento.models import (
    HistorialMantenimiento,
    IndicadorMantenimiento,
    OrdenTrabajo,
    OrdenTrabajoRepuesto,
    PlanMantenimiento,
    TipoMantenimiento,
)


# ============================================
# 2. MÓDULO: CATÁLOGOS MAESTROS
# ============================================

class Ubicacion(models.Model):
    """Áreas físicas de la planta"""
    
    TIPO_CHOICES = [
        ('PRODUCCION', 'Producción'),
        ('ALMACEN', 'Almacén'),
        ('MANTENIMIENTO', 'Mantenimiento'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Ubicación"
        verbose_name_plural = "Ubicaciones"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Maquina(models.Model):
    """Equipos de producción y servicios"""
    
    TIPO_CHOICES = [
        ('COMPRESION', 'Compresión'),
        ('MEZCLADO', 'Mezclado'),
        ('GRANULACION', 'Granulación'),
        ('EMBLISTADO', 'Emblistado'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    fabricante = models.CharField(max_length=100, blank=True)
    modelo = models.CharField(max_length=100, blank=True)
    numero_serie = models.CharField(max_length=100, blank=True, verbose_name="Número de Serie")
    año_fabricacion = models.IntegerField(null=True, blank=True, verbose_name="Año de Fabricación")
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='maquinas')
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    capacidad_nominal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unidad_capacidad = models.CharField(max_length=20, blank=True, help_text="ej: comprimidos/hora, kg/batch")
    activa = models.BooleanField(default=True)
    requiere_calificacion = models.BooleanField(default=False, verbose_name="Requiere Calificación")
    fecha_instalacion = models.DateField(null=True, blank=True, verbose_name="Fecha de Instalación")
    imagen = models.ImageField(upload_to='maquinas/', null=True, blank=True)
    documentos = models.JSONField(default=list, help_text="Lista de documentos: [{nombre, url}]")
    
    class Meta:
        verbose_name = "Máquina"
        verbose_name_plural = "Máquinas"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Producto(models.Model):
    """Catálogo de productos farmacéuticos"""
    
    FORMA_CHOICES = [
        ('COMPRIMIDO', 'Comprimido'),
        ('CREMA', 'Crema'),
        ('SOLUCION', 'Solución'),
    ]
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=200)
    forma_farmaceutica = models.CharField(max_length=20, choices=FORMA_CHOICES, verbose_name="Forma Farmacéutica")
    principio_activo = models.CharField(max_length=200)
    concentracion = models.CharField(max_length=50)
    unidad_medida = models.CharField(max_length=20, help_text="comprimidos, gramos, ml")
    lote_minimo = models.IntegerField(validators=[MinValueValidator(1)])
    lote_optimo = models.IntegerField(validators=[MinValueValidator(1)])
    tiempo_vida_util_meses = models.IntegerField(validators=[MinValueValidator(1)])
    requiere_cadena_frio = models.BooleanField(default=False)
    registro_anmat = models.CharField(max_length=50, blank=True)
    activo = models.BooleanField(default=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Formula(models.Model):
    """Recetas de producción (Master Formula)"""
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='formulas')
    version = models.CharField(max_length=20, help_text="ej: v1.0, v2.1")
    fecha_vigencia_desde = models.DateField()
    fecha_vigencia_hasta = models.DateField(null=True, blank=True)
    rendimiento_teorico = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])
    tiempo_estimado_horas = models.DecimalField(max_digits=5, decimal_places=2)
    aprobada_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='formulas_aprobadas')
    fecha_aprobacion = models.DateField()
    observaciones = models.TextField(blank=True)
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Fórmula"
        verbose_name_plural = "Fórmulas"
        unique_together = ['producto', 'version']
        ordering = ['-fecha_vigencia_desde']
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.version}"


class EtapaProduccion(models.Model):
    """Catálogo de etapas del proceso productivo"""
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    orden_tipico = models.IntegerField(help_text="Orden típico en el proceso")
    requiere_registro_parametros = models.BooleanField(default=False)
    parametros_esperados = models.JSONField(
        default=list, 
        help_text="Lista de parámetros: [{nombre, unidad, min, max}]"
    )
    activa = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Etapa de Producción"
        verbose_name_plural = "Etapas de Producción"
        ordering = ['orden_tipico']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Turno(models.Model):
    """Turnos de trabajo"""
    
    codigo = models.CharField(max_length=1, unique=True, choices=[
        ('M', 'Mañana'),
        ('T', 'Tarde'),
        ('N', 'Noche'),
    ])
    nombre = models.CharField(max_length=20)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Turno"
        verbose_name_plural = "Turnos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.nombre} ({self.hora_inicio} - {self.hora_fin})"


class TipoDocumento(models.Model):
    """Tipos de documentos (SOPs, IT, FT, etc.)"""
    
    codigo = models.CharField(max_length=10, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de Documento"
        verbose_name_plural = "Tipos de Documentos"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ============================================
# 3. MÓDULO: PRODUCCIÓN
# ============================================

class Desviacion(models.Model):
    """Desviaciones del proceso (Deviations)"""
    
    SEVERIDAD_CHOICES = [
        ('CRITICA', 'Crítica'),
        ('MAYOR', 'Mayor'),
        ('MENOR', 'Menor'),
    ]
    
    ESTADO_CHOICES = [
        ('ABIERTA', 'Abierta'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('EN_CAPA', 'En CAPA'),
        ('CERRADA', 'Cerrada'),
    ]
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    lote = models.ForeignKey('core.Lote', on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
    lote_etapa = models.ForeignKey('core.LoteEtapa', on_delete=models.PROTECT, null=True, blank=True, related_name='desviaciones')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTA')
    fecha_deteccion = models.DateTimeField()
    detectado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='desviaciones_detectadas')
    area_responsable = models.CharField(max_length=50, blank=True)
    impacto_calidad = models.TextField(blank=True)
    impacto_seguridad = models.TextField(blank=True)
    impacto_eficacia = models.TextField(blank=True)
    investigacion_realizada = models.TextField(blank=True)
    causa_raiz = models.TextField(blank=True)
    accion_inmediata = models.TextField(blank=True)
    requiere_capa = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    cerrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='desviaciones_cerradas')
    
    class Meta:
        verbose_name = "Desviación"
        verbose_name_plural = "Desviaciones"
        ordering = ['-fecha_deteccion']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo}"


class DocumentoVersionado(models.Model):
    """Sistema de documentos versionados (SOPs, procedimientos, etc.)"""
    
    TIPO_CHOICES = [
        ('SOP', 'Standard Operating Procedure'),
        ('IT', 'Instrucción de Trabajo'),
        ('FT', 'Ficha Técnica'),
        ('PL', 'Protocolo'),
        ('REG', 'Registro'),
    ]
    
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('EN_REVISION', 'En Revisión'),
        ('APROBADO', 'Aprobado'),
        ('VIGENTE', 'Vigente'),
        ('OBSOLETO', 'Obsoleto'),
    ]
    
    codigo = models.CharField(max_length=50, verbose_name="Código")
    titulo = models.CharField(max_length=200)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    version = models.CharField(max_length=20)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='documentos_creados')
    fecha_revision = models.DateTimeField(null=True, blank=True)
    revisado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_revisados')
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    aprobado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_aprobados')
    fecha_vigencia_inicio = models.DateField(null=True, blank=True)
    fecha_vigencia_fin = models.DateField(null=True, blank=True)
    contenido = models.TextField(blank=True, help_text="Contenido del documento o referencia")
    archivo_url = models.CharField(max_length=500, blank=True)
    hash_sha256 = models.CharField(max_length=64, blank=True)
    cambios_version = models.TextField(blank=True, help_text="Resumen de cambios en esta versión")
    documento_anterior = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versiones_siguientes')
    
    class Meta:
        verbose_name = "Documento Versionado"
        verbose_name_plural = "Documentos Versionados"
        ordering = ['-fecha_creacion']
        unique_together = ['codigo', 'version']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo} (v{self.version})"


# ============================================
# 4. MÓDULO: INVENTARIO
# ============================================

    def __str__(self):
        return f"{self.maquina.codigo} - {self.get_periodo_display()} ({self.fecha_inicio})"


# ============================================
# 6. MÓDULO: INCIDENTES
# ============================================

class TipoIncidente(models.Model):
    """Categorías de incidentes"""
    
    codigo = models.CharField(max_length=20, unique=True, verbose_name="Código")
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, verbose_name="Descripción")
    requiere_investigacion = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Tipo de Incidente"
        verbose_name_plural = "Tipos de Incidentes"
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Incidente(models.Model):
    """Registro de incidentes"""
    
    SEVERIDAD_CHOICES = [
        ('MENOR', 'Menor'),
        ('MODERADA', 'Moderada'),
        ('MAYOR', 'Mayor'),
        ('CRITICA', 'Crítica'),
    ]
    
    ESTADO_CHOICES = [
        ('ABIERTO', 'Abierto'),
        ('EN_INVESTIGACION', 'En Investigación'),
        ('ACCION_CORRECTIVA', 'Acción Correctiva'),
        ('CERRADO', 'Cerrado'),
    ]
    
    codigo = models.CharField(max_length=30, unique=True, verbose_name="Código")
    tipo = models.ForeignKey(TipoIncidente, on_delete=models.PROTECT)
    severidad = models.CharField(max_length=10, choices=SEVERIDAD_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ABIERTO')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_ocurrencia = models.DateTimeField()
    ubicacion = models.ForeignKey(Ubicacion, on_delete=models.PROTECT, related_name='incidentes')
    maquina = models.ForeignKey(Maquina, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    lote_afectado = models.ForeignKey('core.Lote', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes')
    reportado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='incidentes_reportados')
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    asignado_a = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes_asignados')
    impacto_produccion = models.TextField(blank=True)
    impacto_calidad = models.TextField(blank=True)
    impacto_seguridad = models.TextField(blank=True)
    requiere_notificacion_anmat = models.BooleanField(default=False)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    cerrado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes_cerrados')
    
    class Meta:
        verbose_name = "Incidente"
        verbose_name_plural = "Incidentes"
        ordering = ['-fecha_ocurrencia']
    
    def __str__(self):
        return f"{self.codigo} - {self.titulo}"


class InvestigacionIncidente(models.Model):
    """Análisis de causa raíz de incidentes"""
    
    METODOLOGIA_CHOICES = [
        ('5_PORQUES', '5 Porqués'),
        ('ISHIKAWA', 'Diagrama de Ishikawa'),
        ('FMEA', 'FMEA'),
        ('OTRO', 'Otro'),
    ]
    
    incidente = models.OneToOneField(Incidente, on_delete=models.CASCADE, related_name='investigacion')
    metodologia = models.CharField(max_length=20, choices=METODOLOGIA_CHOICES)
    causa_raiz = models.TextField()
    analisis_detallado = models.TextField()
    diagrama_url = models.CharField(max_length=500, blank=True)
    fecha_investigacion = models.DateTimeField(auto_now_add=True)
    investigado_por = models.ForeignKey(User, on_delete=models.PROTECT, related_name='investigaciones_realizadas')
    
    class Meta:
        verbose_name = "Investigación de Incidente"
        verbose_name_plural = "Investigaciones de Incidentes"
    
    def __str__(self):
        return f"Investigación - {self.incidente.codigo}"


class AccionCorrectiva(models.Model):
    """Acciones correctivas y preventivas (CAPA)"""
    
    TIPO_CHOICES = [
        ('CORRECTIVA', 'Correctiva'),
        ('PREVENTIVA', 'Preventiva'),
    ]
    
    ESTADO_CHOICES = [
        ('PLANIFICADA', 'Planificada'),
        ('EN_PROCESO', 'En Proceso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE, related_name='acciones_correctivas')
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    responsable = models.ForeignKey(User, on_delete=models.PROTECT, related_name='acciones_responsable')
    fecha_planificada = models.DateField()
    fecha_implementacion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='PLANIFICADA')
    eficacia_verificada = models.BooleanField(default=False)
    verificado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='acciones_verificadas')
    fecha_verificacion = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Acción Correctiva"
        verbose_name_plural = "Acciones Correctivas"
        ordering = ['-fecha_planificada']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.incidente.codigo}"


# ============================================
# 7. MÓDULO: AUDITORÍA
# ============================================

class LogAuditoria(models.Model):
    """Registro completo de todas las acciones en el sistema"""
    
    ACCION_CHOICES = [
        ('CREAR', 'Crear'),
        ('MODIFICAR', 'Modificar'),
        ('ELIMINAR', 'Eliminar'),
        ('CANCELAR', 'Cancelar'),
        ('VER', 'Ver'),
        ('EXPORTAR', 'Exportar'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='acciones_auditoria')
    accion = models.CharField(max_length=10, choices=ACCION_CHOICES)
    modelo = models.CharField(max_length=100, help_text="Nombre del modelo afectado")
    objeto_id = models.IntegerField()
    objeto_str = models.CharField(max_length=200)
    cambios = models.JSONField(default=dict, help_text="Estructura: {campo: {antes: X, despues: Y}}")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log de Auditoría"
        verbose_name_plural = "Logs de Auditoría"
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['usuario', '-fecha']),
            models.Index(fields=['modelo', 'objeto_id']),
        ]
    
    def __str__(self):
        return f"{self.usuario} - {self.get_accion_display()} - {self.modelo} ({self.fecha.strftime('%Y-%m-%d %H:%M')})"


class Notificacion(models.Model):
    """Sistema de notificaciones para usuarios"""
    
    TIPO_CHOICES = [
        ('INFO', 'Información'),
        ('ADVERTENCIA', 'Advertencia'),
        ('ERROR', 'Error'),
        ('URGENTE', 'Urgente'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    referencia_modelo = models.CharField(max_length=100, null=True, blank=True)
    referencia_id = models.IntegerField(null=True, blank=True)
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_lectura = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['usuario', 'leida', '-fecha_creacion']),
        ]
    
    def __str__(self):
        return f"{self.usuario.username} - {self.titulo}"


# ============================================
# 8. MÓDULO: FIRMAS ELECTRÓNICAS
# ============================================

class ElectronicSignature(models.Model):
    """
    Electronic Signature Record
    Implements requirements for 21 CFR Part 11
    """
    
    ACTION_CHOICES = [
        ('APPROVE', 'Approve'),
        ('REVIEW', 'Review'),
        ('RELEASE', 'Release'),
        ('REJECT', 'Reject'),
        ('AUTHORIZE', 'Authorize'),
        ('VERIFY', 'Verify'),
    ]
    
    MEANING_CHOICES = [
        ('APPROVED_BY', 'Approved by'),
        ('REVIEWED_BY', 'Reviewed by'),
        ('RELEASED_BY', 'Released by'),
        ('REJECTED_BY', 'Rejected by'),
        ('AUTHORIZED_BY', 'Authorized by'),
        ('VERIFIED_BY', 'Verified by'),
    ]
    
    # Signature Details
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='electronic_signatures',
        help_text="User who signed"
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Action being signed"
    )
    meaning = models.CharField(
        max_length=20,
        choices=MEANING_CHOICES,
        help_text="Meaning of the signature"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="When the signature was applied"
    )
    
    # What is being signed
    content_type = models.CharField(
        max_length=100,
        help_text="Type of object being signed (e.g., 'Lote', 'OrdenTrabajo')"
    )
    object_id = models.IntegerField(
        help_text="ID of the object being signed"
    )
    object_str = models.CharField(
        max_length=200,
        help_text="String representation of the object"
    )
    
    # Reason and Comments
    reason = models.TextField(
        help_text="Reason for signing (required by 21 CFR Part 11)"
    )
    comments = models.TextField(
        blank=True,
        help_text="Additional comments"
    )
    
    # Authentication Details (for audit)
    password_hash = models.CharField(
        max_length=128,
        default='',
        blank=True,
        help_text="Hash of password used to authenticate (for audit purposes)"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address from which signature was applied"
    )
    user_agent = models.CharField(
        max_length=500,
        blank=True,
        help_text="Browser/client user agent"
    )
    
    # Data Integrity
    data_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        help_text="SHA-256 hash of the signed data at the time of signing"
    )
    signature_hash = models.CharField(
        max_length=64,
        default='',
        blank=True,
        editable=False,
        help_text="Hash of the signature itself (for integrity verification)"
    )
    
    # Validation
    is_valid = models.BooleanField(
        default=True,
        help_text="Whether this signature is still valid"
    )
    invalidated_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this signature was invalidated"
    )
    invalidated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='signatures_invalidated',
        help_text="User who invalidated this signature"
    )
    invalidation_reason = models.TextField(
        blank=True,
        help_text="Reason for invalidation"
    )
    
    class Meta:
        verbose_name = "Electronic Signature"
        verbose_name_plural = "Electronic Signatures"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['is_valid']),
        ]
    
    def __str__(self):
        return f"{self.get_meaning_display()} - {self.user.get_full_name()} - {self.object_str}"
    
    def save(self, *args, **kwargs):
        """Generate signature hash on save"""
        if not self.signature_hash:
            # Create a hash of all signature components for integrity
            import json
            signature_data = {
                'user_id': self.user.id,
                'action': self.action,
                'meaning': self.meaning,
                'timestamp': self.timestamp.isoformat() if self.timestamp else timezone.now().isoformat(),
                'content_type': self.content_type,
                'object_id': self.object_id,
                'reason': self.reason,
                'data_hash': self.data_hash
            }
            signature_string = json.dumps(signature_data, sort_keys=True)
            self.signature_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        super().save(*args, **kwargs)
    
    def verify_integrity(self) -> bool:
        """
        Verify the integrity of this signature
        Returns True if signature is intact, False otherwise
        """
        import json
        signature_data = {
            'user_id': self.user.id,
            'action': self.action,
            'meaning': self.meaning,
            'timestamp': self.timestamp.isoformat(),
            'content_type': self.content_type,
            'object_id': self.object_id,
            'reason': self.reason,
            'data_hash': self.data_hash
        }
        signature_string = json.dumps(signature_data, sort_keys=True)
        calculated_hash = hashlib.sha256(signature_string.encode()).hexdigest()
        
        return calculated_hash == self.signature_hash
    
    def invalidate(self, user: User, reason: str):
        """Invalidate this signature"""
        self.is_valid = False
        self.invalidated_at = timezone.now()
        self.invalidated_by = user
        self.invalidation_reason = reason
        self.save()