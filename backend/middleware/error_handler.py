import logging
import traceback

from django.conf import settings
from django.http import Http404, JsonResponse


logger = logging.getLogger(__name__)


class GlobalErrorMiddleware:
    """Captura excepciones globales y entrega una respuesta JSON estandarizada."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Http404 as exc:
            logger.warning("Recurso no encontrado: %s", exc)
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Recurso no encontrado",
                },
                status=404,
            )
        except Exception as exc:  # pragma: no cover - safety net
            logger.exception("Excepción no controlada en la solicitud")
            response = {
                "status": "error",
                "message": str(exc) if settings.DEBUG else "Ocurrió un error interno. El incidente fue registrado.",
            }

            if settings.DEBUG:
                formatted = traceback.format_exception(exc.__class__, exc, exc.__traceback__)
                response["details"] = "".join(formatted[-5:])

            return JsonResponse(response, status=500)

