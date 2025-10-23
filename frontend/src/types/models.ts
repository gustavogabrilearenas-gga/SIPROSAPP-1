/**
 * Tipos compartidos basados en los serializers del backend Django.
 */

export interface UserProfile {
  legajo: string | null
  dni: string | null
  funcion: number | null
  funcion_nombre: string | null
  turno_habitual: number | null
  turno_habitual_nombre: string | null
  telefono: string | null
  activo: boolean
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  is_staff?: boolean
  is_superuser?: boolean
  profile?: UserProfile | null
  groups?: string[]
}

export interface CambiarPasswordRequest {
  password_actual?: string
  password_nueva: string
  password_confirmacion: string
}

export interface Funcion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activa: boolean
}

export interface Parametro {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  unidad: string
  activo: boolean
}

export interface Producto {
  id: number
  codigo: string
  nombre: string
  tipo: string
  tipo_display: string
  presentacion: string
  presentacion_display: string
  concentracion: string
  descripcion: string
  activo: boolean
  imagen: string | null
  unidad_medida?: string | null
}

export interface FormulaIngrediente {
  id: number
  material: number
  material_nombre: string
  cantidad: string
  unidad: string
  orden: number
  notas: string
}

export interface FormulaEtapa {
  id: number
  etapa: number
  etapa_nombre: string
  orden: number
  descripcion: string
  duracion_estimada_min: number | null
}

export interface Formula {
  id: number
  codigo: string
  version: string
  producto: number
  producto_nombre: string
  descripcion: string
  activa: boolean
  ingredientes?: FormulaIngrediente[]
  etapas?: FormulaEtapa[]
}

export interface EtapaProduccion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activa: boolean
  maquinas_permitidas: number[]
  maquinas_permitidas_nombres?: Array<{ id: number; nombre: string }>
  parametros: number[]
  parametros_nombres?: string[]
}

export interface Turno {
  id: number
  codigo: string
  nombre: string
  nombre_display: string
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

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
  legajo: string | null
  dni: string | null
  funcion_id: number | null
  funcion_nombre: string | null
  turno_id: number | null
  turno_nombre: string | null
  telefono: string | null
  fecha_ingreso: string | null
  profile?: UserProfile | null
}

export interface Ubicacion {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activa: boolean
  maquinas_count: number
}

export interface Maquina {
  id: number
  codigo: string
  nombre: string
  tipo: string
  tipo_display: string
  fabricante: string
  modelo: string
  numero_serie: string
  año_fabricacion: number | null
  ubicacion: number | null
  ubicacion_nombre: string | null
  descripcion: string
  capacidad_nominal: string | null
  unidad_capacidad: string | null
  activa: boolean
  fecha_instalacion: string | null
  imagen: string | null
  requiere_calificacion?: boolean
}

export interface TipoMantenimiento {
  id: number
  codigo: string
  nombre: string
  descripcion: string
  activo: boolean
}

export interface RegistroProduccion {
  id: number
  estado: 'CREADO' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO'
  producto: number
  formula: number
  maquina: number | null
  turno: number | null
  hora_inicio: string | null
  hora_fin: string | null
  cantidad_producida: string | null
  unidad_medida: string
  observaciones: string
  registrado_por: number
  fecha_registro: string
}

export interface RegistroMantenimiento {
  id: number
  hora_inicio: string
  hora_fin: string
  maquina: number
  tipo_mantenimiento: 'CORRECTIVO' | 'AUTONOMO' | 'PREVENTIVO'
  descripcion: string
  tiene_anomalias: boolean
  descripcion_anomalias: string
  observaciones: string
  registrado_por: number
  fecha_registro: string
}

export interface Incidente {
  id: number
  codigo: string
  tipo: number | null
  tipo_nombre: string | null
  severidad: 'MENOR' | 'MODERADA' | 'MAYOR' | 'CRITICA'
  estado: 'ABIERTO' | 'EN_INVESTIGACION' | 'ACCION_CORRECTIVA' | 'CERRADO'
  titulo: string
  descripcion: string
  fecha_ocurrencia: string | null
  fecha_reporte: string | null
  fecha_cierre: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  ubicacion: number | null
  ubicacion_nombre: string | null
  maquina: number | null
  maquina_nombre: string | null
  maquina_detalle?: { id: number; codigo: string; nombre: string } | null
  origen: 'produccion' | 'mantenimiento' | 'general'
  lote_afectado: number | null
  lote_afectado_codigo?: string | null
  impacto_produccion: string | null
  impacto_calidad: string | null
  impacto_seguridad: string | null
  requiere_notificacion_anmat: boolean
  requiere_acciones_correctivas?: boolean
  acciones_correctivas?: string | null
  es_parada_no_planificada?: boolean
  reportado_por: number | null
  reportado_por_nombre?: string | null
  asignado_a: number | null
  asignado_a_nombre?: string | null
  creado_por?: number | null
  observaciones?: string | null
  created?: string
  modified?: string
}

export interface ObservacionGeneral {
  id: number
  texto: string
  fecha_hora: string
  creado_por: number
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
  prioridad: string
  fecha_planificada_inicio: string | null
  fecha_planificada_fin: string | null
  fecha_real_inicio: string | null
  fecha_real_fin: string | null
  rendimiento_porcentaje: number
}

export interface Lote {
  id: number
  codigo_lote: string
  producto: number
  producto_nombre: string
  supervisor: number | null
  supervisor_nombre: string | null
  turno: number | null
  turno_nombre: string | null
  cantidad_planificada: number
  cantidad_producida: number | null
  cantidad_rechazada: number | null
  unidad: string
  prioridad: string
  estado: string
  fecha_planificada_inicio: string | null
  fecha_planificada_fin: string | null
  fecha_real_inicio: string | null
  fecha_real_fin: string | null
  rendimiento_porcentaje: number
  observaciones: string | null
  formula?: number | null
}

export interface LoteEtapa {
  id: number
  etapa: number
  etapa_nombre: string
  orden: number
  estado: string
  maquina: number | null
  maquina_nombre: string | null
  operario: number | null
  operario_nombre: string | null
  cantidad_entrada: number | null
  cantidad_salida: number | null
  porcentaje_rendimiento: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
  observaciones: string | null
}

export interface ControlCalidad {
  id: number
  lote_etapa: number
  lote_etapa_descripcion: string
  tipo_control: string
  valor_medido: number
  valor_minimo: number
  valor_maximo: number
  unidad: string
  fecha_control: string
  conforme: boolean
  observaciones: string | null
  controlado_por: number | null
  controlado_por_nombre: string | null
}

export interface LogAuditoria {
  id: number
  accion: string
  accion_display: string
  fecha: string
  usuario: number | null
  usuario_nombre: string | null
  cambios: Record<string, unknown> | null
  comentario?: string | null
  ip_address?: string | null
}

export interface OrdenTrabajo {
  id: number
  codigo: string
  titulo: string
  descripcion: string
  tipo: number
  tipo_nombre: string
  estado: string
  prioridad: string
  maquina: number | null
  maquina_nombre: string | null
  requiere_parada_produccion: boolean
  creada_por: number | null
  creada_por_nombre: string | null
  asignada_a: number | null
  completada_por: number | null
  fecha_creacion: string
  fecha_planificada: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  duracion_estimada_horas: number | null
  duracion_real_horas: number | null
  costo_estimado: number | null
  costo_real: number | null
  trabajo_realizado: string | null
  observaciones: string | null
}

export interface ApiListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
