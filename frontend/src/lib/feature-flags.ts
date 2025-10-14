export const featureFlags = {
  configuracion: process.env.NEXT_PUBLIC_FEATURE_CONFIGURACION === 'true',
  auditoriaExport: process.env.NEXT_PUBLIC_FEATURE_AUDITORIA_EXPORT === 'true',
  formulasIngredientes: process.env.NEXT_PUBLIC_FEATURE_FORMULAS_INGREDIENTES === 'true',
  productosAsociaciones: process.env.NEXT_PUBLIC_FEATURE_PRODUCTOS_ASOCIACIONES === 'true',
  desviacionesGestion: process.env.NEXT_PUBLIC_FEATURE_DESVIACIONES_GESTION === 'true',
} as const

export type FeatureFlag = keyof typeof featureFlags

export const isFeatureEnabled = (flag: FeatureFlag): boolean => featureFlags[flag]
