#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}}"
SMOKE_USERNAME="${SMOKE_USERNAME:-admin}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-admin}"
RESOURCE_BASE="${RESOURCE_BASE:-catalogos/parametros}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Se requiere jq para ejecutar el smoke test." >&2
  exit 1
fi

BASE_ENDPOINT="${API_URL%/}"
LOGIN_URL="$BASE_ENDPOINT/token/"
RESOURCE_URL="$BASE_ENDPOINT/${RESOURCE_BASE%/}/"

printf '1) Autenticando en %s\n' "$LOGIN_URL"
LOGIN_RESPONSE=$(curl -sS -X POST "$LOGIN_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$SMOKE_USERNAME\",\"password\":\"$SMOKE_PASSWORD\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access // empty')

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "No se obtuvo token de acceso. Respuesta:" >&2
  echo "$LOGIN_RESPONSE" >&2
  exit 1
fi

echo 'Token obtenido correctamente.'

printf '2) Consultando usuario actual en %s/usuarios/me/\n' "$BASE_ENDPOINT"
USER_RESPONSE=$(curl -sS "$BASE_ENDPOINT/usuarios/me/" -H "Authorization: Bearer $ACCESS_TOKEN")
USERNAME=$(echo "$USER_RESPONSE" | jq -r '.username // empty')

if [[ -z "$USERNAME" ]]; then
  echo "No se pudo obtener el usuario actual. Respuesta:" >&2
  echo "$USER_RESPONSE" >&2
  exit 1
fi

echo "Usuario autenticado: $USERNAME"
echo "Grupos: $(echo "$USER_RESPONSE" | jq -r '.groups | join(", ")')"

printf '3) Obteniendo listado inicial de %s\n' "$RESOURCE_URL"
LIST_RESPONSE=$(curl -sS "$RESOURCE_URL" -H "Authorization: Bearer $ACCESS_TOKEN")
COUNT=$(echo "$LIST_RESPONSE" | jq -r '.count // (. | length) // 0')
echo "Registros actuales: $COUNT"

TIMESTAMP=$(date +%s)
CREATE_PAYLOAD=$(jq -n --arg codigo "SMOKE-$TIMESTAMP" --arg nombre "Smoke Test $TIMESTAMP" --arg unidad "u" '{codigo: $codigo, nombre: $nombre, unidad: $unidad, descripcion: "Creado por smoke test", activo: true}')

printf '4) Creando registro de prueba\n'
CREATE_RESPONSE=$(curl -sS "$RESOURCE_URL" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -X POST \
  -d "$CREATE_PAYLOAD")
NEW_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')

if [[ -z "$NEW_ID" ]]; then
  echo "No se pudo crear el registro de prueba. Respuesta:" >&2
  echo "$CREATE_RESPONSE" >&2
  exit 1
fi

echo "Registro creado con ID $NEW_ID"

UPDATE_PAYLOAD=$(echo "$CREATE_RESPONSE" | jq '.nombre = "Smoke Test Actualizado"')

printf '5) Actualizando registro %s\n' "$NEW_ID"
UPDATE_RESPONSE=$(curl -sS "$RESOURCE_URL$NEW_ID/" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -X PUT \
  -d "$UPDATE_PAYLOAD")

UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.nombre // empty')

if [[ "$UPDATED_NAME" != "Smoke Test Actualizado" ]]; then
  echo "La actualización no devolvió el valor esperado. Respuesta:" >&2
  echo "$UPDATE_RESPONSE" >&2
  cleanup_status=1
else
  echo 'Actualización confirmada.'
  cleanup_status=0
fi

printf '6) Eliminando registro %s\n' "$NEW_ID"
DELETE_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "$RESOURCE_URL$NEW_ID/" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -X DELETE)

if [[ "$DELETE_STATUS" != "204" ]]; then
  echo "Eliminación falló con código $DELETE_STATUS" >&2
  exit 1
fi

echo 'Eliminación confirmada.'

if [[ $cleanup_status -ne 0 ]]; then
  exit $cleanup_status
fi

echo 'Smoke test completado con éxito.'
