import logging
import traceback
from django.http import JsonResponse
from django.conf import settings

logger = logging.getLogger(__name__)

class GlobalErrorMiddleware:
    """
    Middleware para capturar excepciones globales,
    registrar el error y devolver una respuesta JSON segura.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as e:
            logger.exception("Excepcion capturada: %s", e)

            if settings.DEBUG:
                # En modo desarrollo mostramos mas informacion
                return JsonResponse({
                    "error": str(e),
                    "type": e.__class__.__name__,
                    "trace": traceback.format_exc().splitlines(),
                }, status=500)
            else:
                # En modo produccion devolvemos un mensaje generico
                return JsonResponse({
                    "error": "Ocurrio un error interno. El incidente fue registrado.",
                }, status=500)

