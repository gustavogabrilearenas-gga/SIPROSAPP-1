from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from rest_framework.schemas.openapi import SchemaGenerator


class Command(BaseCommand):
    help = "Exporta el esquema OpenAPI usando el generador nativo de DRF."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file_path",
            required=True,
            help="Ruta del archivo de salida",
        )
        parser.add_argument(
            "--format",
            dest="export_format",
            choices=["openapi-json", "openapi-yaml"],
            default="openapi-json",
            help="Formato del archivo exportado",
        )

    def handle(self, *args, **options):
        file_path = Path(options["file_path"])
        export_format = options["export_format"]
        generator = SchemaGenerator(
            title=getattr(settings, "SPECTACULAR_SETTINGS", {}).get("TITLE", "API Schema"),
            description=getattr(settings, "SPECTACULAR_SETTINGS", {}).get("DESCRIPTION", ""),
            version=getattr(settings, "SPECTACULAR_SETTINGS", {}).get("VERSION", "0.0.0"),
        )
        schema = generator.get_schema(request=None, public=True)
        if schema is None:
            raise CommandError("No se pudo generar el esquema OpenAPI.")

        file_path.parent.mkdir(parents=True, exist_ok=True)
        serialized = json.dumps(schema, indent=2, sort_keys=True)

        # YAML es un superconjunto de JSON. Emitimos JSON válido que puede ser consumido como YAML.
        if export_format == "openapi-yaml":
            self.stdout.write(self.style.WARNING("Generando YAML en modo compatible a partir de JSON."))

        file_path.write_text(serialized + "\n", encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(f"Esquema exportado a {file_path}"))
