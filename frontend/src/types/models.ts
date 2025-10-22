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
  orden_tipico: number
  requiere_registro_parametros: boolean
  parametros_esperados: string
  activa: boolean
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
  fecha_inicio: string
  fecha_fin: string
  es_parada_no_planificada: boolean
  origen: 'produccion' | 'mantenimiento' | 'general'
  maquina: number | null
  maquina_detalle: { id: number; codigo: string; nombre: string } | null
  descripcion: string
  requiere_acciones_correctivas: boolean
  acciones_correctivas: string
  observaciones: string
  created: string
  modified: string
}

export interface ApiListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
