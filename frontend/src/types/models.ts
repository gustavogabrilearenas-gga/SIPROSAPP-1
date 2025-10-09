/**
 * Tipos TypeScript para los modelos de SIPROSA MES
 */

// ============================================
// AUTENTICACIÓN
// ============================================

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  profile?: UserProfile | null
  groups?: string[]
  is_staff?: boolean
  is_superuser?: boolean
}

export interface UserProfile {
  legajo?: string | null
  area?: string | null
  area_display?: string | null
  turno_habitual?: string | null
  telefono?: string
  activo?: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  access: string
  refresh: string
  message: string
}

export interface RegisterRequest {
  username: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

export interface UsuarioDetalle {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  profile: UserProfile | null
  // Campos del perfil para edición
  legajo?: string
  area?: string
  turno_habitual?: string
  telefono?: string
  fecha_ingreso?: string | null
  activo?: boolean
}

export interface CrearUsuarioRequest {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  password_confirmacion: string
  is_staff: boolean
  is_superuser: boolean
  legajo?: string
  area?: string
  turno_habitual?: string
  telefono?: string
  fecha_ingreso?: string | null
}

export interface CambiarPasswordRequest {
  password_actual?: string
  password_nueva: string
  password_confirmacion: string
}

// ============================================
// PRODUCCIÓN
// ============================================

export interface Lote {
  id: number
  codigo_lote: string
  producto: number
  producto_nombre: string
  formula: number
  formula_version?: string
  cantidad_planificada: number
  cantidad_producida: number
  cantidad_rechazada: number
  unidad: string
  estado: 'PLANIFICADO' | 'EN_PROCESO' | 'PAUSADO' | 'FINALIZADO' | 'RECHAZADO' | 'LIBERADO'
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  fecha_planificada_inicio: string
  fecha_real_inicio?: string | null
  fecha_planificada_fin: string
  fecha_real_fin?: string | null
  fecha_creacion: string
  turno: number
  turno_nombre?: string
  supervisor: number
  supervisor_nombre?: string
  observaciones?: string
  creado_por: number
  creado_por_nombre?: string
  rendimiento_porcentaje: number
  visible: boolean
}

export interface LoteListItem {
  id: number
  codigo_lote: string
  producto: number
  producto_nombre: string
  cantidad_planificada: number
  cantidad_producida: number
  cantidad_rechazada: number
  unidad: string
  estado: string
  estado_display: string
  prioridad: string
  prioridad_display: string
  fecha_creacion: string
  fecha_planificada_inicio: string
  fecha_real_inicio?: string | null
  fecha_planificada_fin: string
  fecha_real_fin?: string | null
  supervisor: number
  supervisor_nombre?: string
  rendimiento_porcentaje: number
}

// ============================================
// ETAPAS DE PRODUCCIÓN
// ============================================

export interface EtapaProduccion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  orden_tipico: number
  requiere_registro_parametros: boolean
  parametros_esperados: any[]
  activa: boolean
}

export interface LoteEtapa {
  id: number
  lote: number
  lote_codigo?: string
  etapa: number
  etapa_codigo?: string
  etapa_nombre?: string
  orden: number
  maquina: number
  maquina_codigo?: string
  maquina_nombre?: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'PAUSADO' | 'COMPLETADO' | 'RECHAZADO'
  fecha_inicio?: string | null
  fecha_fin?: string | null
  duracion_minutos?: number | null
  operario: number
  operario_nombre?: string
  cantidad_entrada?: number | null
  cantidad_salida?: number | null
  cantidad_merma: number
  porcentaje_rendimiento?: number | null
  parametros_registrados: any[]
  observaciones: string
  requiere_aprobacion_calidad: boolean
  aprobada_por_calidad?: number | null
  aprobada_por_calidad_nombre?: string
  fecha_aprobacion_calidad?: string | null
}

export interface LoteEtapaListItem {
  id: number
  lote_codigo: string
  etapa_nombre: string
  maquina_codigo: string
  estado: string
  estado_display: string
  fecha_inicio?: string
  duracion_minutos?: number
  operario_nombre?: string
  porcentaje_rendimiento?: number
}

export interface Parada {
  id: number
  lote_etapa: number
  lote_id?: number
  lote_codigo?: string
  etapa_id?: number
  etapa_codigo?: string
  etapa_nombre?: string
  lote_etapa_descripcion?: string
  tipo: 'PLANIFICADA' | 'NO_PLANIFICADA'
  categoria: 'FALLA_EQUIPO' | 'FALTA_INSUMO' | 'CAMBIO_FORMATO' | 'LIMPIEZA' | 'CALIDAD' | 'OTROS'
  tipo_display?: string
  categoria_display?: string
  fecha_inicio: string
  fecha_fin?: string | null
  duracion_minutos?: number | null
  duracion_actual_minutos?: number | null
  duracion_legible?: string | null
  descripcion: string
  solucion: string
  registrado_por: number
  registrado_por_nombre?: string
}

export interface ControlCalidad {
  id: number
  lote_etapa: number
  lote_etapa_descripcion?: string
  tipo_control: string
  valor_medido: number
  unidad: string
  valor_minimo: number
  valor_maximo: number
  conforme: boolean
  fecha_control: string
  controlado_por: number
  controlado_por_nombre?: string
  observaciones: string
}

// ============================================
// MANTENIMIENTO
// ============================================

// ============================================
// INCIDENTES
// ============================================

export interface Incidente {
  id: number
  codigo: string
  tipo: number
  tipo_nombre: string
  severidad: 'MENOR' | 'MODERADA' | 'MAYOR' | 'CRITICA'
  estado: 'ABIERTO' | 'EN_INVESTIGACION' | 'ACCION_CORRECTIVA' | 'CERRADO'
  titulo: string
  descripcion: string
  fecha_ocurrencia: string
  ubicacion: number
  ubicacion_nombre: string
  maquina?: number
  maquina_nombre?: string
  lote_afectado?: number
  lote_afectado_codigo?: string
  reportado_por: number
  reportado_por_nombre: string
  fecha_reporte: string
  asignado_a?: number
  asignado_a_nombre?: string
  impacto_produccion?: string
  impacto_calidad?: string
  impacto_seguridad?: string
  requiere_notificacion_anmat: boolean
  fecha_cierre?: string
}

export interface IncidenteListItem {
  id: number
  codigo: string
  tipo_nombre: string
  titulo: string
  severidad: string
  severidad_display: string
  estado: string
  estado_display: string
  fecha_ocurrencia: string
  ubicacion_nombre: string
}

// ============================================
// CATÁLOGOS
// ============================================

export interface Maquina {
  id: number
  codigo: string
  nombre: string
  tipo: string
  tipo_display: string
  fabricante?: string
  modelo?: string
  ubicacion: number
  ubicacion_nombre: string
  descripcion?: string
  capacidad_nominal?: number
  unidad_capacidad?: string
  activa: boolean
  fecha_instalacion?: string
}

export interface Producto {
  id: number
  codigo: string
  nombre: string
  forma_farmaceutica: string
  forma_display: string
  principio_activo: string
  concentracion: string
  unidad_medida: string
  lote_minimo: number
  lote_optimo: number
  activo: boolean
}

export interface Ubicacion {
  id: number
  codigo: string
  nombre: string
  tipo: string
  tipo_display: string
  descripcion?: string
  activa: boolean
}

// ============================================
// DASHBOARD & STATS
// ============================================

export interface DashboardStats {
  totalProduccion: number
  lotesActivos: number
  ordenesMantenimiento: number
  alertasPendientes: number
  eficienciaPromedio: number
  tiempoMedioReparacion: number
  oee: number
  disponibilidad: number
}

export interface HealthCheck {
  status: string
  database: boolean
  debug: boolean
  django_version: string
  server_time: string
  environment: string
  models_count: {
    maquinas: number
    productos: number
    lotes: number
    ordenes_trabajo: number
    incidentes: number
  }
}

// ============================================
// UTILIDADES
// ============================================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  error: string
  detail?: string
  [key: string]: any
}

// ============================================
// MANTENIMIENTO
// ============================================

export interface TipoMantenimiento {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
}

export interface OrdenTrabajoListItem {
  id: number
  codigo: string
  maquina: number
  maquina_nombre: string
  tipo: number
  tipo_nombre: string
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  prioridad_display: string
  estado: 'ABIERTA' | 'ASIGNADA' | 'EN_PROCESO' | 'PAUSADA' | 'COMPLETADA' | 'CANCELADA'
  estado_display: string
  titulo: string
  fecha_creacion: string
  fecha_planificada?: string | null
  asignada_a?: number | null
}

export interface OrdenTrabajo {
  id: number
  codigo: string
  tipo: number
  tipo_nombre: string
  maquina: number
  maquina_nombre: string
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'
  prioridad_display: string
  estado: 'ABIERTA' | 'ASIGNADA' | 'EN_PROCESO' | 'PAUSADA' | 'COMPLETADA' | 'CANCELADA'
  estado_display: string
  titulo: string
  descripcion: string
  fecha_creacion: string
  fecha_planificada?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  duracion_real_horas?: number | null
  creada_por: number
  creada_por_nombre: string
  asignada_a?: number | null
  completada_por?: number | null
  trabajo_realizado?: string
  observaciones?: string
  requiere_parada_produccion: boolean
  costo_estimado?: number | null
  costo_real?: number | null
}

// ============================================
// NOTIFICACIONES
// ============================================

export interface Notificacion {
  id: number
  usuario: number
  usuario_nombre?: string
  tipo: 'INFO' | 'ADVERTENCIA' | 'CRITICO' | 'EXITO'
  titulo: string
  mensaje: string
  fecha_creacion: string
  fecha_leida?: string | null
  leida: boolean
  referencia_modelo?: string | null
  referencia_id?: number | null
  referencia_url?: string | null
}

export interface NotificacionListItem {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  fecha_creacion: string
  leida: boolean
}

// ============================================
// INVENTARIO
// ============================================

export interface Insumo {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  unidad_medida: string
  stock_minimo: number
  stock_actual: number
  precio_unitario: number
  proveedor_principal?: string
  activo: boolean
}

export interface Repuesto {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  maquinas_compatibles: number[]  // Array de IDs de máquinas
  stock_minimo: number
  stock_actual: number
  precio_unitario: number
  proveedor_principal?: string
  activo: boolean
}

export interface ProductoTerminado {
  id: number
  lote: number
  lote_codigo?: string
  producto: number
  producto_nombre?: string
  cantidad: number
  unidad: string
  fecha_fabricacion: string
  fecha_vencimiento: string
  numero_lote_sanitario?: string
  ubicacion_almacen?: string
  estado: 'CUARENTENA' | 'APROBADO' | 'RECHAZADO' | 'DESPACHADO'
}

export interface MovimientoInventario {
  id: number
  tipo_item: 'INSUMO' | 'REPUESTO' | 'PRODUCTO_TERMINADO'
  item_id: number
  item_nombre?: string
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA'
  cantidad: number
  unidad: string
  fecha_movimiento: string
  lote_proveedor?: string
  fecha_vencimiento?: string
  responsable: number
  responsable_nombre?: string
  motivo?: string
  ubicacion_origen?: string
  ubicacion_destino?: string
}

// ============================================
// FIRMAS ELECTRÓNICAS
// ============================================

export interface ElectronicSignature {
  id: number
  user: number
  user_nombre?: string
  action: 'APPROVE' | 'REVIEW' | 'RELEASE' | 'REJECT' | 'AUTHORIZE' | 'VERIFY'
  action_display?: string
  meaning: string
  meaning_display?: string
  timestamp: string
  content_type: string
  object_id: number
  object_str: string
  reason?: string
  ip_address?: string
  signature_hash?: string
  is_valid: boolean
  invalidation_reason?: string
  invalidated_at?: string | null
  invalidated_by?: number | null
}

export interface CreateSignatureRequest {
  action: 'APPROVE' | 'REVIEW' | 'RELEASE' | 'REJECT' | 'AUTHORIZE' | 'VERIFY'
  meaning: string
  content_type: string
  object_id: number
  object_str: string
  reason?: string
  password: string
  data_to_sign?: Record<string, any>
}

// ============================================
// KPIs Y DASHBOARD
// ============================================

export interface OEEData {
  desde: string
  hasta: string
  turno?: string
  total_lotes: number
  oee: number
  disponibilidad: number
  rendimiento: number
  calidad: number
  metricas: {
    tiempo_planificado_horas: number
    tiempo_real_horas: number
    tiempo_paradas_horas: number
    tiempo_operativo_horas: number
    cantidad_planificada: number
    cantidad_producida: number
    cantidad_rechazada: number
    cantidad_buena: number
  }
  series?: Array<{
    fecha: string
    lotes: number
    cantidad_producida: number
  }>
}

export interface ResumenDashboard {
  fecha: string
  lotes: {
    activos: number
    hoy: number
    total: number
  }
  incidentes: {
    abiertos: number
    criticos: number
    total: number
  }
  ordenes_trabajo: {
    abiertas: number
    urgentes: number
    total: number
  }
  oee_7_dias: {
    oee: number
    disponibilidad: number
    rendimiento: number
    calidad: number
  }
}

// ============================================
// BÚSQUEDA GLOBAL
// ============================================

export interface SearchResult {
  tipo: 'lote' | 'orden_trabajo' | 'incidente'
  id: number
  titulo: string
  subtitulo: string
  snippet: string
  url: string
  fecha: string
  estado: string
  estado_display: string
  severidad?: string
  prioridad?: string
}

export interface SearchResponse {
  query: string
  resultados: SearchResult[]
  total: number
  tipos: {
    lotes: number
    ordenes_trabajo: number
    incidentes: number
  }
}

// ============================================
// AUDITORÍA
// ============================================

export interface LogAuditoria {
  id: number
  usuario: number
  usuario_nombre?: string
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW'
  accion_display: string
  modelo: string
  objeto_id: number
  objeto_str: string
  cambios?: Record<string, any>
  ip_address?: string
  user_agent?: string
  fecha: string
}

export interface AuditoriaResponse {
  total: number
  filtros: {
    modelo?: string
    objeto_id?: string
    desde?: string
    hasta?: string
    usuario?: string
    accion?: string
  }
  logs: LogAuditoria[]
}
