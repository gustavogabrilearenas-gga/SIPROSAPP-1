#!/bin/sh
set -e

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "Esperando base de datos en ${DB_HOST}:${DB_PORT}..."
until python -c "import socket; s = socket.socket(); s.settimeout(2); s.connect(('${DB_HOST}', ${DB_PORT})); s.close()" >/dev/null 2>&1; do
  echo "Base de datos sin respuesta, reintentando..."
  sleep 2
done

echo "Aplicando migraciones..."
python manage.py migrate --noinput

echo "Creando superusuario si falta..."
python manage.py create_superuser_if_none || true

echo "Iniciando proceso principal..."
exec "$@"
