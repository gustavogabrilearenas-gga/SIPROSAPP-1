#!/bin/sh
set -e

DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "Esperando base de datos en ${DB_HOST}:${DB_PORT}..."
until python - <<'PY'
import os, socket, sys, time
host = os.environ.get("DB_HOST","db")
port = int(os.environ.get("DB_PORT","5432"))
for _ in range(60):
    try:
        s = socket.create_connection((host, port), 2)
        s.close()
        sys.exit(0)
    except OSError:
        time.sleep(2)
sys.exit(1)
PY
do
  echo "Base de datos sin respuesta, reintentando..."
  sleep 2
done

echo "Aplicando migraciones..."
python manage.py migrate --noinput

echo "Creando superusuario si falta..."
python manage.py create_superuser_if_none || true

echo "Iniciando proceso principal..."
exec "$@"
