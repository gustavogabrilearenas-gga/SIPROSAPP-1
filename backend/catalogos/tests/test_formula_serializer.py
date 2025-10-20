from django.test import TestCase

from backend.catalogos.models import EtapaProduccion, Producto
from backend.catalogos.serializers import FormulaSerializer


class FormulaSerializerValidationTests(TestCase):
    def setUp(self):
        self.producto = Producto.objects.create(
            codigo="PRD-001",
            nombre="Producto A",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="500mg",
            descripcion="",
        )
        self.material = Producto.objects.create(
            codigo="MAT-001",
            nombre="Material A",
            tipo="COMPRIMIDO",
            presentacion="BLISTER",
            concentracion="100mg",
            descripcion="",
        )
        self.etapa = EtapaProduccion.objects.create(
            codigo="ETP-001",
            nombre="Mezclado",
            descripcion="",
        )

    def _base_payload(self):
        return {
            "codigo": "FOR-001",
            "version": "1.0",
            "producto": self.producto.id,
            "descripcion": "",
            "activa": True,
            "ingredientes": [
                {"material_id": self.material.id, "cantidad": 10.5, "unidad": "kg"}
            ],
            "etapas": [
                {
                    "etapa_id": self.etapa.id,
                    "duracion_min": 15,
                    "descripcion": "Mezclar hasta homogenizar",
                }
            ],
        }

    def test_valid_payload_is_accepted(self):
        payload = self._base_payload()
        serializer = FormulaSerializer(data=payload)

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_ingredientes_structure_raises_error(self):
        payload = self._base_payload()
        payload["ingredientes"] = "invalid"
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("Debe ser una lista.", serializer.errors["ingredientes"][0])

    def test_invalid_ingredientes_material_must_exist(self):
        payload = self._base_payload()
        payload["ingredientes"][0]["material_id"] = 9999
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("material_id no existe", serializer.errors["ingredientes"][0])

    def test_invalid_etapas_requires_duration(self):
        payload = self._base_payload()
        payload["etapas"] = [{"etapa_id": self.etapa.id}]
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("falta 'duracion_min'", serializer.errors["etapas"][0])

    def test_invalid_etapas_duration_must_be_non_negative(self):
        payload = self._base_payload()
        payload["etapas"][0]["duracion_min"] = -1
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("duracion_min >= 0 requerida", serializer.errors["etapas"][0])
