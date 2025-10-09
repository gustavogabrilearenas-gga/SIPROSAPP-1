#!/usr/bin/env python
"""Ejecuta pruebas de humo contra todos los endpoints usando APIClient."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import django  # noqa: E402

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

from tools.generate_backend_docs import collect_endpoint_info, SchemaGenerator  # noqa: E402


def ensure_admin() -> None:
    User = get_user_model()
    if not User.objects.filter(username="admin").exists():
        raise SystemExit("Debe ejecutar create_test_users.py antes de las smoke tests")


def build_path(path: str) -> str:
    out = path
    for token in [segment for segment in path.split("/") if "{" in segment]:
        out = out.replace(token, "1")
    return out


def adapt_payload(data: Any) -> Any:
    if isinstance(data, dict):
        adapted: Dict[str, Any] = {}
        for key, value in data.items():
            if key in {"id", "pk"}:
                continue
            adapted[key] = adapt_payload(value)
        return adapted
    if isinstance(data, list):
        return [adapt_payload(item) for item in data][:1]
    if isinstance(data, str):
        return data or "texto"
    return data


def main() -> None:
    ensure_admin()
    generator = SchemaGenerator(title="SIPROSA MES API", description="Smoke Tests")
    schema = generator.get_schema(request=None, public=True)
    endpoints = collect_endpoint_info(schema, generator)

    client = APIClient()
    token_resp = client.post("/api/token/", {"username": "admin", "password": "sand234@"}, format="json")
    if token_resp.status_code != 200:
        raise SystemExit(f"No se pudo autenticar admin: {token_resp.status_code} {token_resp.data}")
    token = token_resp.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    report_lines = []
    for endpoint in endpoints:
        url = build_path(endpoint.path)
        method = endpoint.method
        data = None
        if endpoint.example_request:
            data = adapt_payload(endpoint.example_request)
        response = client.generic(method, url, data=json.dumps(data) if data is not None else None, content_type="application/json")
        ok = response.status_code < 500
        report_lines.append(
            f"{method} {endpoint.path} -> {response.status_code} {'OK' if ok else 'FAIL'}"
        )
    Path("smoke_test_report.txt").write_text("\n".join(report_lines), encoding="utf-8")
    print("Reporte escrito en smoke_test_report.txt")


if __name__ == "__main__":
    main()
