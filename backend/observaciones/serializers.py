from rest_framework import serializers

from .models import ObservacionGeneral


class ObservacionGeneralSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservacionGeneral
        fields = ("id", "texto", "fecha_hora", "creado_por")
        read_only_fields = ("id", "fecha_hora", "creado_por")
