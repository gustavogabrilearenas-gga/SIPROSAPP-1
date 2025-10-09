# Reglas de Negocio

Estados y transiciones inferidas de los modelos y ViewSets.

## core.UserProfile

- **area**: PRODUCCION, MANTENIMIENTO, ALMACEN, CALIDAD, ADMINISTRACION
- **turno**: M, T, N, R

## core.OrdenTrabajo

- **estado**: ABIERTA, ASIGNADA, EN_PROCESO, PAUSADA, COMPLETADA, CANCELADA
- **prioridad**: BAJA, NORMAL, ALTA, URGENTE

## core.IndicadorMantenimiento

- **periodo**: SEMANAL, MENSUAL, ANUAL

## core.Ubicacion

- **tipo**: PRODUCCION, ALMACEN, MANTENIMIENTO, SERVICIOS

## core.Maquina

- **tipo**: COMPRESION, MEZCLADO, GRANULACION, EMBLISTADO, SERVICIOS

## core.Producto

- **forma**: COMPRIMIDO, CREMA, SOLUCION

## core.Notificacion

- **tipo**: INFO, ADVERTENCIA, ERROR, URGENTE

## core.Lote

- **estado**: PLANIFICADO, EN_PROCESO, PAUSADO, FINALIZADO, CANCELADO, RECHAZADO, LIBERADO
- **prioridad**: BAJA, NORMAL, ALTA, URGENTE

## core.LoteEtapa

- **estado**: PENDIENTE, EN_PROCESO, PAUSADO, COMPLETADO, RECHAZADO

## core.Parada

- **categoria**: FALLA_EQUIPO, FALTA_INSUMO, CAMBIO_FORMATO, LIMPIEZA, CALIDAD, OTROS
- **tipo**: PLANIFICADA, NO_PLANIFICADA

## core.Desviacion

- **estado**: ABIERTA, EN_INVESTIGACION, EN_CAPA, CERRADA
- **severidad**: CRITICA, MAYOR, MENOR

## core.DocumentoVersionado

- **estado**: BORRADOR, EN_REVISION, APROBADO, VIGENTE, OBSOLETO
- **tipo**: SOP, IT, FT, PL, REG

## core.AccionCorrectiva

- **estado**: PLANIFICADA, EN_PROCESO, COMPLETADA, CANCELADA
- **tipo**: CORRECTIVA, PREVENTIVA

## core.LoteInsumo

- **estado**: CUARENTENA, APROBADO, RECHAZADO, AGOTADO

## core.Repuesto

- **categoria**: MECANICO, ELECTRICO, NEUMATICO, ELECTRONICO, CONSUMIBLE, OTRO

## core.MovimientoInventario

- **motivo**: COMPRA, PRODUCCION, MANTENIMIENTO, AJUSTE_INVENTARIO, VENCIMIENTO, DEVOLUCION
- **tipo_item**: INSUMO, REPUESTO, PRODUCTO_TERMINADO
- **tipo_movimiento**: ENTRADA, SALIDA, AJUSTE, TRANSFERENCIA

## core.ProductoTerminado

- **estado**: CUARENTENA, LIBERADO, RETENIDO, VENCIDO

## core.AlertaInventario

- **estado**: ACTIVA, ATENDIDA, IGNORADA
- **nivel**: BAJA, MEDIA, ALTA, CRITICA
- **tipo_alerta**: STOCK_MINIMO, PUNTO_REORDEN, VENCIMIENTO_PROXIMO, VENCIDO
- **tipo_item**: INSUMO, REPUESTO

## core.ConteoFisico

- **estado**: PLANIFICADO, EN_PROCESO, COMPLETADO, CANCELADO
- **tipo**: TOTAL, PARCIAL, CICLICO

## core.Incidente

- **estado**: ABIERTO, EN_INVESTIGACION, ACCION_CORRECTIVA, CERRADO
- **severidad**: MENOR, MODERADA, MAYOR, CRITICA

## core.InvestigacionIncidente

- **metodologia**: 5_PORQUES, ISHIKAWA, FMEA, OTRO

## core.LogAuditoria

- **accion**: CREAR, MODIFICAR, ELIMINAR, CANCELAR, VER, EXPORTAR

## core.ElectronicSignature

- **action**: APPROVE, REVIEW, RELEASE, REJECT, AUTHORIZE, VERIFY
- **meaning**: APPROVED_BY, REVIEWED_BY, RELEASED_BY, REJECTED_BY, AUTHORIZED_BY, VERIFIED_BY
