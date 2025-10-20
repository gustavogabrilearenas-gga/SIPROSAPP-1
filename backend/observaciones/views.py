from rest_framework.exceptions import MethodNotAllowed
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import ObservacionGeneral
from .serializers import ObservacionGeneralSerializer


class ObservacionGeneralViewSet(ModelViewSet):
    queryset = ObservacionGeneral.objects.all().order_by("-fecha_hora")
    serializer_class = ObservacionGeneralSerializer
    permission_classes = (IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed(request.method)

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed(request.method)

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed(request.method)
