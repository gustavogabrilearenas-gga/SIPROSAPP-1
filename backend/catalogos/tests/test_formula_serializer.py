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
                {"material": self.material.id, "cantidad": "10.5", "unidad": "kg"}
            ],
            "etapas": [
                {
                    "etapa": self.etapa.id,
                    "descripcion": "Mezclar hasta homogenizar",
                    "duracion_estimada_min": 30,
                }
            ],
        }

    def test_valid_payload_is_accepted(self):
        payload = self._base_payload()
        serializer = FormulaSerializer(data=payload)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        formula = serializer.save()
        self.assertEqual(formula.ingredientes.count(), 1)
        self.assertEqual(formula.relaciones_etapas.count(), 1)

    def test_version_formats_allowed(self):
        for version in ["1", "1.1", "1.2.3"]:
            with self.subTest(version=version):
                payload = self._base_payload()
                payload["version"] = version
                serializer = FormulaSerializer(data=payload)

                self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_version_invalid_format_rejected(self):
        for version in ["1.", "1.a", "1..2"]:
            with self.subTest(version=version):
                payload = self._base_payload()
                payload["version"] = version
                serializer = FormulaSerializer(data=payload)

                self.assertFalse(serializer.is_valid())
                self.assertIn(
                    "Use formato de versión como 1, 1.1 o 1.2.3 (solo números y puntos).",
                    serializer.errors["version"][0],
                )

    def test_invalid_ingredientes_material_must_exist(self):
        payload = self._base_payload()
        payload["ingredientes"][0]["material"] = 9999
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("material", serializer.errors["ingredientes"][0])

    def test_invalid_ingrediente_requires_positive_amount(self):
        payload = self._base_payload()
        payload["ingredientes"][0]["cantidad"] = "0"
        serializer = FormulaSerializer(data=payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("cantidad debe ser positiva", serializer.errors["ingredientes"][0])

