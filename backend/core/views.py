"""Views para SIPROSA MES."""

from django.db import connections
from django.db.models import Q
from django.db.utils import OperationalError
from django.http import JsonResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.incidencias.models import Incidente
from backend.mantenimiento.models import OrdenTrabajo
from backend.produccion.models import Lote


# ============================================
# PRODUCCIÓN
# ============================================


# ============================================
# INVENTARIO
# ============================================


# ============================================
# NOTIFICACIONES
# ============================================


# ============================================
# BÚSQUEDA GLOBAL
# ============================================


class BusquedaGlobalView(APIView):
    """Vista para búsqueda global en el sistema."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        limit = int(request.query_params.get("limit", 20))

        if len(query) < 2:
            return Response(
                {
                    "query": query,
                    "resultados": [],
                    "total": 0,
                    "message": "La búsqueda debe tener al menos 2 caracteres",
                }
            )

        resultados = []

        # 1. Buscar en Lotes
        lotes = (
            Lote.objects.filter(
                Q(codigo_lote__icontains=query)
                | Q(producto__nombre__icontains=query)
                | Q(producto__codigo__icontains=query)
            )
            .select_related("producto", "supervisor")
            [:limit]
        )

        for lote in lotes:
            resultados.append(
                {
                    "tipo": "lote",
                    "id": lote.id,
                    "titulo": lote.codigo_lote,
                    "subtitulo": lote.producto.nombre,
                    "snippet": (
                        "Estado: "
                        f"{lote.get_estado_display()} - Supervisor: {lote.supervisor.get_full_name()}"
                    ),
                    "url": f"/lotes/{lote.id}",
                    "fecha": lote.fecha_creacion.isoformat(),
                    "estado": lote.estado,
                    "estado_display": lote.get_estado_display(),
                }
            )

        # 2. Buscar en Órdenes de Trabajo
        ots = (
            OrdenTrabajo.objects.filter(
                Q(codigo__icontains=query)
                | Q(titulo__icontains=query)
                | Q(maquina__nombre__icontains=query)
                | Q(maquina__codigo__icontains=query)
            )
            .select_related("maquina", "tipo")
            [:limit]
        )

        for ot in ots:
            resultados.append(
                {
                    "tipo": "orden_trabajo",
                    "id": ot.id,
                    "titulo": ot.codigo,
                    "subtitulo": ot.titulo,
                    "snippet": (
                        "Máquina: "
                        f"{ot.maquina.nombre} - {ot.get_estado_display()} - {ot.get_prioridad_display()}"
                    ),
                    "url": f"/mantenimiento/{ot.id}",
                    "fecha": ot.fecha_creacion.isoformat(),
                    "estado": ot.estado,
                    "estado_display": ot.get_estado_display(),
                    "prioridad": ot.prioridad,
                }
            )

        # 3. Buscar en Incidentes
        incidentes = (
            Incidente.objects.filter(
                Q(codigo__icontains=query)
                | Q(titulo__icontains=query)
                | Q(descripcion__icontains=query)
            )
            .select_related("tipo", "ubicacion")
            [:limit]
        )

        for incidente in incidentes:
            resultados.append(
                {
                    "tipo": "incidente",
                    "id": incidente.id,
                    "titulo": incidente.codigo,
                    "subtitulo": incidente.titulo,
                    "snippet": (
                        f"{incidente.tipo.nombre} - {incidente.get_severidad_display()} - "
                        f"{incidente.ubicacion.nombre}"
                    ),
                    "url": f"/incidentes/{incidente.id}",
                    "fecha": incidente.fecha_ocurrencia.isoformat(),
                    "estado": incidente.estado,
                    "estado_display": incidente.get_estado_display(),
                    "severidad": incidente.severidad,
                }
            )

        resultados.sort(key=lambda x: x["fecha"], reverse=True)
        resultados = resultados[:limit]

        return Response(
            {
                "query": query,
                "resultados": resultados,
                "total": len(resultados),
                "tipos": {
                    "lotes": sum(1 for r in resultados if r["tipo"] == "lote"),
                    "ordenes_trabajo": sum(
                        1 for r in resultados if r["tipo"] == "orden_trabajo"
                    ),
                    "incidentes": sum(
                        1 for r in resultados if r["tipo"] == "incidente"
                    ),
                },
            }
        )


# ============================================
# DESVIACIONES Y CAPA
# ============================================


# ============================================
# HOME & HEALTH CHECK
# ============================================


def home(request):
    """Página de bienvenida - redirige al panel de administración."""

    from django.shortcuts import redirect

    return redirect("/admin/")


def health_check(request):
    """Comprueba la conexión a la base de datos y responde rápidamente."""

    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except OperationalError:
        return JsonResponse({"status": "error"}, status=503)

    return JsonResponse({"status": "ok"})
