#!/usr/bin/env python
"""Genera documentación y artefactos para el backend de SIPROSA MES."""
from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django  # noqa: E402

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

django.setup()

from django.apps import apps  # noqa: E402
from django.db import models  # noqa: E402
from django.utils.module_loading import import_string  # noqa: E402

from rest_framework.schemas.openapi import SchemaGenerator  # noqa: E402
from rest_framework.test import APIRequestFactory  # noqa: E402

BASE_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = BASE_DIR / "docs" / "backend"
DOCS_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class EndpointInfo:
    path: str
    method: str
    action: str
    tag: str
    description: str
    permissions: List[str]
    roles: List[str]
    parameters: Dict[str, List[str]]
    request_schema: Optional[Dict[str, Any]]
    response_schema: Optional[Dict[str, Any]]
    error_responses: Dict[str, Dict[str, Any]]
    example_request: Optional[Any]
    example_response: Optional[Any]

def resolve_ref(schema: Dict[str, Any], ref: str) -> Dict[str, Any]:
    if not ref.startswith("#/components/"):
        raise ValueError(f"Unsupported ref: {ref}")
    _, _, path = ref.partition("#/components/")
    parts = path.split("/")
    node: Any = schema["components"]
    for part in parts[1:]:
        if not isinstance(node, dict):
            return {}
        node = node.get(part)
        if node is None:
            return {}
    return node


def schema_to_example(schema: Dict[str, Any], full_schema: Dict[str, Any], depth: int = 0) -> Any:
    if "$ref" in schema:
        resolved = resolve_ref(full_schema, schema["$ref"])
        return schema_to_example(resolved, full_schema, depth + 1)

    schema_type = schema.get("type")
    if not schema_type:
        if "properties" in schema:
            schema_type = "object"
        elif "anyOf" in schema:
            return schema_to_example(schema["anyOf"][0], full_schema, depth + 1)
        else:
            return "" if depth else {}

    if schema_type == "object":
        properties = schema.get("properties", {})
        example = {}
        for key, value in properties.items():
            example[key] = schema_to_example(value, full_schema, depth + 1)
        return example
    if schema_type == "array":
        item_schema = schema.get("items", {"type": "string"})
        return [schema_to_example(item_schema, full_schema, depth + 1)]
    if schema_type == "integer":
        return 0
    if schema_type == "number":
        return 0.0
    if schema_type == "boolean":
        return True
    if schema_type == "string":
        fmt = schema.get("format")
        if fmt == "date-time":
            return datetime.utcnow().isoformat() + "Z"
        if fmt == "date":
            return datetime.utcnow().date().isoformat()
        if fmt == "uuid":
            return "00000000-0000-0000-0000-000000000000"
        return schema.get("example", "texto")
    return None


ROLE_ORDER = [
    "Admin",
    "Supervisor",
    "Operario",
    "Calidad",
    "Mantenimiento",
    "Planificación",
    "Gerencia",
]

PERMISSION_TO_ROLES = {
    "IsAdmin": {"Admin"},
    "IsAdminOrSupervisor": {"Admin", "Supervisor"},
    "IsAdminOrOperario": {"Admin", "Operario"},
    "IsAdminUser": {"Admin"},
    "IsAuthenticated": set(ROLE_ORDER),
    "AllowAny": set(ROLE_ORDER),
}


def permission_names(permission_classes: Iterable[Any]) -> List[str]:
    names = []
    for perm in permission_classes:
        if hasattr(perm, "__name__"):
            names.append(perm.__name__)
        else:
            names.append(perm.__class__.__name__)
    return names


def permission_roles(names: Iterable[str]) -> List[str]:
    allowed: set[str] = set()
    for name in names:
        allowed |= PERMISSION_TO_ROLES.get(name, set())
    return [role for role in ROLE_ORDER if role in allowed]


def collect_endpoint_info(schema: Dict[str, Any], generator: SchemaGenerator) -> List[EndpointInfo]:
    endpoints_map: Dict[Tuple[str, str], Any] = {}
    for path, method, view in generator.endpoints:
        endpoints_map[(path, method.upper())] = view

    factory = APIRequestFactory()
    results: List[EndpointInfo] = []

    for path, path_item in schema.get("paths", {}).items():
        for method, operation in path_item.items():
            http_method = method.upper()
            if http_method == "OPTIONS":
                continue
            key = (path, http_method)
            view = endpoints_map.get(key)
            if not view:
                continue
            action_map = getattr(view, "actions", {})
            action = action_map.get(http_method.lower(), http_method.lower())
            view_cls = view.cls
            view_instance = view_cls()
            view_instance.action = action
            view_instance.action_map = {http_method.lower(): action}

            raw_path = path
            dummy_path = re.sub(r"\{[^/]+\}", "1", raw_path)
            request_factory_method = getattr(factory, http_method.lower())
            django_request = request_factory_method(dummy_path)
            request = view_instance.initialize_request(django_request)
            view_instance.request = request

            path_params = re.findall(r"\{([^/}]+)\}", path)
            view_instance.kwargs = {param: "1" for param in path_params}
            perm_instances = view_instance.get_permissions()
            perm_names = permission_names(perm_instances)
            roles = permission_roles(perm_names)

            tag = (operation.get("tags") or [view_cls.__name__])[0]
            description = (operation.get("summary") or operation.get("description") or "").strip()

            params = {"path": [], "query": []}
            for param in operation.get("parameters", []):
                params[param["in"]].append(param["name"])

            request_body = operation.get("requestBody")
            request_schema = None
            example_request = None
            if request_body:
                content = request_body.get("content", {})
                json_schema = content.get("application/json", {}).get("schema")
                if json_schema:
                    request_schema = json_schema
                    example_request = schema_to_example(json_schema, schema)

            responses = operation.get("responses", {})
            success_schema = None
            success_example = None
            error_responses: Dict[str, Dict[str, Any]] = {}
            for status, response in responses.items():
                content = response.get("content", {})
                json_schema = content.get("application/json", {}).get("schema")
                if status.startswith("2") and not success_schema:
                    success_schema = json_schema
                    if json_schema:
                        success_example = schema_to_example(json_schema, schema)
                elif not status.startswith("2"):
                    error_responses[status] = {
                        "description": response.get("description", "")
                    }

            endpoint = EndpointInfo(
                path=path,
                method=http_method,
                action=action,
                tag=tag,
                description=description,
                permissions=perm_names,
                roles=roles,
                parameters=params,
                request_schema=request_schema,
                response_schema=success_schema,
                error_responses=error_responses,
                example_request=example_request,
                example_response=success_example,
            )
            results.append(endpoint)
    return sorted(results, key=lambda e: (e.path, e.method))


def write_openapi(schema: Dict[str, Any]) -> None:
    (BASE_DIR / "openapi.json").write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")


def format_json_block(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def write_endpoints_md(endpoints: List[EndpointInfo]) -> None:
    lines = ["# Catálogo de Endpoints", ""]
    lines.append("Generado automáticamente a partir del esquema OpenAPI y la inspección de permisos.")
    lines.append("")
    for endpoint in endpoints:
        lines.append(f"## {endpoint.method} `{endpoint.path}`")
        if endpoint.description:
            lines.append(endpoint.description)
        lines.append("")
        lines.append("- **Acción**: `" + endpoint.action + "`")
        lines.append("- **Módulo/Tag**: " + endpoint.tag)
        lines.append("- **Permisos DRF**: " + (", ".join(endpoint.permissions) or "(ninguno)"))
        roles = endpoint.roles or ["No asignado"]
        lines.append("- **Roles habilitados**: " + ", ".join(roles))
        lines.append("- **Parámetros de ruta**: " + (", ".join(endpoint.parameters["path"]) or "N/A"))
        lines.append("- **Parámetros query**: " + (", ".join(endpoint.parameters["query"]) or "N/A"))
        if endpoint.request_schema:
            lines.append("- **Cuerpo esperado (schema)**: ``" + endpoint.request_schema.get("$ref", endpoint.request_schema.get("type", "object")) + "``")
        else:
            lines.append("- **Cuerpo esperado**: N/A")
        if endpoint.response_schema:
            lines.append("- **Respuesta principal**: ``" + endpoint.response_schema.get("$ref", endpoint.response_schema.get("type", "object")) + "``")
        else:
            lines.append("- **Respuesta principal**: N/A")
        if endpoint.error_responses:
            items = [f"{code} ({data.get('description', '').strip() or 'sin descripción'})" for code, data in endpoint.error_responses.items()]
            lines.append("- **Errores esperados**: " + ", ".join(items))
        else:
            lines.append("- **Errores esperados**: No declarados")
        lines.append("")
        if endpoint.example_request is not None:
            lines.append("**Ejemplo de request**")
            lines.append("````json")
            lines.append(format_json_block(endpoint.example_request))
            lines.append("````")
        if endpoint.example_response is not None:
            lines.append("")
            lines.append("**Ejemplo de respuesta**")
            lines.append("````json")
            lines.append(format_json_block(endpoint.example_response))
            lines.append("````")
        lines.append("")
    (DOCS_DIR / "ENDPOINTS.md").write_text("\n".join(lines), encoding="utf-8")


def write_rbac_md(endpoints: List[EndpointInfo]) -> None:
    grouped: Dict[str, List[EndpointInfo]] = defaultdict(list)
    for endpoint in endpoints:
        grouped[endpoint.tag].append(endpoint)

    lines = ["# Matriz RBAC", ""]
    lines.append("Roles esperados: " + ", ".join(ROLE_ORDER) + ".")
    lines.append("")

    header = ["Recurso", "Método", "Ruta"] + ROLE_ORDER
    lines.append("| " + " | ".join(header) + " |")
    lines.append("|" + "---|" * len(header))

    for tag, items in sorted(grouped.items()):
        for endpoint in items:
            row = [tag, endpoint.method, f"`{endpoint.path}`"]
            allowed = set(endpoint.roles)
            for role in ROLE_ORDER:
                row.append("✅" if role in allowed else "⛔")
            lines.append("| " + " | ".join(row) + " |")
    lines.append("")

    missing_roles = [role for role in ROLE_ORDER if not any(role in ep.roles for ep in endpoints)]
    if missing_roles:
        lines.append("**Roles sin permisos explícitos**: " + ", ".join(missing_roles))
        lines.append("")
    (DOCS_DIR / "RBAC.md").write_text("\n".join(lines), encoding="utf-8")


def extract_state_choices(model: models.Model) -> Dict[str, List[str]]:
    choices = {}
    for attr in dir(model):
        if attr.endswith("_CHOICES"):
            value = getattr(model, attr)
            if isinstance(value, (list, tuple)) and value:
                label = attr.replace("_CHOICES", "")
                choices[label] = [choice[0] for choice in value]
    return choices


def detect_state_transitions(view_cls: type) -> Dict[str, List[str]]:
    import inspect
    import ast

    transitions: Dict[str, List[str]] = defaultdict(list)
    source = inspect.getsource(view_cls)
    tree = ast.parse(source)

    class Visitor(ast.NodeVisitor):
        def __init__(self) -> None:
            self.current_func = ""

        def visit_FunctionDef(self, node: ast.FunctionDef) -> Any:
            prev = self.current_func
            self.current_func = node.name
            self.generic_visit(node)
            self.current_func = prev

        def visit_Assign(self, node: ast.Assign) -> Any:
            for target in node.targets:
                if isinstance(target, ast.Attribute) and target.attr == "estado":
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        transitions[self.current_func].append(node.value.value)
            self.generic_visit(node)

        def visit_AnnAssign(self, node: ast.AnnAssign) -> Any:
            target = node.target
            if isinstance(target, ast.Attribute) and target.attr == "estado":
                value = node.value
                if isinstance(value, ast.Constant) and isinstance(value.value, str):
                    transitions[self.current_func].append(value.value)
            self.generic_visit(node)

    Visitor().visit(tree)
    return transitions


def write_rules_md(endpoints: List[EndpointInfo]) -> None:
    lines = ["# Reglas de Negocio", ""]
    lines.append("Estados y transiciones inferidas de los modelos y ViewSets.")
    lines.append("")

    processed_models = set()
    for model in apps.get_models():
        choices = extract_state_choices(model)
        if not choices:
            continue
        processed_models.add(model)
        lines.append(f"## {model._meta.app_label}.{model.__name__}")
        lines.append("")
        for label, values in choices.items():
            lines.append(f"- **{label.lower()}**: {', '.join(values)}")
        view_name = f"backend.{model._meta.app_label}.views.{model.__name__}ViewSet"
        transitions: Dict[str, List[str]] = {}
        try:
            view_cls = import_string(view_name)
            transitions = detect_state_transitions(view_cls)
        except Exception:
            transitions = {}
        if transitions:
            lines.append("")
            lines.append("### Transiciones detectadas")
            for method, states in transitions.items():
                unique_states = sorted(set(states))
                lines.append(f"- `{method}` → {', '.join(unique_states)}")
        lines.append("")

    if not processed_models:
        lines.append("No se detectaron estados con choices en los modelos.")

    (DOCS_DIR / "RULES.md").write_text("\n".join(lines), encoding="utf-8")


def generate_erd_svg() -> None:
    models_by_app: Dict[str, List[models.Model]] = defaultdict(list)
    for model in apps.get_models():
        models_by_app[model._meta.app_label].append(model)

    app_labels = sorted(models_by_app.keys())
    column_width = 320
    margin_x = 40
    margin_y = 60
    padding = 12
    line_height = 16

    positions: Dict[Tuple[str, str], Tuple[float, float, float, float]] = {}
    current_heights: Dict[str, float] = {label: margin_y for label in app_labels}

    for col, app_label in enumerate(app_labels):
        x = margin_x + col * column_width
        for model in sorted(models_by_app[app_label], key=lambda m: m.__name__):
            fields = [field.name for field in model._meta.fields]
            height = padding * 2 + line_height * (len(fields) + 1)
            y = current_heights[app_label]
            positions[(app_label, model.__name__)] = (x, y, column_width - 40, height)
            current_heights[app_label] += height + padding

    width = margin_x * 2 + column_width * len(app_labels)
    height = max(current_heights.values()) + margin_y

    svg_lines = [
        f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}' viewBox='0 0 {width} {height}' font-family='Arial' font-size='12'>",
        "<style>text{dominant-baseline:middle;} .title{font-weight:bold;} .field{fill:#333;} .header{fill:#0f172a;} .box{fill:#e2e8f0;stroke:#0f172a;stroke-width:1;}</style>",
    ]

    for (app_label, model_name), (x, y, w, h) in positions.items():
        svg_lines.append(f"<rect class='box' x='{x}' y='{y}' width='{w}' height='{h}' rx='6' ry='6' />")
        svg_lines.append(f"<text class='title' x='{x + 8}' y='{y + padding}'>{app_label}.{model_name}</text>")
        fields = [field for field in apps.get_model(app_label, model_name)._meta.fields]
        for idx, field in enumerate(fields):
            fy = y + padding * 2 + line_height * (idx + 1)
            svg_lines.append(f"<text class='field' x='{x + 12}' y='{fy}'>• {field.name}</text>")

    # Relaciones
    for app_label, model_name in positions.keys():
        model = apps.get_model(app_label, model_name)
        x, y, w, h = positions[(app_label, model_name)]
        source_center_x = x + w
        for field in model._meta.get_fields():
            if not field.is_relation or field.auto_created:
                continue
            target = field.related_model
            target_key = (target._meta.app_label, target.__name__)
            if target_key not in positions:
                continue
            tx, ty, tw, th = positions[target_key]
            target_center_x = tx
            source_center_y = y + h / 2
            target_center_y = ty + th / 2
            svg_lines.append(
                f"<line x1='{source_center_x}' y1='{source_center_y}' x2='{target_center_x}' y2='{target_center_y}' stroke='#475569' stroke-width='1' marker-end='url(#arrow)' />"
            )

    svg_lines.insert(1, "<defs><marker id='arrow' markerWidth='10' markerHeight='7' refX='10' refY='3.5' orient='auto'><polygon points='0 0, 10 3.5, 0 7' fill='#475569'/></marker></defs>")
    svg_lines.append("</svg>")
    (DOCS_DIR / "ERD.svg").write_text("\n".join(svg_lines), encoding="utf-8")


def generate_postman_collection(endpoints: List[EndpointInfo]) -> None:
    collection = {
        "info": {
            "name": "SIPROSA MES Backend",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "description": "Colección generada automáticamente desde OpenAPI",
        },
        "item": [],
        "variable": [
            {"key": "baseUrl", "value": "http://localhost:8000/api"},
            {"key": "token", "value": ""},
        ],
    }

    for endpoint in endpoints:
        url_path = endpoint.path.strip("/").split("/")
        request: Dict[str, Any] = {
            "method": endpoint.method,
            "header": [
                {"key": "Authorization", "value": "Bearer {{token}}", "type": "text"},
                {"key": "Content-Type", "value": "application/json", "type": "text"},
            ],
            "url": {
                "raw": "{{baseUrl}}" + endpoint.path,
                "host": ["{{baseUrl}}"],
                "path": [p for p in url_path if p],
            },
        }
        if endpoint.parameters["query"]:
            request["url"]["query"] = [
                {"key": param, "value": "", "description": ""} for param in endpoint.parameters["query"]
            ]
        if endpoint.request_schema:
            request["body"] = {
                "mode": "raw",
                "raw": format_json_block(endpoint.example_request or {}),
                "options": {"raw": {"language": "json"}},
            }
        item = {
            "name": f"{endpoint.method} {endpoint.path}",
            "request": request,
        }
        collection["item"].append(item)

    (BASE_DIR / "postman_collection.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    generator = SchemaGenerator(title="SIPROSA MES API", description="Documentación generada automáticamente")
    schema = generator.get_schema(request=None, public=True)
    write_openapi(schema)
    endpoints = collect_endpoint_info(schema, generator)
    write_endpoints_md(endpoints)
    write_rbac_md(endpoints)
    write_rules_md(endpoints)
    generate_erd_svg()
    generate_postman_collection(endpoints)
    print(f"Documentación generada en {DOCS_DIR}")


if __name__ == "__main__":
    main()
