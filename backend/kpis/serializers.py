"""Serializadores para KPIs y métricas agregadas."""

from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers

from backend.calidad.models import Desviacion
from backend.inventario.models import LoteInsumo
from backend.mantenimiento.models import OrdenTrabajo
from backend.produccion.models import ControlCalidad, Lote, LoteEtapa, Parada


FINALIZADO_STATES = ["FINALIZADO", "LIBERADO"]


class ResumenDashboardSerializer(serializers.Serializer):
    """KPIs principales para el dashboard ejecutivo."""

    produccion_diaria = serializers.IntegerField()
    produccion_semanal = serializers.IntegerField()
    rendimiento_promedio = serializers.FloatField()
    inventario_stock_bajo = serializers.IntegerField()
    inventario_por_vencer = serializers.IntegerField()
    mantenimiento_abiertas = serializers.IntegerField()
    mantenimiento_en_pausa = serializers.IntegerField()
    mantenimiento_completadas_semana = serializers.IntegerField()
    calidad_desviaciones_abiertas = serializers.IntegerField()
    calidad_controles_no_conformes = serializers.IntegerField()

    @staticmethod
    def get_data() -> dict:
        """Calcula métricas agregadas para el resumen."""

        today = timezone.localdate()
        start_week = today - timedelta(days=today.weekday())

        lotes_finalizados = Lote.objects.filter(
            estado__in=FINALIZADO_STATES,
            fecha_real_fin__isnull=False,
        )

        produccion_diaria = lotes_finalizados.filter(
            fecha_real_fin__date=today
        ).count()
        produccion_semanal = lotes_finalizados.filter(
            fecha_real_fin__date__gte=start_week
        ).count()

        rendimiento_agg = lotes_finalizados.filter(
            fecha_real_fin__date__gte=start_week
        ).aggregate(
            total_producida=Sum("cantidad_producida"),
            total_planificada=Sum("cantidad_planificada"),
        )
        total_planificada = rendimiento_agg.get("total_planificada") or 0
        total_producida = rendimiento_agg.get("total_producida") or 0
        rendimiento_promedio = float(total_producida) / float(total_planificada) if total_planificada else 0.0

        inventario_stock_bajo = LoteInsumo.objects.filter(
            estado__in=["APROBADO", "CUARENTENA"],
            cantidad_actual__lte=F("insumo__punto_reorden"),
        ).count()
        inventario_por_vencer = LoteInsumo.objects.filter(
            estado__in=["APROBADO", "CUARENTENA"],
            fecha_vencimiento__lte=today + timedelta(days=30),
        ).count()

        mantenimiento_abiertas = OrdenTrabajo.objects.filter(
            estado__in=["ABIERTA", "ASIGNADA"]
        ).count()
        mantenimiento_en_pausa = OrdenTrabajo.objects.filter(
            estado__in=["PAUSADA", "EN_PROCESO"]
        ).count()
        mantenimiento_completadas_semana = OrdenTrabajo.objects.filter(
            estado="COMPLETADA",
            fecha_fin__date__gte=start_week,
        ).count()

        calidad_desviaciones_abiertas = Desviacion.objects.exclude(estado="CERRADA").count()
        calidad_controles_no_conformes = ControlCalidad.objects.filter(conforme=False).count()

        return {
            "produccion_diaria": produccion_diaria,
            "produccion_semanal": produccion_semanal,
            "rendimiento_promedio": round(rendimiento_promedio, 2),
            "inventario_stock_bajo": inventario_stock_bajo,
            "inventario_por_vencer": inventario_por_vencer,
            "mantenimiento_abiertas": mantenimiento_abiertas,
            "mantenimiento_en_pausa": mantenimiento_en_pausa,
            "mantenimiento_completadas_semana": mantenimiento_completadas_semana,
            "calidad_desviaciones_abiertas": calidad_desviaciones_abiertas,
            "calidad_controles_no_conformes": calidad_controles_no_conformes,
        }


class OeeSerializer(serializers.Serializer):
    """Serializador para métricas de OEE."""

    oee = serializers.FloatField()
    disponibilidad = serializers.FloatField()
    rendimiento = serializers.FloatField()
    calidad = serializers.FloatField()

    @staticmethod
    def get_data(window_days: int = 30) -> dict:
        """Calcula métricas de OEE para la ventana indicada."""

        now = timezone.now()
        window_start = now - timedelta(days=window_days)

        etapas = LoteEtapa.objects.filter(
            fecha_inicio__gte=window_start,
            fecha_fin__isnull=False,
            duracion_minutos__isnull=False,
        )
        etapas_agg = etapas.aggregate(total_runtime=Sum("duracion_minutos"))
        runtime = etapas_agg.get("total_runtime") or 0

        paradas_agg = Parada.objects.filter(
            fecha_inicio__gte=window_start,
            duracion_minutos__isnull=False,
        ).aggregate(total_parada=Sum("duracion_minutos"))
        downtime = paradas_agg.get("total_parada") or 0

        disponibilidad = runtime / (runtime + downtime) if (runtime + downtime) else 0.0

        rendimiento_aggr = etapas.filter(
            cantidad_entrada__isnull=False,
            cantidad_salida__isnull=False,
        ).aggregate(
            total_entrada=Sum("cantidad_entrada"),
            total_salida=Sum("cantidad_salida"),
        )
        total_entrada = rendimiento_aggr.get("total_entrada") or Decimal("0")
        total_salida = rendimiento_aggr.get("total_salida") or Decimal("0")
        rendimiento = float(total_salida) / float(total_entrada) if total_entrada else 0.0

        lotes_agg = Lote.objects.filter(
            estado__in=FINALIZADO_STATES,
            fecha_real_fin__gte=window_start,
        ).aggregate(
            total_producida=Sum("cantidad_producida"),
            total_rechazada=Sum("cantidad_rechazada"),
        )
        total_producida = lotes_agg.get("total_producida") or 0
        total_rechazada = lotes_agg.get("total_rechazada") or 0
        calidad = (
            (total_producida - total_rechazada) / total_producida
            if total_producida
            else 0.0
        )

        oee = disponibilidad * rendimiento * calidad

        return {
            "oee": round(oee, 2),
            "disponibilidad": round(disponibilidad, 2),
            "rendimiento": round(rendimiento, 2),
            "calidad": round(calidad, 2),
        }


class HistorialProduccionPuntoSerializer(serializers.Serializer):
    """Representa un punto en la serie de producción."""

    fecha = serializers.DateField()
    lotes_finalizados = serializers.IntegerField()
    unidades_producidas = serializers.IntegerField()
    unidades_rechazadas = serializers.IntegerField()


class HistorialProduccionSerializer(serializers.Serializer):
    """Serie temporal de producción diaria."""

    historial = HistorialProduccionPuntoSerializer(many=True)

    @staticmethod
    def get_data(days: int = 7) -> dict:
        """Retorna series de producción para los últimos `days` días."""

        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        qs = (
            Lote.objects.filter(
                estado__in=FINALIZADO_STATES,
                fecha_real_fin__isnull=False,
                fecha_real_fin__date__gte=start_date,
            )
            .annotate(fecha=TruncDate("fecha_real_fin"))
            .values("fecha")
            .annotate(
                lotes_finalizados=Count("id"),
                unidades_producidas=Sum("cantidad_producida"),
                unidades_rechazadas=Sum("cantidad_rechazada"),
            )
        )

        datos_por_fecha = {
            registro["fecha"]: {
                "fecha": registro["fecha"],
                "lotes_finalizados": registro["lotes_finalizados"] or 0,
                "unidades_producidas": registro["unidades_producidas"] or 0,
                "unidades_rechazadas": registro["unidades_rechazadas"] or 0,
            }
            for registro in qs
        }

        historial = []
        for offset in range(days):
            fecha = start_date + timedelta(days=offset)
            historial.append(
                datos_por_fecha.get(
                    fecha,
                    {
                        "fecha": fecha,
                        "lotes_finalizados": 0,
                        "unidades_producidas": 0,
                        "unidades_rechazadas": 0,
                    },
                )
            )

        historial.sort(key=lambda item: item["fecha"])
        return {"historial": historial}


class AlertasSerializer(serializers.Serializer):
    """Resumen de alertas operativas relevantes."""

    insumos_por_vencer = serializers.IntegerField()
    insumos_stock_critico = serializers.IntegerField()
    maquinas_fuera_servicio = serializers.IntegerField()
    ordenes_atrasadas = serializers.IntegerField()
    desviaciones_criticas_abiertas = serializers.IntegerField()

    @staticmethod
    def get_data() -> dict:
        """Calcula alertas a partir de los modelos operativos."""

        today = timezone.localdate()
        proximos_30 = today + timedelta(days=30)

        insumos_por_vencer = LoteInsumo.objects.filter(
            estado__in=["APROBADO", "CUARENTENA"],
            fecha_vencimiento__lte=proximos_30,
        ).count()

        insumos_stock_critico = LoteInsumo.objects.filter(
            estado__in=["APROBADO", "CUARENTENA"],
            cantidad_actual__lte=F("insumo__stock_minimo"),
        ).count()

        ordenes_en_curso = OrdenTrabajo.objects.filter(
            estado__in=["ABIERTA", "ASIGNADA", "EN_PROCESO", "PAUSADA"],
        )
        maquinas_fuera_servicio = ordenes_en_curso.filter(
            requiere_parada_produccion=True
        ).count()
        ordenes_atrasadas = ordenes_en_curso.filter(
            fecha_planificada__lt=timezone.now(),
        ).count()

        desviaciones_criticas_abiertas = Desviacion.objects.filter(
            severidad="CRITICA",
            estado__in=["ABIERTA", "EN_INVESTIGACION", "EN_CAPA"],
        ).count()

        return {
            "insumos_por_vencer": insumos_por_vencer,
            "insumos_stock_critico": insumos_stock_critico,
            "maquinas_fuera_servicio": maquinas_fuera_servicio,
            "ordenes_atrasadas": ordenes_atrasadas,
            "desviaciones_criticas_abiertas": desviaciones_criticas_abiertas,
        }
